"""Canonical delta envelope for graph mutations."""

from __future__ import annotations

from uuid import UUID

from pydantic import Field, field_validator

from course_flow.api.common.schemas import CamelSchema


class GraphNodeMutationOut(CamelSchema):
    """Flat node snapshot for created/updated buckets (aligned with graph read shape)."""

    uuid: UUID
    node_type: str
    title: str = ""
    description: str = ""
    context_classification: int | None = None
    task_classification: int | None = None
    time_required: float | None = None
    time_units: int | None = None
    represents_workflow: bool = False
    ponderation_theory: float | None = None
    ponderation_practice: float | None = None
    ponderation_individual: float | None = None
    credits: int | None = None
    specific_education: bool = False
    tag_ids: list[int] = Field(default_factory=list)
    section_uuid: UUID | None = None
    channel_uuid: UUID | None = None
    section_row: int | None = None
    workflow_uuid: UUID | None = None
    linked_workflow_uuid: UUID | None = None
    thread_uuid: UUID | None = None
    outcome_uuids: list[UUID] = Field(default_factory=list)


class GraphEdgeMutationOut(CamelSchema):
    """Edge row; ``id`` is the integer PK (``cf_edge`` has no UUID column)."""

    id: int
    source_node_uuid: UUID
    target_node_uuid: UUID
    title: str = ""
    text_position: int = 50
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
    colour: str = ""
    position: int
    thread_uuid: UUID | None = None


class GraphSectionMutationOut(CamelSchema):
    """Flat section snapshot for created/updated buckets (aligned with graph read shape)."""

    uuid: UUID
    graph_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None = None


class GraphOutcomeMutationOut(CamelSchema):
    """Flat outcome snapshot for created/updated buckets (aligned with graph read shape)."""

    uuid: UUID
    graph_uuid: UUID
    parent_uuid: UUID | None = None
    order: int
    title: str = ""
    description: str = ""
    code: str = ""
    tag_ids: list[int] = Field(default_factory=list)
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


class GraphOutcomesDeltaOut(CamelSchema):
    created: list[GraphOutcomeMutationOut]
    updated: list[GraphOutcomeMutationOut]
    deleted: list[UUID]


class GraphMutationChangesOut(CamelSchema):
    nodes: GraphNodesDeltaOut
    edges: GraphEdgesDeltaOut
    channels: GraphChannelsDeltaOut
    sections: GraphSectionsDeltaOut
    tags: GraphTagsDeltaOut
    outcomes: GraphOutcomesDeltaOut


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


class GraphNodeInsertBelowIn(CamelSchema):
    """Insert a node below ``node_uuid``; backend computes grid reflow."""

    node_uuid: UUID
    mode: str  # row | column
    duplicate: bool = False
    edge: str | None = None  # top | bottom


class GraphNodePlaceIn(CamelSchema):
    """Place a new node on the grid (sidebar / row drop); backend computes reflow."""

    section_uuid: UUID
    channel_uuid: UUID
    row_hint: int
    mode: str
    edge: str | None = None


class GraphNodeMoveIn(CamelSchema):
    """Move an existing node; backend computes sibling row/channel updates."""

    to_section_uuid: UUID
    to_channel_uuid: UUID
    row_hint: int
    mode: str
    edge: str | None = None


class GraphNodeLinkWorkflowIn(CamelSchema):
    """Set or clear the node's symbolic link to a library workflow (parent ``workflow`` unchanged)."""

    workflow_uuid: UUID | None = None


class GraphNodeLinkOutcomeIn(CamelSchema):
    outcome_uuid: UUID


class GraphNodeMetaPatchIn(CamelSchema):
    """Editable node metadata (grid placement and ``node_type`` are not patchable here)."""

    title: str | None = None
    description: str | None = None
    context_classification: int | None = None
    task_classification: int | None = None
    time_required: float | None = None
    time_units: int | None = None
    represents_workflow: bool | None = None
    ponderation_theory: float | None = None
    ponderation_practice: float | None = None
    ponderation_individual: float | None = None
    credits: int | None = Field(default=None, ge=0)
    specific_education: bool | None = None
    tag_ids: list[int] | None = None


class GraphEdgeCreateIn(CamelSchema):
    source_node_uuid: UUID
    target_node_uuid: UUID
    line_type: str = ""
    source_port: str = Field(min_length=1)
    target_port: str = Field(min_length=1)

    @field_validator("source_port", "target_port")
    @classmethod
    def strip_non_empty_port(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("port must be non-empty")
        return stripped


class GraphEdgePatchIn(CamelSchema):
    title: str | None = None
    text_position: int | None = None
    line_type: str | None = None
    source_node_uuid: UUID | None = None
    target_node_uuid: UUID | None = None
    source_port: str | None = Field(default=None, min_length=1)
    target_port: str | None = Field(default=None, min_length=1)


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


class GraphOutcomeCreateIn(CamelSchema):
    parent_uuid: UUID | None = None
    insert_index: int | None = None
    title: str = ""
    description: str = ""
    code: str = ""
    tag_ids: list[int] = Field(default_factory=list)


class GraphOutcomePatchIn(CamelSchema):
    title: str | None = None
    description: str | None = None
    code: str | None = None
    tag_ids: list[int] | None = None


class GraphOutcomeMoveIn(CamelSchema):
    """Reparent and/or reorder among siblings; backend renumbers affected sibling orders."""

    parent_uuid: UUID | None = None
    insert_index: int | None = None
    before_uuid: UUID | None = None
    after_uuid: UUID | None = None
