"""Node collection (graph-scoped) and singular node resource routes."""

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
from course_flow.api.permissions import has_workflow_permission
from course_flow.api.schemas.graph_mutation import (
    GraphMutationEnvelopeOut,
    GraphNodeCreateIn,
    GraphNodeInsertBelowIn,
    GraphNodeLinkOutcomeIn,
    GraphNodeLinkWorkflowIn,
    GraphNodeMetaPatchIn,
    GraphNodeMoveIn,
    GraphNodePatchIn,
    GraphNodePlaceIn,
)
from course_flow.api.schemas.graph_view import NodeGraphOut
from course_flow.application.services.graph_mutation_service import (
    graph_from_node,
)
from course_flow.core.models import Node
from course_flow.core.permissions import WorkflowPermission

# Mounted at /graph — collection list/create under parent context.
graph_collection_router = Router(tags=["nodes"], by_alias=True)

# Mounted at /node — direct resource by node UUID.
node_resource_router = Router(tags=["nodes"], by_alias=True)


def _node_graph_out(n: Node) -> NodeGraphOut:
    from course_flow.core.node_meta import read_node_meta_fields

    meta = read_node_meta_fields(n)
    return NodeGraphOut(
        uuid=n.uuid,
        node_type=n.node_type,
        title=n.title or "",
        description=n.description or "",
        context_classification=meta["context_classification"],
        task_classification=meta["task_classification"],
        time_required=meta["time_required"],
        time_units=meta["time_units"],
        represents_workflow=meta["represents_workflow"],
        tag_ids=list(n.tags.values_list("id", flat=True)),
        section_uuid=n.section.uuid if n.section_id else None,
        channel_uuid=n.channel.uuid if n.channel_id else None,
        section_row=n.section_row,
        workflow_uuid=n.workflow.uuid if n.workflow_id else None,
        linked_workflow_uuid=(
            n.linked_workflow.uuid if n.linked_workflow_id else None
        ),
        thread_uuid=n.thread.uuid if n.thread_id else None,
        outcome_uuids=[o.uuid for o in n.outcomes.all()],
    )


def _ensure_graph_permission(
    uuid: UUID,
    current_user,
    action: WorkflowPermission,
) -> None:
    svc = get_workflow_service()
    dto = svc.get_by_graph_uuid(uuid)
    if dto is None:
        raise HttpError(404, "Graph not found")
    if not has_workflow_permission(
        current_user=current_user,
        workflow=dto,
        action=action,
    ):
        raise HttpError(403, "Forbidden")


def _ensure_node_permission(
    uuid: UUID,
    current_user,
    action: WorkflowPermission,
) -> None:
    try:
        node = Node.objects.select_related(
            "section__graph",
            "channel__graph",
        ).get(uuid=uuid)
    except Node.DoesNotExist as exc:
        raise HttpError(404, "Not found") from exc
    graph = graph_from_node(node)
    if graph is None:
        raise HttpError(404, "Not found")
    if not has_workflow_permission(
        current_user=current_user,
        workflow=graph,
        action=action,
    ):
        raise HttpError(403, "Forbidden")


@graph_collection_router.get(
    "/{uuid}/nodes",
    response=list[NodeGraphOut],
    auth=BearerAuth(),
    operation_id="listGraphNodes",
)
def list_graph_nodes(request, uuid: UUID):
    current_user = get_current_user(request)
    _ensure_graph_permission(uuid, current_user, WorkflowPermission.VIEW)
    view = get_graph_view_service().get_by_graph_uuid(uuid)
    if view is None:
        raise HttpError(404, "Graph not found")
    return [NodeGraphOut.model_validate(x) for x in view["nodes"]]


@graph_collection_router.post(
    "/{uuid}/nodes",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="createGraphNode",
)
def create_graph_node(request, uuid: UUID, payload: GraphNodeCreateIn):
    current_user = get_current_user(request)
    _ensure_graph_permission(
        uuid,
        current_user,
        WorkflowPermission.NODE_MANAGEMENT,
    )
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


@graph_collection_router.post(
    "/{uuid}/nodes/insert-below",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="insertGraphNodeBelow",
)
def insert_graph_node_below(request, uuid: UUID, payload: GraphNodeInsertBelowIn):
    current_user = get_current_user(request)
    _ensure_graph_permission(
        uuid,
        current_user,
        WorkflowPermission.NODE_MANAGEMENT,
    )
    svc = get_graph_mutation_service()
    edge = payload.edge if payload.edge in ("top", "bottom") else None
    mode = payload.mode if payload.mode in ("row", "column") else "row"
    out, err = svc.insert_node_below(
        graph_uuid=uuid,
        user_id=current_user.id,
        node_uuid=payload.node_uuid,
        mode=mode,
        duplicate=payload.duplicate,
        edge=edge,
    )
    return graph_mutation_http(out, err)


@graph_collection_router.post(
    "/{uuid}/nodes/place",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="placeGraphNode",
)
def place_graph_node(request, uuid: UUID, payload: GraphNodePlaceIn):
    current_user = get_current_user(request)
    _ensure_graph_permission(
        uuid,
        current_user,
        WorkflowPermission.NODE_MANAGEMENT,
    )
    svc = get_graph_mutation_service()
    edge = payload.edge if payload.edge in ("top", "bottom") else None
    mode = payload.mode if payload.mode in ("row", "column") else "row"
    out, err = svc.place_node(
        graph_uuid=uuid,
        user_id=current_user.id,
        section_uuid=payload.section_uuid,
        channel_uuid=payload.channel_uuid,
        row_hint=payload.row_hint,
        mode=mode,
        edge=edge,
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
    if not has_workflow_permission(
        current_user=current_user,
        workflow=wf,
        action=WorkflowPermission.VIEW,
    ):
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
    _ensure_node_permission(
        uuid,
        current_user,
        WorkflowPermission.NODE_MANAGEMENT,
    )
    patch = payload.model_dump(exclude_unset=True)
    svc = get_graph_mutation_service()
    out, err = svc.update_node(
        user_id=current_user.id,
        node_uuid=uuid,
        patch=patch,
    )
    return graph_mutation_http(out, err)


@node_resource_router.post(
    "/{uuid}/link-outcome",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="linkNodeOutcome",
)
def link_node_outcome(request, uuid: UUID, payload: GraphNodeLinkOutcomeIn):
    current_user = get_current_user(request)
    _ensure_node_permission(
        uuid,
        current_user,
        WorkflowPermission.ASSIGN_OUTCOMES,
    )
    svc = get_graph_mutation_service()
    out, err = svc.link_node_outcome(
        user_id=current_user.id,
        node_uuid=uuid,
        outcome_uuid=payload.outcome_uuid,
    )
    return graph_mutation_http(out, err)


@node_resource_router.post(
    "/{uuid}/unlink-outcome",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="unlinkNodeOutcome",
)
def unlink_node_outcome(request, uuid: UUID, payload: GraphNodeLinkOutcomeIn):
    current_user = get_current_user(request)
    _ensure_node_permission(
        uuid,
        current_user,
        WorkflowPermission.ASSIGN_OUTCOMES,
    )
    svc = get_graph_mutation_service()
    out, err = svc.unlink_node_outcome(
        user_id=current_user.id,
        node_uuid=uuid,
        outcome_uuid=payload.outcome_uuid,
    )
    return graph_mutation_http(out, err)


@node_resource_router.patch(
    "/{uuid}/meta",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="patchNodeMeta",
)
def patch_node_meta(request, uuid: UUID, payload: GraphNodeMetaPatchIn):
    current_user = get_current_user(request)
    _ensure_node_permission(
        uuid,
        current_user,
        WorkflowPermission.NODE_MANAGEMENT,
    )
    patch = payload.model_dump(exclude_unset=True)
    svc = get_graph_mutation_service()
    out, err = svc.update_node_meta(
        user_id=current_user.id,
        node_uuid=uuid,
        patch=patch,
    )
    return graph_mutation_http(out, err)


@node_resource_router.post(
    "/{uuid}/link-workflow",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="linkNodeWorkflow",
)
def link_node_workflow(request, uuid: UUID, payload: GraphNodeLinkWorkflowIn):
    current_user = get_current_user(request)
    _ensure_node_permission(
        uuid,
        current_user,
        WorkflowPermission.NODE_LINK_MANAGEMENT,
    )
    svc = get_graph_mutation_service()
    out, err = svc.link_node_workflow(
        user_id=current_user.id,
        node_uuid=uuid,
        workflow_uuid=payload.workflow_uuid,
    )
    return graph_mutation_http(out, err)


@node_resource_router.post(
    "/{uuid}/move",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="moveGraphNode",
)
def move_graph_node(request, uuid: UUID, payload: GraphNodeMoveIn):
    current_user = get_current_user(request)
    _ensure_node_permission(
        uuid,
        current_user,
        WorkflowPermission.NODE_MANAGEMENT,
    )
    svc = get_graph_mutation_service()
    edge = payload.edge if payload.edge in ("top", "bottom") else None
    mode = payload.mode if payload.mode in ("row", "column") else "row"
    out, err = svc.move_node_grid(
        user_id=current_user.id,
        node_uuid=uuid,
        to_section_uuid=payload.to_section_uuid,
        to_channel_uuid=payload.to_channel_uuid,
        row_hint=payload.row_hint,
        mode=mode,
        edge=edge,
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
    _ensure_node_permission(
        uuid,
        current_user,
        WorkflowPermission.NODE_MANAGEMENT,
    )
    svc = get_graph_mutation_service()
    payload, err = svc.delete_node(
        user_id=current_user.id,
        node_uuid=uuid,
    )
    return graph_mutation_http(payload, err)
