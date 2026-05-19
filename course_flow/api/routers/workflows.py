from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.deps import get_workflow_service
from course_flow.api.permissions import can_view_graph
from course_flow.api.schemas.workflows import (
    WorkflowCreateIn,
    WorkflowDetailOut,
    WorkflowDetailOutResp,
    WorkflowListItemOut,
    WorkflowListMetaOut,
    WorkflowListOut,
    WorkflowUpdateIn,
)
from course_flow.application.dto import WorkflowDTO

router = Router(tags=["workflows"], by_alias=True)


def _workflow_detail(dto: WorkflowDTO) -> WorkflowDetailOut:
    return WorkflowDetailOut(
        uuid=dto.workflow_uuid,
        graph_uuid=dto.graph_uuid,
        title=dto.title,
        description=dto.description,
        workflow_type=dto.workflow_type,
        author_id=dto.author_id,
        project_id=dto.project_id,
        revision_id=dto.revision_id,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
    )


def _workflow_list_item(dto: WorkflowDTO) -> WorkflowListItemOut:
    return WorkflowListItemOut(
        uuid=dto.workflow_uuid,
        graph_uuid=dto.graph_uuid,
        title=dto.title,
        author_id=dto.author_id,
        project_id=dto.project_id,
        workflow_type=dto.workflow_type,
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
    try:
        dto = svc.create(
            author_id=current_user.id,
            project_id=payload.project_id,
            title=payload.title,
            workflow_type=payload.workflow_type.value,
            description=payload.description,
        )
    except ValueError as exc:
        raise HttpError(422, str(exc)) from exc
    return _workflow_detail(dto)


@router.get(
    "/{uuid}",
    response=WorkflowDetailOutResp,
    auth=BearerAuth(),
    operation_id="getWorkflow",
)
def get_workflow(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_workflow_service()
    dto = svc.get_by_workflow_uuid(uuid)
    if dto is None:
        raise HttpError(404, "Workflow not found")
    if not can_view_graph(current_user=current_user, graph=dto):
        raise HttpError(403, "Forbidden")
    return WorkflowDetailOutResp(item=_workflow_detail(dto))


@router.patch(
    "/{uuid}",
    response=WorkflowDetailOutResp,
    auth=BearerAuth(),
    operation_id="updateWorkflow",
)
def update_workflow(request, uuid: UUID, payload: WorkflowUpdateIn):
    current_user = get_current_user(request)
    svc = get_workflow_service()
    existing = svc.get_by_workflow_uuid(uuid)
    if existing is None:
        raise HttpError(404, "Workflow not found")
    if not can_view_graph(current_user=current_user, graph=existing):
        raise HttpError(403, "Forbidden")
    updates = payload.model_dump(exclude_unset=True)
    dto = svc.update_by_workflow_uuid(uuid, updates)
    if dto is None:
        raise HttpError(404, "Workflow not found")
    return WorkflowDetailOutResp(item=_workflow_detail(dto))


@router.get(
    "",
    response=WorkflowListOut,
    auth=BearerAuth(),
    operation_id="listWorkflows",
)
def list_workflows(request):
    current_user = get_current_user(request)
    svc = get_workflow_service()
    rows = svc.list_for_author(current_user.id)
    items = [_workflow_list_item(r) for r in rows]
    return WorkflowListOut(items=items, meta=WorkflowListMetaOut(total=len(items)))
