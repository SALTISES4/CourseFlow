from typing import Any
from uuid import UUID

from course_flow_v2.application.dto import ChannelDTO
from course_flow_v2.core.models import Channel, Thread, Workflow


def _to_dto(ch: Channel) -> ChannelDTO:
    return ChannelDTO(
        uuid=ch.uuid,
        workflow_uuid=ch.workflow.uuid,
        title=ch.title,
        position=ch.position,
        thread_uuid=ch.thread.uuid if ch.thread_id else None,
        date_created=ch.date_created,
        modified_on=ch.modified_on,
    )


class DjangoChannelRepository:
    def create(
        self,
        *,
        workflow_uuid: UUID,
        title: str,
        position: int,
        thread_uuid: UUID | None = None,
    ) -> ChannelDTO | None:
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

        ch = Channel.objects.create(
            workflow=wf,
            title=title,
            position=position,
            thread_id=thread_id,
        )
        ch = Channel.objects.select_related("workflow", "thread").get(pk=ch.pk)
        return _to_dto(ch)

    def get_by_uuid(self, uuid: UUID) -> ChannelDTO | None:
        try:
            ch = Channel.objects.select_related("workflow", "thread").get(uuid=uuid)
        except Channel.DoesNotExist:
            return None
        return _to_dto(ch)

    def list_for_workflow_uuid(self, workflow_uuid: UUID) -> list[ChannelDTO]:
        qs = (
            Channel.objects.filter(workflow__uuid=workflow_uuid)
            .select_related("workflow", "thread")
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
        if "position" in updates:
            ch.position = updates["position"]
        if "thread_uuid" in updates:
            thread_uuid = updates["thread_uuid"]
            if thread_uuid is None:
                ch.thread = None
            else:
                try:
                    ch.thread = Thread.objects.get(uuid=thread_uuid)
                except Thread.DoesNotExist:
                    return None

        ch.save()
        ch = Channel.objects.select_related("workflow", "thread").get(pk=ch.pk)
        return _to_dto(ch)

    def delete(self, uuid: UUID) -> bool:
        deleted, _ = Channel.objects.filter(uuid=uuid).delete()
        return deleted > 0
