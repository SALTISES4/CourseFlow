from typing import Any
from uuid import UUID

from course_flow_v2.application.dto import SectionDTO
from course_flow_v2.core.models import Section, Thread, Workflow


def _to_dto(sec: Section) -> SectionDTO:
    return SectionDTO(
        uuid=sec.uuid,
        workflow_uuid=sec.workflow.uuid,
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
        workflow_uuid: UUID,
        title: str,
        position: int,
        thread_uuid: UUID | None = None,
    ) -> SectionDTO | None:
        try:
            wf = Workflow.objects.get(uuid=workflow_uuid)
        except Workflow.DoesNotExist:
            return None

        thread_id: int | None = None
        if thread_uuid is not None:
            try:
                thread_id = Thread.objects.only("id").get(uuid=thread_uuid).id
            except Thread.DoesNotExist:
                return None

        sec = Section.objects.create(
            workflow=wf,
            title=title,
            position=position,
            thread_id=thread_id,
        )
        sec = Section.objects.select_related("workflow", "thread").get(pk=sec.pk)
        return _to_dto(sec)

    def get_by_uuid(self, uuid: UUID) -> SectionDTO | None:
        try:
            sec = Section.objects.select_related("workflow", "thread").get(uuid=uuid)
        except Section.DoesNotExist:
            return None
        return _to_dto(sec)

    def list_for_workflow_uuid(self, workflow_uuid: UUID) -> list[SectionDTO]:
        qs = (
            Section.objects.filter(workflow__uuid=workflow_uuid)
            .select_related("workflow", "thread")
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
                sec.thread = None
            else:
                try:
                    sec.thread = Thread.objects.get(uuid=thread_uuid)
                except Thread.DoesNotExist:
                    return None

        sec.save()
        sec = Section.objects.select_related("workflow", "thread").get(pk=sec.pk)
        return _to_dto(sec)

    def delete(self, uuid: UUID) -> bool:
        deleted, _ = Section.objects.filter(uuid=uuid).delete()
        return deleted > 0
