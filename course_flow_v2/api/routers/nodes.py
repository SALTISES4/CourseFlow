"""Node collection (workflow-scoped) and singular node resource routes."""

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
    GraphMutationEnvelopeOut,
    GraphNodeCreateIn,
    GraphNodePatchIn,
)
from course_flow_v2.api.schemas.workflow_graph import NodeGraphOut
from course_flow_v2.application.services.workflow_graph_mutation_service import (
    workflow_from_node,
)
from course_flow_v2.core.models import Node

# Mounted at /workflow — collection list/create under parent context.
workflow_collection_router = Router(tags=["nodes"])

# Mounted at /node — direct resource by node UUID.
node_resource_router = Router(tags=["nodes"])


def _node_graph_out(n: Node) -> NodeGraphOut:
    return NodeGraphOut(
        uuid=n.uuid,
        section_uuid=n.section.uuid if n.section_id else None,
        channel_uuid=n.channel.uuid if n.channel_id else None,
        section_row=n.section_row,
        unit_uuid=n.unit.uuid if n.unit_id else None,
        thread_uuid=n.thread.uuid if n.thread_id else None,
        outcome_uuids=[o.uuid for o in n.outcomes.all()],
    )


def _ensure_workflow_owner(workflow_uuid: UUID, current_user) -> None:
    svc = get_workflow_service()
    dto = svc.get_by_uuid(workflow_uuid)
    if dto is None:
        raise HttpError(404, "Workflow not found")
    if not can_view_workflow(current_user=current_user, workflow=dto):
        raise HttpError(403, "Forbidden")


@workflow_collection_router.get(
    "/{workflow_uuid}/nodes",
    response=list[NodeGraphOut],
    auth=BearerAuth(),
)
def list_workflow_nodes(request, workflow_uuid: UUID):
    current_user = get_current_user(request)
    _ensure_workflow_owner(workflow_uuid, current_user)
    proj = get_workflow_graph_projection_service().get_by_workflow_uuid(workflow_uuid)
    if proj is None:
        raise HttpError(404, "Workflow not found")
    return [NodeGraphOut.model_validate(x) for x in proj["nodes"]]


@workflow_collection_router.post(
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
    return graph_mutation_http(out, err)


@node_resource_router.get("/{node_uuid}", response=NodeGraphOut, auth=BearerAuth())
def get_node(request, node_uuid: UUID):
    current_user = get_current_user(request)
    try:
        n = (
            Node.objects.select_related("section", "channel", "unit", "thread")
            .prefetch_related("outcomes")
            .get(uuid=node_uuid)
        )
    except Node.DoesNotExist:
        raise HttpError(404, "Not found")
    wf = workflow_from_node(n)
    if wf is None:
        raise HttpError(404, "Not found")
    if not can_view_workflow(current_user=current_user, workflow=wf):
        raise HttpError(403, "Forbidden")
    return _node_graph_out(n)


@node_resource_router.patch(
    "/{node_uuid}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
)
def patch_node(request, node_uuid: UUID, payload: GraphNodePatchIn):
    current_user = get_current_user(request)
    patch = payload.model_dump(exclude_unset=True)
    svc = get_workflow_graph_mutation_service()
    out, err = svc.update_node(
        user_id=current_user.id,
        node_uuid=node_uuid,
        patch=patch,
    )
    return graph_mutation_http(out, err)


@node_resource_router.delete(
    "/{node_uuid}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
)
def delete_node(request, node_uuid: UUID):
    current_user = get_current_user(request)
    svc = get_workflow_graph_mutation_service()
    payload, err = svc.delete_node(
        user_id=current_user.id,
        node_uuid=node_uuid,
    )
    return graph_mutation_http(payload, err)
