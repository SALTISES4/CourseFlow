"""Canonical delta envelope for workflow graph mutations."""

from __future__ import annotations

from uuid import UUID

from pydantic import Field

from course_flow_v2.api.common.schemas import CamelSchema


class GraphNodeMutationOut(CamelSchema):
    """Flat node snapshot for created/updated buckets (aligned with graph read shape)."""

    uuid: UUID
    section_uuid: UUID | None = None
    channel_uuid: UUID | None = None
    section_row: int | None = None
    unit_uuid: UUID | None = None
    thread_uuid: UUID | None = None
    outcome_uuids: list[UUID] = Field(default_factory=list)


class GraphEdgeMutationOut(CamelSchema):
    """Edge row; ``id`` is the integer PK (``cf2_edge`` has no UUID column)."""

    id: int
    source_node_uuid: UUID
    target_node_uuid: UUID
    line_type: str
    source_port: str
    target_port: str


class GraphTagStubOut(CamelSchema):
    """Placeholder for future tag mutations; buckets remain empty until implemented."""

    id: int


class GraphNodesDeltaOut(CamelSchema):
    created: list[GraphNodeMutationOut]
    updated: list[GraphNodeMutationOut]
    deleted: list[UUID]


class GraphEdgesDeltaOut(CamelSchema):
    created: list[GraphEdgeMutationOut]
    updated: list[GraphEdgeMutationOut]
    deleted: list[int]


class GraphTagsDeltaOut(CamelSchema):
    created: list[GraphTagStubOut] = Field(default_factory=list)
    updated: list[GraphTagStubOut] = Field(default_factory=list)
    deleted: list[int] = Field(default_factory=list)


class GraphMutationChangesOut(CamelSchema):
    nodes: GraphNodesDeltaOut
    edges: GraphEdgesDeltaOut
    tags: GraphTagsDeltaOut


class GraphMutationMetaOut(CamelSchema):
    triggered_by: str
    trigger_entity_id: str


class GraphMutationEnvelopeOut(CamelSchema):
    workflow_id: UUID
    revision_id: int
    changes: GraphMutationChangesOut
    meta: GraphMutationMetaOut


class GraphNodeCreateIn(CamelSchema):
    section_uuid: UUID | None = None
    channel_uuid: UUID | None = None
    section_row: int | None = None
    unit_uuid: UUID | None = None


class GraphNodePatchIn(CamelSchema):
    """Send only fields to change; JSON ``null`` clears nullable FKs / section_row."""

    section_uuid: UUID | None = None
    channel_uuid: UUID | None = None
    section_row: int | None = None
    unit_uuid: UUID | None = None


class GraphEdgeCreateIn(CamelSchema):
    source_node_uuid: UUID
    target_node_uuid: UUID
    line_type: str = ""
    source_port: str = ""
    target_port: str = ""
