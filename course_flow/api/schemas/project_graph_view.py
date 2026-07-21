"""Project-level Graph View schemas (non-CRUD read models)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema
from course_flow.api.schemas.permissions import PermissionContextOut


class ProjectGraphViewOut(CamelSchema):
    """Project overview: entity fields + graph UUID references only."""

    uuid: UUID
    title: str
    description: str
    is_published: bool
    is_archived: bool
    is_template: bool
    owner_id: int
    date_created: datetime
    modified_on: datetime
    graph_uuids: list[UUID]
    permissions: PermissionContextOut
