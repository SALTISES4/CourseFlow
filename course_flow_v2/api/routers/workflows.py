from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.deps import (
    get_workflow_graph_projection_service,
    get_workflow_service,
)
from course_flow_v2.api.permissions import can_view_workflow
from course_flow_v2.api.schemas.workflow_graph import WorkflowGraphOut
from course_flow_v2.api.schemas.workflows import (
    WorkflowCreateIn,
    WorkflowDetailOut,
    WorkflowDetailOutResp,
    WorkflowListItemOut,
    WorkflowListMetaOut,
    WorkflowListOut,
)
from course_flow_v2.application.dto import WorkflowDTO

router = Router(tags=["workflows"])


def _workflow_detail(dto: WorkflowDTO) -> WorkflowDetailOut:
    return WorkflowDetailOut(
        uuid=dto.uuid,
        title=dto.title,
        owner_id=dto.owner_id,
        project_id=dto.project_id,
        revision_id=dto.revision_id,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
    )


def _workflow_list_item(dto: WorkflowDTO) -> WorkflowListItemOut:
    return WorkflowListItemOut(
        uuid=dto.uuid,
        title=dto.title,
        owner_id=dto.owner_id,
        project_id=dto.project_id,
        revision_id=dto.revision_id,
        modified_on=dto.modified_on,
    )


@router.post(
    "",
    response=WorkflowDetailOut,
    auth=BearerAuth(),
    operation_id="createWorkflow",
)
def create_workflow(request, payload: WorkflowCreateIn):

    current_user = get_current_user(request)
    svc = get_workflow_service()

    dto = svc.create(
        owner_id=current_user.id,
        project_id=payload.project_id,
        workflow_title=payload.workflow_title,
        unit_title=payload.unit_title,
        unit_type=payload.unit_type.value,
        unit_description=payload.unit_description,
    )
    return _workflow_detail(dto)


@router.get(
    "/{uuid}/graph",
    response=WorkflowGraphOut,
    auth=BearerAuth(),
    operation_id="getWorkflowGraph",
)
def get_workflow_graph(request, uuid: UUID):
    current_user = get_current_user(request)
    wf_svc = get_workflow_service()
    wf = wf_svc.get_by_uuid(uuid)

    if wf is None:
        raise HttpError(404, "Workflow not found")

    if not can_view_workflow(current_user=current_user, workflow=wf):
        raise HttpError(403, "Forbidden")

    graph_svc = get_workflow_graph_projection_service()
    payload = graph_svc.get_by_uuid(uuid)

    if payload is None:
        raise HttpError(404, "Workflow not found")

    return payload


@router.get(
    "/{uuid}",
    response=WorkflowDetailOutResp,
    auth=BearerAuth(),
    operation_id="getWorkflow",
)
def get_workflow(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_workflow_service()
    dto = svc.get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Workflow not found")

    if not can_view_workflow(current_user=current_user, workflow=dto):
        raise HttpError(403, "Forbidden")

    return WorkflowDetailOutResp(item=_workflow_detail(dto))


@router.get(
    "", response=WorkflowListOut, auth=BearerAuth(), operation_id="listWorkflows"
)
def list_workflows(request):
    current_user = get_current_user(request)
    svc = get_workflow_service()
    rows = svc.list_for_owner(current_user.id)
    items = [_workflow_list_item(r) for r in rows]
    return WorkflowListOut(items=items, meta=WorkflowListMetaOut(total=len(items)))
