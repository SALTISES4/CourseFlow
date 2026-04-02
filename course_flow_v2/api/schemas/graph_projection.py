"""Project-level projection schemas (non-CRUD read models).

Workflow graph shapes live in ``course_flow_v2.api.schemas.workflow_graph``.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from course_flow_v2.api.common.schemas import CamelSchema


class ProjectGraphProjectionOut(CamelSchema):
    """Project overview: entity fields + workflow UUID references only."""

    uuid: UUID
    title: str
    description: str
    is_published: bool
    is_template: bool
    owner_id: int
    date_created: datetime
    modified_on: datetime
    workflow_uuids: list[UUID]
