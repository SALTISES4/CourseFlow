from typing import Any
from uuid import UUID

from course_flow.application.dto import SectionDTO
from course_flow.core.models import Graph, Section, Thread


def _to_dto(sec: Section) -> SectionDTO:
    return SectionDTO(
        uuid=sec.uuid,
        graph_uuid=sec.graph.uuid,
        title=sec.title,
        position=sec.position,
        thread_uuid=sec.thread.uuid if sec.thread_id else None,
        date_created=sec.date_created,
        modified_on=sec.modified_on,
    )


class DjangoSectionRepository:
    def create(
        self,
        *,
        graph_uuid: UUID,
        title: str,
        position: int,
        thread_uuid: UUID | None = None,
    ) -> SectionDTO | None:
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

        sec = Section.objects.create(
            graph_id=graph.id,
            title=title,
            position=position,
            thread_id=thread_id,
        )
        sec = Section.objects.select_related("graph", "thread").get(pk=sec.pk)
        return _to_dto(sec)

    def get_by_uuid(self, uuid: UUID) -> SectionDTO | None:
        try:
            sec = Section.objects.select_related("graph", "thread").get(uuid=uuid)
        except Section.DoesNotExist:
            return None
        return _to_dto(sec)

    def list_for_graph_uuid(self, graph_uuid: UUID) -> list[SectionDTO]:
        graph = Graph.objects.only("id").filter(uuid=graph_uuid).first()
        if graph is None:
            return []

        qs = (
            Section.objects.filter(graph_id=graph.id)
            .select_related("graph", "thread")
            .order_by("position", "id")
        )
        return [_to_dto(sec) for sec in qs]

    def update(self, uuid: UUID, updates: dict[str, Any]) -> SectionDTO | None:
        try:
            sec = Section.objects.get(uuid=uuid)
        except Section.DoesNotExist:
            return None

        if "title" in updates:
            sec.title = updates["title"]
        if "position" in updates:
            sec.position = updates["position"]
        if "thread_uuid" in updates:
            thread_uuid = updates["thread_uuid"]
            if thread_uuid is None:
                sec.thread_id = None
            else:
                try:
                    sec.thread_id = Thread.objects.only("id").get(uuid=thread_uuid).id
                except Thread.DoesNotExist:
                    return None

        sec.save()
        sec = Section.objects.select_related("graph", "thread").get(pk=sec.pk)
        return _to_dto(sec)

    def delete(self, uuid: UUID) -> bool:
        deleted, _ = Section.objects.filter(uuid=uuid).delete()
        return deleted > 0
