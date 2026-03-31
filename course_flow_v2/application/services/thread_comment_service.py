from __future__ import annotations

from uuid import UUID

from course_flow_v2.application.dto import CommentAuthorDTO, CommentDTO
from course_flow_v2.core.models import (
    Channel,
    Comment,
    Node,
    Outcome,
    Section,
    Thread,
    Workflow,
)


class ThreadCommentService:
    """
    Lazy-load comments for a thread; authorization matches workflow ownership
    (same mental model as ``GET /workflows/{uuid}/graph``).
    """

    def _workflow_for_thread(self, thread: Thread) -> Workflow | None:
        s = (
            Section.objects.filter(thread_id=thread.id)
            .select_related("workflow")
            .first()
        )
        if s is not None:
            return s.workflow

        c = (
            Channel.objects.filter(thread_id=thread.id)
            .select_related("workflow")
            .first()
        )
        if c is not None:
            return c.workflow

        n = (
            Node.objects.filter(thread_id=thread.id)
            .select_related("section__workflow", "channel__workflow")
            .first()
        )
        if n is not None:
            if n.section_id is not None:
                return n.section.workflow
            if n.channel_id is not None:
                return n.channel.workflow

        o = (
            Outcome.objects.filter(thread_id=thread.id)
            .select_related("workflow")
            .first()
        )
        if o is not None:
            return o.workflow

        return None

    def list_comments_for_user(
        self,
        thread_uuid: UUID,
        requester_user_id: int,
    ) -> list[CommentDTO] | None:
        """
        Returns ``None`` if the thread does not exist or is not attached to any workflow
        context we can authorize (treated as not found).

        Raises ``PermissionError`` if the thread is in a workflow owned by another user.
        """
        try:
            thread = Thread.objects.get(uuid=thread_uuid)
        except Thread.DoesNotExist:
            return None

        workflow = self._workflow_for_thread(thread)
        if workflow is None:
            return None

        if workflow.owner_id != requester_user_id:
            raise PermissionError

        rows = (
            Comment.objects.filter(thread_id=thread.id)
            .select_related("owner")
            .order_by("date_created", "id")
        )
        return [self._to_dto(c, thread.uuid) for c in rows]

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
