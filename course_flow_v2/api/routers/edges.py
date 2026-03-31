"""Edge collection (workflow-scoped) and singular edge resource routes.

Edges use integer primary keys (no UUID column on ``Edge``); flat routes use ``/edge/{edge_id}``.
"""

from __future__ import annotations

from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.deps import (
    get_workflow_graph_mutation_service,
    get_workflow_graph_projection_service,
    get_workflow_service,
)
from course_flow_v2.api.graph_common import graph_mutation_http
from course_flow_v2.api.permissions import can_view_workflow
from course_flow_v2.api.schemas.graph_mutation import (
    GraphEdgeCreateIn,
    GraphMutationEnvelopeOut,
)
from course_flow_v2.api.schemas.workflow_graph import EdgeGraphOut
from course_flow_v2.application.services.workflow_graph_mutation_service import (
    workflow_from_node,
)
from course_flow_v2.core.models import Edge

workflow_edges_router = Router(tags=["edges"])
edge_resource_router = Router(tags=["edges"])


def _ensure_workflow_owner(workflow_uuid: UUID, current_user) -> None:
    svc = get_workflow_service()
    dto = svc.get_by_uuid(workflow_uuid)
    if dto is None:
        raise HttpError(404, "Workflow not found")
    if not can_view_workflow(current_user=current_user, workflow=dto):
        raise HttpError(403, "Forbidden")


@workflow_edges_router.get(
    "/{workflow_uuid}/edges",
    response=list[EdgeGraphOut],
    auth=BearerAuth(),
)
def list_workflow_edges(request, workflow_uuid: UUID):
    current_user = get_current_user(request)
    _ensure_workflow_owner(workflow_uuid, current_user)
    proj = get_workflow_graph_projection_service().get_by_workflow_uuid(workflow_uuid)
    if proj is None:
        raise HttpError(404, "Workflow not found")
    return [EdgeGraphOut.model_validate(x) for x in proj["edges"]]


@workflow_edges_router.post(
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
    return graph_mutation_http(out, err)


@edge_resource_router.get("/{edge_id}", response=EdgeGraphOut, auth=BearerAuth())
def get_edge(request, edge_id: int):
    current_user = get_current_user(request)
    try:
        e = Edge.objects.select_related(
            "source_node__section__workflow",
            "source_node__channel__workflow",
            "target_node__section__workflow",
            "target_node__channel__workflow",
        ).get(pk=edge_id)
    except Edge.DoesNotExist:
        raise HttpError(404, "Not found")

    wf_s = workflow_from_node(e.source_node)
    wf_t = workflow_from_node(e.target_node)
    if wf_s is None or wf_t is None or wf_s.pk != wf_t.pk:
        raise HttpError(404, "Not found")
    if not can_view_workflow(current_user=current_user, workflow=wf_s):
        raise HttpError(403, "Forbidden")
    return EdgeGraphOut(
        id=e.id,
        source_node_uuid=e.source_node.uuid,
        target_node_uuid=e.target_node.uuid,
        line_type=e.line_type,
        source_port=e.source_port,
        target_port=e.target_port,
    )


@edge_resource_router.delete(
    "/{edge_id}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
)
def delete_edge(request, edge_id: int):
    current_user = get_current_user(request)
    svc = get_workflow_graph_mutation_service()
    out, err = svc.delete_edge(
        user_id=current_user.id,
        edge_id=edge_id,
    )
    return graph_mutation_http(out, err)
