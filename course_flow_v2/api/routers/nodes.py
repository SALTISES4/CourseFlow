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


def _ensure_workflow_owner(uuid: UUID, current_user) -> None:
    svc = get_workflow_service()
    dto = svc.get_by_uuid(uuid)
    if dto is None:
        raise HttpError(404, "Workflow not found")
    if not can_view_workflow(current_user=current_user, workflow=dto):
        raise HttpError(403, "Forbidden")


@workflow_collection_router.get(
    "/{uuid}/nodes",
    response=list[NodeGraphOut],
    auth=BearerAuth(),
    operation_id="listWorkflowNodes",
)
def list_workflow_nodes(request, uuid: UUID):
    current_user = get_current_user(request)
    _ensure_workflow_owner(uuid, current_user)
    proj = get_workflow_graph_projection_service().get_by_uuid(uuid)
    if proj is None:
        raise HttpError(404, "Workflow not found")
    return [NodeGraphOut.model_validate(x) for x in proj["nodes"]]


@workflow_collection_router.post(
    "/{uuid}/nodes",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="createWorkflowNode",
)
def create_workflow_node(request, uuid: UUID, payload: GraphNodeCreateIn):
    current_user = get_current_user(request)
    svc = get_workflow_graph_mutation_service()
    out, err = svc.create_node(
        uuid=uuid,
        user_id=current_user.id,
        section_uuid=payload.section_uuid,
        channel_uuid=payload.channel_uuid,
        section_row=payload.section_row,
        unit_uuid=payload.unit_uuid,
    )
    return graph_mutation_http(out, err)


@node_resource_router.get(
    "/{uuid}", response=NodeGraphOut, auth=BearerAuth(), operation_id="getNode"
)
def get_node(request, uuid: UUID):
    current_user = get_current_user(request)
    try:
        n = (
            Node.objects.select_related("section", "channel", "unit", "thread")
            .prefetch_related("outcomes")
            .get(uuid=uuid)
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
    "/{uuid}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="patchNode",
)
def patch_node(request, uuid: UUID, payload: GraphNodePatchIn):
    current_user = get_current_user(request)
    patch = payload.model_dump(exclude_unset=True)
    svc = get_workflow_graph_mutation_service()
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
    svc = get_workflow_graph_mutation_service()
    payload, err = svc.delete_node(
        user_id=current_user.id,
        node_uuid=uuid,
    )
    return graph_mutation_http(payload, err)
