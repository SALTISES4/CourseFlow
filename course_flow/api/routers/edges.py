"""Edge collection (graph-scoped) and singular edge resource routes.

Edges use integer primary keys (no UUID column on ``Edge``); flat routes use ``/edge/{edge_id}``.
"""

from __future__ import annotations

from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.deps import (
    get_graph_mutation_service,
    get_graph_view_service,
    get_workflow_service,
)
from course_flow.api.graph_common import graph_mutation_http
from course_flow.api.permissions import can_view_graph
from course_flow.api.schemas.graph_mutation import (
    GraphEdgeCreateIn,
    GraphEdgePatchIn,
    GraphMutationEnvelopeOut,
)
from course_flow.api.schemas.graph_view import EdgeGraphOut
from course_flow.application.services.graph_mutation_service import (
    graph_from_node,
)
from course_flow.core.models import Edge

graph_edges_router = Router(tags=["edges"], by_alias=True)
edge_resource_router = Router(tags=["edges"], by_alias=True)


def _ensure_graph_owner(uuid: UUID, current_user) -> None:
    svc = get_workflow_service()
    dto = svc.get_by_graph_uuid(uuid)
    if dto is None:
        raise HttpError(404, "Graph not found")
    if not can_view_graph(current_user=current_user, graph=dto):
        raise HttpError(403, "Forbidden")


@graph_edges_router.get(
    "/{uuid}/edges",
    response=list[EdgeGraphOut],
    auth=BearerAuth(),
    operation_id="listGraphEdges",
)
def list_graph_edges(request, uuid: UUID):
    current_user = get_current_user(request)
    _ensure_graph_owner(uuid, current_user)
    view = get_graph_view_service().get_by_graph_uuid(uuid)
    if view is None:
        raise HttpError(404, "Graph not found")
    return [EdgeGraphOut.model_validate(x) for x in view["edges"]]


@graph_edges_router.post(
    "/{uuid}/edges",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="createGraphEdge",
)
def create_graph_edge(request, uuid: UUID, payload: GraphEdgeCreateIn):
    current_user = get_current_user(request)
    svc = get_graph_mutation_service()
    out, err = svc.create_edge(
        graph_uuid=uuid,
        user_id=current_user.id,
        source_node_uuid=payload.source_node_uuid,
        target_node_uuid=payload.target_node_uuid,
        line_type=payload.line_type,
        source_port=payload.source_port,
        target_port=payload.target_port,
    )
    return graph_mutation_http(out, err)


@edge_resource_router.get(
    "/{edge_id}",
    response=EdgeGraphOut,
    auth=BearerAuth(),
    operation_id="getEdge",
)
def get_edge(request, edge_id: int):
    current_user = get_current_user(request)
    try:
        e = Edge.objects.select_related(
            "source_node__section__graph",
            "source_node__channel__graph",
            "target_node__section__graph",
            "target_node__channel__graph",
        ).get(pk=edge_id)
    except Edge.DoesNotExist:
        raise HttpError(404, "Not found")

    wf_s = graph_from_node(e.source_node)
    wf_t = graph_from_node(e.target_node)

    if wf_s is None or wf_t is None or wf_s.pk != wf_t.pk:
        raise HttpError(404, "Not found")

    if not can_view_graph(current_user=current_user, graph=wf_s):
        raise HttpError(403, "Forbidden")

    return EdgeGraphOut(
        id=e.id,
        source_node_uuid=e.source_node.uuid,
        target_node_uuid=e.target_node.uuid,
        title=e.title or "",
        text_position=e.text_position,
        line_type=e.line_type,
        source_port=e.source_port,
        target_port=e.target_port,
    )


@edge_resource_router.patch(
    "/{edge_id}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="updateEdge",
)
def update_edge(request, edge_id: int, payload: GraphEdgePatchIn):
    current_user = get_current_user(request)
    svc = get_graph_mutation_service()
    updates = payload.model_dump(exclude_unset=True)
    out, err = svc.update_edge(
        user_id=current_user.id,
        edge_id=edge_id,
        title=updates.get("title"),
        text_position=updates.get("text_position"),
        line_type=updates.get("line_type"),
    )
    return graph_mutation_http(out, err)


@edge_resource_router.delete(
    "/{edge_id}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="deleteEdge",
)
def delete_edge(request, edge_id: int):
    current_user = get_current_user(request)
    svc = get_graph_mutation_service()
    out, err = svc.delete_edge(
        user_id=current_user.id,
        edge_id=edge_id,
    )
    return graph_mutation_http(out, err)
