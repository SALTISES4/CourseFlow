"""
Grid placement and reflow for workflow nodes (ported from legacy frontend node.slice).

All section_row / sibling shifts are computed here; API callers pass hints only.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal
from uuid import UUID

from course_flow.core.models import Node

InsertMode = Literal["row", "column"]
DropEdge = Literal["top", "bottom"]


@dataclass
class GridNode:
    """Minimal node view for grid algorithms."""

    instance: Node
    uuid: UUID
    section_id: int
    channel_id: int
    section_row: int

    @classmethod
    def from_node(cls, n: Node) -> GridNode:
        return cls(
            instance=n,
            uuid=n.uuid,
            section_id=n.section_id,
            channel_id=n.channel_id,
            section_row=n.section_row,
        )


def resolve_target_row(
    *,
    mode: InsertMode,
    row_hint: int,
    edge: DropEdge | None,
) -> int:
    """Map UI drop hint + insert mode to target section_row (legacy resolveNodeDropSectionRow)."""
    if mode == "column":
        if edge is None:
            return row_hint
        if edge == "top":
            return max(0, row_hint - 1)
        return row_hint + 1
    if mode == "row":
        if edge == "bottom":
            return row_hint + 1
        return row_hint
    return row_hint


def split_workflow_grid_nodes(
    nodes: list[GridNode],
    *,
    new_row: int,
    channel_id: int | None = None,
) -> tuple[list[GridNode], list[GridNode]]:
    before: list[GridNode] = []
    after: list[GridNode] = []
    for n in nodes:
        if channel_id is not None and n.channel_id != channel_id:
            continue
        if n.section_row >= new_row:
            after.append(n)
        if n.section_row < new_row:
            before.append(n)
    return before, after


def get_collapsed_section_row(
    nodes: list[GridNode],
    *,
    from_section_id: int,
    from_row: int,
    to_section_id: int,
    to_row: int,
    column_mode: bool,
) -> int | None:
    same_row = [n for n in nodes if n.section_row == from_row]
    column_check = True
    if column_mode:
        column_check = from_section_id != to_section_id or (
            from_section_id == to_section_id and from_row != to_row
        )
    if not same_row and column_check:
        return from_row
    return None


def apply_move_reflow(
    moved: GridNode,
    *,
    to_section_id: int,
    to_channel_id: int,
    row_hint: int,
    mode: InsertMode,
    edge: DropEdge | None,
    section_nodes_excluding_moved: list[GridNode],
    dest_section_nodes_excluding_moved: list[GridNode],
) -> list[GridNode]:
    """
    Compute section_row (and FK) updates for a moved node and affected siblings.
    Returns nodes whose instance should be saved (including moved).
    """
    old_row = moved.section_row
    new_row = resolve_target_row(mode=mode, row_hint=row_hint, edge=edge)

    from_section_id = moved.section_id
    to_section_id = to_section_id
    insert_mode_row = mode == "row"
    insert_mode_column = mode == "column"

    channel_filter = to_channel_id if insert_mode_column else None
    _, grid_after = split_workflow_grid_nodes(
        dest_section_nodes_excluding_moved,
        new_row=new_row,
        channel_id=channel_filter,
    )

    collapse_row = get_collapsed_section_row(
        section_nodes_excluding_moved,
        from_section_id=from_section_id,
        from_row=old_row,
        to_section_id=to_section_id,
        to_row=new_row,
        column_mode=insert_mode_column,
    )

    updated: dict[UUID, GridNode] = {}

    if insert_mode_column and collapse_row is None:
        curr_row = new_row
        sorted_after = sorted(grid_after, key=lambda n: n.section_row)
        for gn in sorted_after:
            if gn.section_row == curr_row:
                curr_row += 1
                gn.section_row = curr_row
                updated[gn.uuid] = gn
            else:
                break

    if insert_mode_row and collapse_row is None:
        for gn in grid_after:
            gn.section_row += 1
            updated[gn.uuid] = gn

    if collapse_row is not None:
        if from_section_id == to_section_id and new_row > old_row:
            new_row -= 1
        for gn in section_nodes_excluding_moved:
            if gn.section_row > collapse_row:
                gn.section_row -= 1
                updated[gn.uuid] = gn
        for gn in grid_after:
            gn.section_row += 1
            updated[gn.uuid] = gn

    moved.section_row = new_row
    moved.instance.section_id = to_section_id
    moved.instance.channel_id = to_channel_id
    moved.section_id = to_section_id
    moved.channel_id = to_channel_id
    updated[moved.uuid] = moved

    return list(updated.values())


def apply_insert_reflow(
    section_nodes: list[GridNode],
    *,
    new_row: int,
    mode: InsertMode,
    channel_id: int | None = None,
) -> list[GridNode]:
    """Bump siblings before inserting a new node at new_row."""
    column_filter = channel_id if mode == "column" else None
    _, grid_after = split_workflow_grid_nodes(
        section_nodes,
        new_row=new_row,
        channel_id=column_filter,
    )
    updated: list[GridNode] = []
    for gn in grid_after:
        gn.section_row += 1
        updated.append(gn)
    return updated


def apply_delete_collapse(
    deleted: GridNode,
    section_nodes_excluding_deleted: list[GridNode],
) -> list[GridNode]:
    collapse_row = get_collapsed_section_row(
        section_nodes_excluding_deleted,
        from_section_id=deleted.section_id,
        from_row=deleted.section_row,
        to_section_id=deleted.section_id,
        to_row=deleted.section_row,
        column_mode=False,
    )
    if collapse_row is None:
        return []
    _, grid_after = split_workflow_grid_nodes(
        section_nodes_excluding_deleted,
        new_row=deleted.section_row,
    )
    updated: list[GridNode] = []
    for gn in grid_after:
        gn.section_row -= 1
        updated.append(gn)
    return updated
