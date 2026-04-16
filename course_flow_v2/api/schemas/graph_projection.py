"""Project-level projection schemas (non-CRUD read models).

Graph graph shapes live in ``course_flow_v2.api.schemas.graph_view``.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from course_flow_v2.api.common.schemas import CamelSchema


class ProjectGraphProjectionOut(CamelSchema):
    """Project overview: entity fields + graph UUID references only."""

    uuid: UUID
    title: str
    description: str
    is_published: bool
    is_template: bool
    owner_id: int
    date_created: datetime
    modified_on: datetime
    graph_uuids: list[UUID]
