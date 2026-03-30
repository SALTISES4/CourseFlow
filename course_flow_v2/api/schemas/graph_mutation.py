"""Canonical delta envelope for workflow graph mutations (snake_case, matches existing API)."""

from __future__ import annotations

from uuid import UUID

from ninja import Schema
from pydantic import Field


class GraphNodeMutationOut(Schema):
    """Flat node snapshot for created/updated buckets (aligned with graph read shape)."""

    uuid: UUID
    section_uuid: UUID | None = None
    channel_uuid: UUID | None = None
    section_row: int | None = None
    unit_uuid: UUID | None = None
    thread_uuid: UUID | None = None
    outcome_uuids: list[UUID] = Field(default_factory=list)


class GraphEdgeMutationOut(Schema):
    """Edge row; ``id`` is the integer PK (``cf2_edge`` has no UUID column)."""

    id: int
    source_node_uuid: UUID
    target_node_uuid: UUID
    line_type: str
    source_port: str
    target_port: str


class GraphTagStubOut(Schema):
    """Placeholder for future tag mutations; buckets remain empty until implemented."""

    id: int


class GraphNodesDeltaOut(Schema):
    created: list[GraphNodeMutationOut]
    updated: list[GraphNodeMutationOut]
    deleted: list[UUID]


class GraphEdgesDeltaOut(Schema):
    created: list[GraphEdgeMutationOut]
    updated: list[GraphEdgeMutationOut]
    deleted: list[int]


class GraphTagsDeltaOut(Schema):
    created: list[GraphTagStubOut] = Field(default_factory=list)
    updated: list[GraphTagStubOut] = Field(default_factory=list)
    deleted: list[int] = Field(default_factory=list)


class GraphMutationChangesOut(Schema):
    nodes: GraphNodesDeltaOut
    edges: GraphEdgesDeltaOut
    tags: GraphTagsDeltaOut


class GraphMutationMetaOut(Schema):
    triggered_by: str
    trigger_entity_id: str


class GraphMutationEnvelopeOut(Schema):
    workflow_id: UUID
    revision_id: int
    changes: GraphMutationChangesOut
    meta: GraphMutationMetaOut


class GraphNodeCreateIn(Schema):
    section_uuid: UUID | None = None
    channel_uuid: UUID | None = None
    section_row: int | None = None
    unit_uuid: UUID | None = None


class GraphNodePatchIn(Schema):
    """Send only fields to change; JSON ``null`` clears nullable FKs / section_row."""

    section_uuid: UUID | None = None
    channel_uuid: UUID | None = None
    section_row: int | None = None
    unit_uuid: UUID | None = None


class GraphEdgeCreateIn(Schema):
    source_node_uuid: UUID
    target_node_uuid: UUID
    line_type: str = ""
    source_port: str = ""
    target_port: str = ""
