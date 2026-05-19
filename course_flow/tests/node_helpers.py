"""Shared helpers for constructing grid nodes in tests."""

from __future__ import annotations

from course_flow.core.hierarchy import child_node_type_value_for_workflow
from course_flow.core.models import Channel, Node, Section, Workflow


def create_grid_node(
    *,
    section: Section,
    channel: Channel,
    workflow: Workflow,
    section_row: int,
    node_type: str | None = None,
    **kwargs,
) -> Node:
    resolved = node_type or child_node_type_value_for_workflow(workflow.workflow_type)
    return Node.objects.create(
        section=section,
        channel=channel,
        workflow=workflow,
        section_row=section_row,
        node_type=resolved,
        **kwargs,
    )
