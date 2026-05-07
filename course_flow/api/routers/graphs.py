from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.deps import (
    get_graph_projection_service,
    get_graph_service,
)
from course_flow.api.permissions import can_view_graph
from course_flow.api.schemas.graph_view import GraphViewOut
from course_flow.api.schemas.graphs import (
    GraphCreateIn,
    GraphDetailOut,
    GraphDetailOutResp,
    GraphListItemOut,
    GraphListMetaOut,
    GraphListOut,
)
from course_flow.application.dto import GraphDTO

router = Router(tags=["graphs"], by_alias=True)


def _graph_detail(dto: GraphDTO) -> GraphDetailOut:
    return GraphDetailOut(
        uuid=dto.uuid,
        workflow_title=dto.workflow_title,
        author_id=dto.author_id,
        workflow_project_id=dto.workflow_project_id,
        revision_id=dto.revision_id,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
    )


def _graph_list_item(dto: GraphDTO) -> GraphListItemOut:
    return GraphListItemOut(
        uuid=dto.uuid,
        workflow_title=dto.workflow_title,
        author_id=dto.author_id,
        workflow_project_id=dto.workflow_project_id,
        revision_id=dto.revision_id,
        modified_on=dto.modified_on,
    )


@router.post(
    "",
    response=GraphDetailOut,
    auth=BearerAuth(),
    operation_id="createGraph",
)
def create_graph(request, payload: GraphCreateIn):

    current_user = get_current_user(request)
    svc = get_graph_service()

    dto = svc.create(
        author_id=current_user.id,
        workflow_project_id=payload.workflow_project_id,
        workflow_title=payload.workflow_title,
        workflow_type=payload.workflow_type.value,
        workflow_description=payload.workflow_description,
    )
    return _graph_detail(dto)


@router.get(
    "/{uuid}/view",
    response=GraphViewOut,
    auth=BearerAuth(),
    operation_id="getGraphView",
)
def get_graph_view(request, uuid: UUID):
    current_user = get_current_user(request)
    graph_svc = get_graph_service()
    graph_dto = graph_svc.get_by_uuid(uuid)

    if graph_dto is None:
        raise HttpError(404, "Graph not found")

    if not can_view_graph(current_user=current_user, graph=graph_dto):
        raise HttpError(403, "Forbidden")

    graph_projection_svc = get_graph_projection_service()
    payload = graph_projection_svc.get_by_graph_uuid(uuid)

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
    svc = get_graph_service()
    dto = svc.get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Graph not found")

    if not can_view_graph(current_user=current_user, graph=dto):
        raise HttpError(403, "Forbidden")

    return GraphDetailOutResp(item=_graph_detail(dto))


@router.get(
    "", response=GraphListOut, auth=BearerAuth(), operation_id="listGraphs"
)
def list_graphs(request):
    current_user = get_current_user(request)
    svc = get_graph_service()
    rows = svc.list_for_author(current_user.id)
    items = [_graph_list_item(r) for r in rows]
    return GraphListOut(items=items, meta=GraphListMetaOut(total=len(items)))
