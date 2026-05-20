"""Read/write typed meta for grid nodes (mirrors workflow typed-meta pattern)."""

from __future__ import annotations

from typing import Any

from course_flow.core.enum import NodeType
from course_flow.core.models import Activitymeta, Coursemeta, Node, Taskmeta

# Graph/API fields carried on activitymeta and taskmeta node rows.
_ACTIVITY_LAYER_PATCH_KEYS = frozenset(
    {
        "context_classification",
        "task_classification",
        "time_required",
        "time_units",
        "represents_workflow",
    }
)

_TASK_LAYER_PATCH_KEYS = frozenset(
    {
        "context_classification",
        "time_required",
        "time_units",
        "represents_workflow",
    }
)

# Coursemeta node rows use classification/code (not exposed on graph node API yet).
_COURSE_LAYER_PATCH_KEYS = frozenset({"classification", "code"})


def typed_meta_patch_keys() -> frozenset[str]:
    """Keys that may be routed to typed meta (union of all node layers)."""
    return _ACTIVITY_LAYER_PATCH_KEYS | _TASK_LAYER_PATCH_KEYS | _COURSE_LAYER_PATCH_KEYS


def _empty_graph_meta_fields() -> dict[str, Any]:
    """Unified graph node payload shape; unset layers return nulls/false."""
    return {
        "context_classification": None,
        "task_classification": None,
        "time_required": None,
        "time_units": None,
        "represents_workflow": False,
    }


def _graph_fields_from_activity_meta(meta: Activitymeta) -> dict[str, Any]:
    time_required = meta.time_required
    return {
        "context_classification": meta.context_classification,
        "task_classification": meta.task_classification,
        "time_required": float(time_required) if time_required is not None else None,
        "time_units": meta.time_units,
        "represents_workflow": bool(meta.represents_workflow),
    }


def _graph_fields_from_task_meta(meta: Taskmeta) -> dict[str, Any]:
    time_required = meta.time_required
    return {
        "context_classification": meta.context_classification,
        "task_classification": None,
        "time_required": float(time_required) if time_required is not None else None,
        "time_units": meta.time_units,
        "represents_workflow": bool(meta.represents_workflow),
    }


def read_node_meta_fields(node: Node) -> dict[str, Any]:
    """API-shaped meta fields for graph payloads."""
    node_type = NodeType(node.node_type)

    if node_type == NodeType.COURSE:
        # Program-graph course slots: coursemeta has classification/code only.
        return _empty_graph_meta_fields()

    if node_type == NodeType.ACTIVITY:
        meta = getattr(node, "activitymeta", None)
        if meta is None:
            return _empty_graph_meta_fields()
        return _graph_fields_from_activity_meta(meta)

    if node_type == NodeType.TASK:
        meta = getattr(node, "taskmeta", None)
        if meta is None:
            return _empty_graph_meta_fields()
        return _graph_fields_from_task_meta(meta)

    return _empty_graph_meta_fields()


def patch_node_typed_meta(node: Node, patch: dict[str, Any]) -> list[str]:
    """Apply patch keys that belong on typed meta; return ORM update_fields names."""
    node_type = NodeType(node.node_type)
    meta = _get_or_create_typed_meta(node)
    if meta is None:
        return []

    update_fields: list[str] = []

    if node_type == NodeType.COURSE and isinstance(meta, Coursemeta):
        if "classification" in patch and patch["classification"] is not None:
            meta.classification = patch["classification"]
            update_fields.append("classification")
        if "code" in patch and patch["code"] is not None:
            meta.code = patch["code"]
            update_fields.append("code")
    elif node_type == NodeType.ACTIVITY and isinstance(meta, Activitymeta):
        update_fields = _apply_activity_layer_patch(meta, patch)
    elif node_type == NodeType.TASK and isinstance(meta, Taskmeta):
        update_fields = _apply_task_layer_patch(meta, patch)

    if update_fields:
        meta.save(update_fields=update_fields)
    return update_fields


def _apply_activity_layer_patch(
    meta: Activitymeta, patch: dict[str, Any]
) -> list[str]:
    update_fields: list[str] = []
    if "context_classification" in patch:
        meta.context_classification = patch["context_classification"]
        update_fields.append("context_classification")
    if "task_classification" in patch:
        meta.task_classification = patch["task_classification"]
        update_fields.append("task_classification")
    if "time_required" in patch:
        meta.time_required = patch["time_required"]
        update_fields.append("time_required")
    if "time_units" in patch:
        meta.time_units = patch["time_units"]
        update_fields.append("time_units")
    if "represents_workflow" in patch and patch["represents_workflow"] is not None:
        meta.represents_workflow = patch["represents_workflow"]
        update_fields.append("represents_workflow")
    return update_fields


def _apply_task_layer_patch(meta: Taskmeta, patch: dict[str, Any]) -> list[str]:
    update_fields: list[str] = []
    if "context_classification" in patch:
        meta.context_classification = patch["context_classification"]
        update_fields.append("context_classification")
    if "time_required" in patch:
        meta.time_required = patch["time_required"]
        update_fields.append("time_required")
    if "time_units" in patch:
        meta.time_units = patch["time_units"]
        update_fields.append("time_units")
    if "represents_workflow" in patch and patch["represents_workflow"] is not None:
        meta.represents_workflow = patch["represents_workflow"]
        update_fields.append("represents_workflow")
    return update_fields


def copy_node_typed_meta(*, source: Node, target: Node) -> None:
    """Copy typed meta field values when duplicating a node (same node_type)."""
    if source.node_type != target.node_type:
        return

    src = _get_typed_meta(source)
    dst = _get_or_create_typed_meta(target)
    if src is None or dst is None:
        return

    node_type = NodeType(source.node_type)

    if node_type == NodeType.COURSE and isinstance(src, Coursemeta) and isinstance(
        dst, Coursemeta
    ):
        dst.classification = src.classification
        dst.code = src.code
        dst.save(update_fields=["classification", "code"])
        return

    if node_type == NodeType.ACTIVITY and isinstance(src, Activitymeta) and isinstance(
        dst, Activitymeta
    ):
        dst.context_classification = src.context_classification
        dst.task_classification = src.task_classification
        dst.time_required = src.time_required
        dst.time_units = src.time_units
        dst.represents_workflow = src.represents_workflow
        dst.save(
            update_fields=[
                "context_classification",
                "task_classification",
                "time_required",
                "time_units",
                "represents_workflow",
            ]
        )
        return

    if node_type == NodeType.TASK and isinstance(src, Taskmeta) and isinstance(
        dst, Taskmeta
    ):
        dst.context_classification = src.context_classification
        dst.time_required = src.time_required
        dst.time_units = src.time_units
        dst.represents_workflow = src.represents_workflow
        dst.save(
            update_fields=[
                "context_classification",
                "time_required",
                "time_units",
                "represents_workflow",
            ]
        )


def _get_typed_meta(node: Node) -> Activitymeta | Coursemeta | Taskmeta | None:
    node_type = NodeType(node.node_type)
    if node_type == NodeType.COURSE:
        return getattr(node, "coursemeta", None)
    if node_type == NodeType.ACTIVITY:
        return getattr(node, "activitymeta", None)
    if node_type == NodeType.TASK:
        return getattr(node, "taskmeta", None)
    return None


def _get_or_create_typed_meta(node: Node) -> Activitymeta | Coursemeta | Taskmeta | None:
    node_type = NodeType(node.node_type)
    if node_type == NodeType.COURSE:
        meta, _ = Coursemeta.objects.get_or_create(node=node)
        return meta
    if node_type == NodeType.ACTIVITY:
        meta, _ = Activitymeta.objects.get_or_create(node=node)
        return meta
    if node_type == NodeType.TASK:
        meta, _ = Taskmeta.objects.get_or_create(node=node)
        return meta
    return None
