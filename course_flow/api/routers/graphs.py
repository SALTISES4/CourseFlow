from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.deps import (
    get_authorization_service,
    get_graph_view_service,
    get_workflow_service,
)
from course_flow.api.permission_context import permission_context_out
from course_flow.api.permissions import has_workflow_permission
from course_flow.api.schemas.graph_view import GraphViewOut
from course_flow.api.schemas.graphs import GraphDetailOut, GraphDetailOutResp
from course_flow.application.dto import WorkflowDTO
from course_flow.core.models import User
from course_flow.core.permissions import WorkflowPermission

router = Router(tags=["graphs"], by_alias=True)


def _workflow_permissions(current_user: User, dto: WorkflowDTO):
    return get_authorization_service().permissions_for_workflow(
        user=current_user,
        workflow=dto,
    )


def _workflow_project_permissions(current_user: User, dto: WorkflowDTO):
    context = get_authorization_service().permissions_for_workflow_project(
        user=current_user,
        workflow=dto,
    )
    return permission_context_out(context) if context is not None else None


def _graph_detail(current_user: User, dto: WorkflowDTO) -> GraphDetailOut:
    return GraphDetailOut(
        uuid=dto.graph_uuid,
        workflow_title=dto.title,
        author_id=dto.author_id,
        workflow_project_id=dto.project_id,
        is_archived=dto.is_archived,
        revision_id=dto.revision_id,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
        permissions=permission_context_out(_workflow_permissions(current_user, dto)),
    )


@router.get(
    "/{uuid}/view",
    response=GraphViewOut,
    auth=BearerAuth(),
    operation_id="getGraphView",
)
def get_graph_view(request, uuid: UUID):
    current_user = get_current_user(request)
    workflow_svc = get_workflow_service()
    workflow_dto = workflow_svc.get_by_workflow_uuid(uuid)

    if workflow_dto is None:
        raise HttpError(404, "Graph not found")

    if not has_workflow_permission(
        current_user=current_user,
        workflow=workflow_dto,
        action=WorkflowPermission.VIEW,
    ):
        raise HttpError(403, "Forbidden")

    graph_view_svc = get_graph_view_service()
    payload = graph_view_svc.get_by_graph_uuid(workflow_dto.graph_uuid)

    if payload is None:
        raise HttpError(404, "Graph not found")

    return GraphViewOut.model_validate(
        {
            **payload,
            "permissions": permission_context_out(
                _workflow_permissions(current_user, workflow_dto)
            ),
            "project_permissions": _workflow_project_permissions(
                current_user,
                workflow_dto,
            ),
        }
    )


@router.get(
    "/{uuid}",
    response=GraphDetailOutResp,
    auth=BearerAuth(),
    operation_id="getGraph",
)
def get_graph(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_workflow_service()
    dto = svc.get_by_graph_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Graph not found")

    if not has_workflow_permission(
        current_user=current_user,
        workflow=dto,
        action=WorkflowPermission.VIEW,
    ):
        raise HttpError(403, "Forbidden")

    return GraphDetailOutResp(item=_graph_detail(current_user, dto))
