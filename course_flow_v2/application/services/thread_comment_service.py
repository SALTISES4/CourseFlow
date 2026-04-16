from __future__ import annotations

from typing import Literal
from uuid import UUID

from course_flow_v2.application.dto import CommentAuthorDTO, CommentDTO
from course_flow_v2.core.models import (
    Channel,
    Comment,
    Graph,
    Node,
    Outcome,
    Section,
    Thread,
)


class ThreadCommentService:
    """
    Lazy-load comments for a thread; authorization matches graph ownership
    (same mental model as ``GET /graphs/{uuid}/view``).
    """

    def _graph_for_thread(self, thread: Thread) -> Graph | None:
        s = (
            Section.objects.filter(thread_id=thread.id)
            .select_related("graph")
            .first()
        )
        if s is not None:
            return s.graph

        c = (
            Channel.objects.filter(thread_id=thread.id)
            .select_related("graph")
            .first()
        )
        if c is not None:
            return c.graph

        n = (
            Node.objects.filter(thread_id=thread.id)
            .select_related("section__graph", "channel__graph")
            .first()
        )
        if n is not None:
            if n.section_id is not None:
                return n.section.graph
            if n.channel_id is not None:
                return n.channel.graph

        o = (
            Outcome.objects.filter(thread_id=thread.id)
            .select_related("graph")
            .first()
        )
        if o is not None:
            return o.graph

        return None

    def _get_authorized_thread(
        self, thread_uuid: UUID, requester_user_id: int
    ) -> Thread | None:
        """Return the thread if it exists, is in a graph context, and requester owns the graph.

        Returns ``None`` if the thread does not exist or has no graph context.
        Raises ``PermissionError`` if the graph is owned by another user.
        """
        try:
            thread = Thread.objects.get(uuid=thread_uuid)
        except Thread.DoesNotExist:
            return None

        graph = self._graph_for_thread(thread)
        if graph is None:
            return None

        if graph.owner_id != requester_user_id:
            raise PermissionError

        return thread

    def list_comments_for_user(
        self,
        thread_uuid: UUID,
        requester_user_id: int,
    ) -> list[CommentDTO] | None:
        """
        Returns ``None`` if the thread does not exist or is not attached to any graph
        context we can authorize (treated as not found).

        Raises ``PermissionError`` if the thread is in a graph owned by another user.
        """
        try:
            thread = self._get_authorized_thread(thread_uuid, requester_user_id)
        except PermissionError:
            raise
        if thread is None:
            return None

        rows = (
            Comment.objects.filter(thread_id=thread.id)
            .select_related("owner")
            .order_by("date_created", "id")
        )
        return [self._to_dto(c, thread.uuid) for c in rows]

    def create_comment(
        self,
        thread_uuid: UUID,
        requester_user_id: int,
        body: str,
    ) -> CommentDTO | None:
        """Create a comment on the thread as the current user.

        Returns ``None`` if the thread cannot be resolved or authorized like list.
        Raises ``ValueError`` if ``body`` is empty after strip.
        Raises ``PermissionError`` if the graph is owned by another user.
        """
        text = body.strip()
        if not text:
            raise ValueError("Comment body must be non-empty")

        try:
            thread = self._get_authorized_thread(thread_uuid, requester_user_id)
        except PermissionError:
            raise
        if thread is None:
            return None

        c = Comment.objects.create(
            thread=thread,
            owner_id=requester_user_id,
            body=text,
        )
        c = Comment.objects.select_related("owner").get(pk=c.pk)
        return self._to_dto(c, thread.uuid)

    def delete_comment(
        self,
        thread_uuid: UUID,
        comment_uuid: UUID,
        requester_user_id: int,
    ) -> Literal["deleted", "not_found", "comment_not_found", "wrong_thread"]:
        """Delete a single comment. Raises ``PermissionError`` if not graph owner."""
        try:
            thread = self._get_authorized_thread(thread_uuid, requester_user_id)
        except PermissionError:
            raise
        if thread is None:
            return "not_found"

        qs = Comment.objects.filter(uuid=comment_uuid, thread_id=thread.id)
        deleted, _ = qs.delete()
        if deleted:
            return "deleted"
        if Comment.objects.filter(uuid=comment_uuid).exists():
            return "wrong_thread"
        return "comment_not_found"

    def delete_all_comments(
        self, thread_uuid: UUID, requester_user_id: int
    ) -> int | None:
        """Delete all comments on the thread. Returns deleted row count, or ``None`` if thread not found.

        Raises ``PermissionError`` if not graph owner.
        """
        try:
            thread = self._get_authorized_thread(thread_uuid, requester_user_id)
        except PermissionError:
            raise
        if thread is None:
            return None
        count, _ = Comment.objects.filter(thread_id=thread.id).delete()
        return count

    def _to_dto(self, c: Comment, thread_uuid: UUID) -> CommentDTO:
        owner = c.owner
        return CommentDTO(
            uuid=c.uuid,
            thread_uuid=thread_uuid,
            body=c.body,
            date_created=c.date_created,
            modified_on=c.modified_on,
            author=CommentAuthorDTO(
                uuid=owner.uuid,
                email=owner.email,
                first_name=owner.first_name,
                last_name=owner.last_name,
            ),
        )
