from uuid import UUID

from django.db import transaction

from course_flow_v2.application.dto import WorkflowDTO
from course_flow_v2.core.models import Unit, Workflow


def _to_dto(w: Workflow) -> WorkflowDTO:
    unit = w.unit
    return WorkflowDTO(
        id=w.id,
        uuid=w.uuid,
        title=w.title,
        owner_id=w.owner_id,
        project_id=w.project_id,
        unit_uuid=unit.uuid,
        unit_type=unit.unit_type,
        unit_title=unit.title,
        date_created=w.date_created,
        modified_on=w.modified_on,
    )


class DjangoWorkflowRepository:
    @transaction.atomic
    def create(
        self,
        *,
        owner_id: int,
        project_id: int | None,
        workflow_title: str,
        unit_title: str,
        unit_type: str,
        unit_description: str,
    ) -> WorkflowDTO:
        w = Workflow.objects.create(
            owner_id=owner_id,
            project_id=project_id,
            title=workflow_title,
        )
        Unit.objects.create(
            workflow=w,
            title=unit_title,
            description=unit_description,
            unit_type=unit_type,
        )
        w.refresh_from_db()
        return _to_dto(w)

    def get_by_uuid(self, uuid: UUID) -> WorkflowDTO | None:
        w = (
            Workflow.objects.select_related("unit", "project")
            .filter(uuid=uuid)
            .first()
        )
        return _to_dto(w) if w else None

    def list_all(self) -> list[WorkflowDTO]:
        qs = Workflow.objects.select_related("unit", "project").order_by("-modified_on")
        return [_to_dto(w) for w in qs]
