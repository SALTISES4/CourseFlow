"""Canonical delta envelope for graph mutations."""

from __future__ import annotations

from uuid import UUID

from pydantic import Field

from course_flow.api.common.schemas import CamelSchema


class GraphNodeMutationOut(CamelSchema):
    """Flat node snapshot for created/updated buckets (aligned with graph read shape)."""

    uuid: UUID
    section_uuid: UUID | None = None
    channel_uuid: UUID | None = None
    section_row: int | None = None
    workflow_uuid: UUID | None = None
    thread_uuid: UUID | None = None
    outcome_uuids: list[UUID] = Field(default_factory=list)


class GraphEdgeMutationOut(CamelSchema):
    """Edge row; ``id`` is the integer PK (``cf_edge`` has no UUID column)."""

    id: int
    source_node_uuid: UUID
    target_node_uuid: UUID
    line_type: str
    source_port: str
    target_port: str


class GraphTagStubOut(CamelSchema):
    """Placeholder for future tag mutations; buckets remain empty until implemented."""

    id: int


class GraphChannelMutationOut(CamelSchema):
    """Flat channel snapshot for created/updated buckets (aligned with graph read shape)."""

    uuid: UUID
    graph_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None = None


class GraphSectionMutationOut(CamelSchema):
    """Flat section snapshot for created/updated buckets (aligned with graph read shape)."""

    uuid: UUID
    graph_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None = None


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


class GraphChannelsDeltaOut(CamelSchema):
    created: list[GraphChannelMutationOut]
    updated: list[GraphChannelMutationOut]
    deleted: list[UUID]


class GraphSectionsDeltaOut(CamelSchema):
    created: list[GraphSectionMutationOut]
    updated: list[GraphSectionMutationOut]
    deleted: list[UUID]


class GraphMutationChangesOut(CamelSchema):
    nodes: GraphNodesDeltaOut
    edges: GraphEdgesDeltaOut
    channels: GraphChannelsDeltaOut
    sections: GraphSectionsDeltaOut
    tags: GraphTagsDeltaOut


class GraphMutationMetaOut(CamelSchema):
    triggered_by: str
    trigger_entity_id: str


class GraphMutationEnvelopeOut(CamelSchema):
    graph_id: UUID
    revision_id: int
    changes: GraphMutationChangesOut
    meta: GraphMutationMetaOut


class GraphNodeCreateIn(CamelSchema):
    """Placement is required on ``Node`` (ORM); optional ``workflow_uuid`` selects a workflow on this graph."""

    section_uuid: UUID
    channel_uuid: UUID
    section_row: int
    workflow_uuid: UUID | None = None


class GraphNodePatchIn(CamelSchema):
    """Partial update; do not send ``null`` for FK fields (ORM requires section, channel, workflow)."""

    section_uuid: UUID | None = None
    channel_uuid: UUID | None = None
    section_row: int | None = None
    workflow_uuid: UUID | None = None


class GraphEdgeCreateIn(CamelSchema):
    source_node_uuid: UUID
    target_node_uuid: UUID
    line_type: str = ""
    source_port: str = ""
    target_port: str = ""


class GraphReorderChannelsIn(CamelSchema):
    """Full channel order for a graph; every channel on the graph must appear exactly once."""

    channel_uuids: list[UUID]


class GraphReorderSectionsIn(CamelSchema):
    """Full section order for a graph; every section on the graph must appear exactly once."""

    section_uuids: list[UUID]


class GraphSectionInsertBelowIn(CamelSchema):
    """Insert a new section directly below ``section_uuid``; optionally duplicate title."""

    section_uuid: UUID
    duplicate: bool = False


class GraphChannelInsertBelowIn(CamelSchema):
    """Insert below ``channel_uuid``, or append at end when ``channel_uuid`` is omitted."""

    channel_uuid: UUID | None = None
    duplicate: bool = False
