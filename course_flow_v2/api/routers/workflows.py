from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.deps import (
    get_workflow_graph_mutation_service,
    get_workflow_graph_projection_service,
    get_workflow_service,
)
from course_flow_v2.api.schemas.graph_mutation import (
    GraphEdgeCreateIn,
    GraphMutationEnvelopeOut,
    GraphNodeCreateIn,
    GraphNodePatchIn,
)
from course_flow_v2.api.schemas.workflow_graph import WorkflowGraphOut
from course_flow_v2.api.schemas.workflows import (
    WorkflowCreateIn,
    WorkflowDetailOut,
    WorkflowListItemOut,
)
from course_flow_v2.application.dto import WorkflowDTO

router = Router(tags=["workflows"])


def _graph_mutation_http(
    payload: dict | None,
    err: str | None,
) -> GraphMutationEnvelopeOut:
    if err == "forbidden":
        raise HttpError(403, "Forbidden")
    if err == "bad_request":
        raise HttpError(400, "Bad request")
    if err == "not_found" or payload is None:
        raise HttpError(404, "Not found")
    return GraphMutationEnvelopeOut.model_validate(payload)


def _workflow_detail(dto: WorkflowDTO) -> WorkflowDetailOut:
    return WorkflowDetailOut(
        id=dto.id,
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
        id=dto.id,
        uuid=dto.uuid,
        title=dto.title,
        owner_id=dto.owner_id,
        project_id=dto.project_id,
        revision_id=dto.revision_id,
        modified_on=dto.modified_on,
    )


@router.post("", response=WorkflowDetailOut, auth=BearerAuth())
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


@router.get("/{workflow_uuid}/graph", response=WorkflowGraphOut, auth=BearerAuth())
def get_workflow_graph(request, workflow_uuid: UUID):
    current_user = get_current_user(request)
    wf_svc = get_workflow_service()
    wf = wf_svc.get_by_uuid(workflow_uuid)
    if wf is None:
        raise HttpError(404, "Workflow not found")
    if wf.owner_id != current_user.id:
        raise HttpError(403, "Forbidden")

    graph_svc = get_workflow_graph_projection_service()
    payload = graph_svc.get_by_workflow_uuid(workflow_uuid)
    if payload is None:
        raise HttpError(404, "Workflow not found")
    return payload


@router.delete(
    "/{workflow_uuid}/nodes/{node_uuid}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
)
def delete_workflow_node(request, workflow_uuid: UUID, node_uuid: UUID):
    current_user = get_current_user(request)
    svc = get_workflow_graph_mutation_service()
    payload, err = svc.delete_node(
        workflow_uuid=workflow_uuid,
        user_id=current_user.id,
        node_uuid=node_uuid,
    )
    return _graph_mutation_http(payload, err)


@router.post(
    "/{workflow_uuid}/nodes",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
)
def create_workflow_node(request, workflow_uuid: UUID, payload: GraphNodeCreateIn):
    current_user = get_current_user(request)
    svc = get_workflow_graph_mutation_service()
    out, err = svc.create_node(
        workflow_uuid=workflow_uuid,
        user_id=current_user.id,
        section_uuid=payload.section_uuid,
        channel_uuid=payload.channel_uuid,
        section_row=payload.section_row,
        unit_uuid=payload.unit_uuid,
    )
    return _graph_mutation_http(out, err)


@router.patch(
    "/{workflow_uuid}/nodes/{node_uuid}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
)
def update_workflow_node(
    request,
    workflow_uuid: UUID,
    node_uuid: UUID,
    payload: GraphNodePatchIn,
):
    current_user = get_current_user(request)
    patch = payload.model_dump(exclude_unset=True)
    svc = get_workflow_graph_mutation_service()
    out, err = svc.update_node(
        workflow_uuid=workflow_uuid,
        user_id=current_user.id,
        node_uuid=node_uuid,
        patch=patch,
    )
    return _graph_mutation_http(out, err)


@router.post(
    "/{workflow_uuid}/edges",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
)
def create_workflow_edge(request, workflow_uuid: UUID, payload: GraphEdgeCreateIn):
    current_user = get_current_user(request)
    svc = get_workflow_graph_mutation_service()
    out, err = svc.create_edge(
        workflow_uuid=workflow_uuid,
        user_id=current_user.id,
        source_node_uuid=payload.source_node_uuid,
        target_node_uuid=payload.target_node_uuid,
        line_type=payload.line_type,
        source_port=payload.source_port,
        target_port=payload.target_port,
    )
    return _graph_mutation_http(out, err)


@router.delete(
    "/{workflow_uuid}/edges/{edge_id}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
)
def delete_workflow_edge(request, workflow_uuid: UUID, edge_id: int):
    current_user = get_current_user(request)
    svc = get_workflow_graph_mutation_service()
    out, err = svc.delete_edge(
        workflow_uuid=workflow_uuid,
        user_id=current_user.id,
        edge_id=edge_id,
    )
    return _graph_mutation_http(out, err)


@router.get("/{workflow_uuid}", response=WorkflowDetailOut, auth=BearerAuth())
def get_workflow(request, workflow_uuid: UUID):
    current_user = get_current_user(request)
    svc = get_workflow_service()
    dto = svc.get_by_uuid(workflow_uuid)
    if dto is None:
        raise HttpError(404, "Workflow not found")
    if dto.owner_id != current_user.id:
        raise HttpError(403, "Forbidden")
    return _workflow_detail(dto)


@router.get("", response=list[WorkflowListItemOut], auth=BearerAuth())
def list_workflows(request):
    current_user = get_current_user(request)
    svc = get_workflow_service()
    rows = svc.list_for_owner(current_user.id)
    return [_workflow_list_item(r) for r in rows]
