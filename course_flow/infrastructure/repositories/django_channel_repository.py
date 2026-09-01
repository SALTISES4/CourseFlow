from typing import Any
from uuid import UUID

from course_flow.application.dto import ChannelDTO
from course_flow.core.models import Channel, Graph, Thread


def _to_dto(ch: Channel) -> ChannelDTO:
    return ChannelDTO(
        uuid=ch.uuid,
        graph_uuid=ch.graph.uuid,
        title=ch.title,
        colour=ch.colour or "",
        position=ch.position,
        thread_uuid=ch.thread.uuid if ch.thread_id else None,
        date_created=ch.date_created,
        modified_on=ch.modified_on,
    )


class DjangoChannelRepository:
    def create(
        self,
        *,
        graph_uuid: UUID,
        title: str,
        position: int,
        thread_uuid: UUID | None = None,
        colour: str | None = None,
    ) -> ChannelDTO | None:
        try:
            graph = Graph.objects.only("id").get(uuid=graph_uuid)
        except Graph.DoesNotExist:
            return None

        thread_id: int | None = None
        if thread_uuid is not None:
            try:
                thread_id = Thread.objects.only("id").get(uuid=thread_uuid).id
            except Thread.DoesNotExist:
                return None

        ch = Channel.objects.create(
            graph_id=graph.id,
            title=title,
            colour=colour or "",
            position=position,
            thread_id=thread_id,
        )
        ch = Channel.objects.select_related("graph", "thread").get(pk=ch.pk)
        return _to_dto(ch)

    def get_by_uuid(self, uuid: UUID) -> ChannelDTO | None:
        try:
            ch = Channel.objects.select_related("graph", "thread").get(uuid=uuid)
        except Channel.DoesNotExist:
            return None
        return _to_dto(ch)

    def list_for_graph_uuid(self, graph_uuid: UUID) -> list[ChannelDTO]:
        graph = Graph.objects.only("id").filter(uuid=graph_uuid).first()
        if graph is None:
            return []

        qs = (
            Channel.objects.filter(graph_id=graph.id)
            .select_related("graph", "thread")
            .order_by("position", "id")
        )
        return [_to_dto(ch) for ch in qs]

    def update(self, uuid: UUID, updates: dict[str, Any]) -> ChannelDTO | None:
        try:
            ch = Channel.objects.get(uuid=uuid)
        except Channel.DoesNotExist:
            return None

        if "title" in updates:
            ch.title = updates["title"]
        if "colour" in updates:
            ch.colour = updates["colour"] or ""
        if "position" in updates:
            ch.position = updates["position"]
        if "thread_uuid" in updates:
            thread_uuid = updates["thread_uuid"]
            if thread_uuid is None:
                ch.thread_id = None
            else:
                try:
                    ch.thread_id = Thread.objects.only("id").get(uuid=thread_uuid).id
                except Thread.DoesNotExist:
                    return None

        ch.save()
        ch = Channel.objects.select_related("graph", "thread").get(pk=ch.pk)
        return _to_dto(ch)

    def delete(self, uuid: UUID) -> bool:
        deleted, _ = Channel.objects.filter(uuid=uuid).delete()
        return deleted > 0
