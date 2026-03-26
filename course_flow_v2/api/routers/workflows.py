from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.deps import get_workflow_service
from course_flow_v2.api.schemas.workflows import WorkflowCreateIn, WorkflowOut
from course_flow_v2.application.dto import WorkflowDTO

router = Router(tags=["workflows"])


def _workflow_to_out(dto: WorkflowDTO) -> WorkflowOut:
    return WorkflowOut(
        id=dto.id,
        uuid=dto.uuid,
        title=dto.title,
        owner_id=dto.owner_id,
        project_id=dto.project_id,
        unit_uuid=dto.unit_uuid,
        unit_type=dto.unit_type,
        unit_title=dto.unit_title,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
    )


@router.post("", response=WorkflowOut)
def create_workflow(request, payload: WorkflowCreateIn):
    svc = get_workflow_service()
    dto = svc.create(
        owner_id=payload.owner_id,
        project_id=payload.project_id,
        workflow_title=payload.workflow_title,
        unit_title=payload.unit_title,
        unit_type=payload.unit_type.value,
        unit_description=payload.unit_description,
    )
    return _workflow_to_out(dto)


@router.get("/{workflow_uuid}", response=WorkflowOut)
def get_workflow(request, workflow_uuid: UUID):
    svc = get_workflow_service()
    dto = svc.get_by_uuid(workflow_uuid)
    if dto is None:
        raise HttpError(404, "Workflow not found")
    return _workflow_to_out(dto)


@router.get("", response=list[WorkflowOut])
def list_workflows(request):
    svc = get_workflow_service()
    return [_workflow_to_out(r) for r in svc.list_all()]
