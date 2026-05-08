from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.deps import get_graph_view_service, get_workflow_service
from course_flow.api.permissions import can_view_graph
from course_flow.api.schemas.graph_view import GraphViewOut
from course_flow.api.schemas.graphs import GraphDetailOut, GraphDetailOutResp
from course_flow.application.dto import WorkflowDTO

router = Router(tags=["graphs"], by_alias=True)


def _graph_detail(dto: WorkflowDTO) -> GraphDetailOut:
    return GraphDetailOut(
        uuid=dto.graph_uuid,
        workflow_title=dto.title,
        author_id=dto.author_id,
        workflow_project_id=dto.project_id,
        revision_id=dto.revision_id,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
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
    workflow_dto = workflow_svc.get_by_graph_uuid(uuid)

    if workflow_dto is None:
        raise HttpError(404, "Graph not found")

    if not can_view_graph(current_user=current_user, graph=workflow_dto):
        raise HttpError(403, "Forbidden")

    graph_view_svc = get_graph_view_service()
    payload = graph_view_svc.get_by_graph_uuid(uuid)

    if payload is None:
        raise HttpError(404, "Graph not found")

    return GraphViewOut.model_validate(payload)


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

    if not can_view_graph(current_user=current_user, graph=dto):
        raise HttpError(403, "Forbidden")

    return GraphDetailOutResp(item=_graph_detail(dto))


