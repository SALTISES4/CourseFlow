"""Node collection (graph-scoped) and singular node resource routes."""

from __future__ import annotations

from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.deps import (
    get_graph_mutation_service,
    get_graph_projection_service,
    get_graph_service,
)
from course_flow.api.graph_common import graph_mutation_http
from course_flow.api.permissions import can_view_graph
from course_flow.api.schemas.graph_mutation import (
    GraphMutationEnvelopeOut,
    GraphNodeCreateIn,
    GraphNodePatchIn,
)
from course_flow.api.schemas.graph_view import NodeGraphOut
from course_flow.application.services.graph_mutation_service import (
    graph_from_node,
)
from course_flow.core.models import Node

# Mounted at /graph — collection list/create under parent context.
graph_collection_router = Router(tags=["nodes"], by_alias=True)

# Mounted at /node — direct resource by node UUID.
node_resource_router = Router(tags=["nodes"], by_alias=True)


def _node_graph_out(n: Node) -> NodeGraphOut:
    return NodeGraphOut(
        uuid=n.uuid,
        section_uuid=n.section.uuid if n.section_id else None,
        channel_uuid=n.channel.uuid if n.channel_id else None,
        section_row=n.section_row,
        workflow_uuid=n.workflow.uuid if n.workflow_id else None,
        thread_uuid=n.thread.uuid if n.thread_id else None,
        outcome_uuids=[o.uuid for o in n.outcomes.all()],
    )


def _ensure_graph_owner(uuid: UUID, current_user) -> None:
    svc = get_graph_service()
    dto = svc.get_by_uuid(uuid)
    if dto is None:
        raise HttpError(404, "Graph not found")
    if not can_view_graph(current_user=current_user, graph=dto):
        raise HttpError(403, "Forbidden")


@graph_collection_router.get(
    "/{uuid}/nodes",
    response=list[NodeGraphOut],
    auth=BearerAuth(),
    operation_id="listGraphNodes",
)
def list_graph_nodes(request, uuid: UUID):
    current_user = get_current_user(request)
    _ensure_graph_owner(uuid, current_user)
    proj = get_graph_projection_service().get_by_graph_uuid(uuid)
    if proj is None:
        raise HttpError(404, "Graph not found")
    return [NodeGraphOut.model_validate(x) for x in proj["nodes"]]


@graph_collection_router.post(
    "/{uuid}/nodes",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="createGraphNode",
)
def create_graph_node(request, uuid: UUID, payload: GraphNodeCreateIn):
    current_user = get_current_user(request)
    svc = get_graph_mutation_service()
    out, err = svc.create_node(
        graph_uuid=uuid,
        user_id=current_user.id,
        section_uuid=payload.section_uuid,
        channel_uuid=payload.channel_uuid,
        section_row=payload.section_row,
        workflow_uuid=payload.workflow_uuid,
    )
    return graph_mutation_http(out, err)


@node_resource_router.get(
    "/{uuid}", response=NodeGraphOut, auth=BearerAuth(), operation_id="getNode"
)
def get_node(request, uuid: UUID):
    current_user = get_current_user(request)
    try:
        n = (
            Node.objects.select_related("section", "channel", "workflow", "thread")
            .prefetch_related("outcomes")
            .get(uuid=uuid)
        )
    except Node.DoesNotExist:
        raise HttpError(404, "Not found")
    wf = graph_from_node(n)
    if wf is None:
        raise HttpError(404, "Not found")
    if not can_view_graph(current_user=current_user, graph=wf):
        raise HttpError(403, "Forbidden")
    return _node_graph_out(n)


@node_resource_router.patch(
    "/{uuid}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="patchNode",
)
def patch_node(request, uuid: UUID, payload: GraphNodePatchIn):
    current_user = get_current_user(request)
    patch = payload.model_dump(exclude_unset=True)
    svc = get_graph_mutation_service()
    out, err = svc.update_node(
        user_id=current_user.id,
        node_uuid=uuid,
        patch=patch,
    )
    return graph_mutation_http(out, err)


@node_resource_router.delete(
    "/{uuid}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="deleteNode",
)
def delete_node(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_graph_mutation_service()
    payload, err = svc.delete_node(
        user_id=current_user.id,
        node_uuid=uuid,
    )
    return graph_mutation_http(payload, err)
