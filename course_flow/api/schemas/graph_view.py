"""Graph View read model (flat collections, UUID references).

Not a CRUD entity payload — use primary graph routes for resource fields only.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field

from course_flow.api.common.schemas import CamelSchema


class GraphMetaOut(CamelSchema):
    """Graph UUID/revision plus root ``Workflow`` fields (graph row has no title/author/project)."""

    uuid: UUID
    workflow_title: str
    author_id: int | None
    workflow_project_id: int | None
    revision_id: int
    date_created: datetime
    modified_on: datetime
    root_workflow_uuid: UUID | None = None
    root_workflow_type: str | None = None
    root_workflow_title: str = ""


class SectionGraphOut(CamelSchema):
    uuid: UUID
    graph_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None = None


class ChannelGraphOut(CamelSchema):
    uuid: UUID
    graph_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None = None


class NodeGraphOut(CamelSchema):
    uuid: UUID
    section_uuid: UUID | None = None
    channel_uuid: UUID | None = None
    section_row: int | None = None
    workflow_uuid: UUID | None = None
    thread_uuid: UUID | None = None
    outcome_uuids: list[UUID] = Field(default_factory=list)


class EdgeGraphOut(CamelSchema):
    """Endpoints are node UUIDs; ``id`` distinguishes multiple edges between the same pair."""

    id: int
    source_node_uuid: UUID
    target_node_uuid: UUID
    line_type: str
    source_port: str
    target_port: str


class ThreadCommentCountOut(CamelSchema):
    thread_uuid: UUID
    comment_count: int


class GraphViewOut(CamelSchema):
    """Single round-trip Graph View payload (not nested entity trees)."""

    graph: GraphMetaOut
    channels: list[ChannelGraphOut]
    sections: list[SectionGraphOut]
    nodes: list[NodeGraphOut]
    edges: list[EdgeGraphOut]
    thread_comment_counts: list[ThreadCommentCountOut] = Field(default_factory=list)
