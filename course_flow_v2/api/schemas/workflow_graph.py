"""Workflow graph/editor read model (flat collections, UUID references).

Not a CRUD entity payload — use primary workflow routes for resource fields only.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from ninja import Schema
from pydantic import Field


class WorkflowGraphMetaOut(Schema):
    """Workflow row + root unit identifiers needed for the editor shell (no nested unit object)."""

    uuid: UUID
    title: str
    owner_id: int
    project_id: int | None
    revision_id: int
    date_created: datetime
    modified_on: datetime
    root_unit_uuid: UUID | None = None
    root_unit_type: str | None = None
    root_unit_title: str = ""


class SectionGraphOut(Schema):
    uuid: UUID
    workflow_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None = None


class ChannelGraphOut(Schema):
    uuid: UUID
    workflow_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None = None


class NodeGraphOut(Schema):
    uuid: UUID
    section_uuid: UUID | None = None
    channel_uuid: UUID | None = None
    section_row: int | None = None
    unit_uuid: UUID | None = None
    thread_uuid: UUID | None = None
    outcome_uuids: list[UUID] = Field(default_factory=list)


class EdgeGraphOut(Schema):
    """Endpoints are node UUIDs; ``id`` distinguishes multiple edges between the same pair."""

    id: int
    source_node_uuid: UUID
    target_node_uuid: UUID
    line_type: str
    source_port: str
    target_port: str


class ThreadCommentCountOut(Schema):
    thread_uuid: UUID
    comment_count: int


class WorkflowGraphOut(Schema):
    """Single round-trip projection for rendering the workflow graph (not nested entity trees)."""

    workflow: WorkflowGraphMetaOut
    channels: list[ChannelGraphOut]
    sections: list[SectionGraphOut]
    nodes: list[NodeGraphOut]
    edges: list[EdgeGraphOut]
    thread_comment_counts: list[ThreadCommentCountOut] = Field(default_factory=list)
