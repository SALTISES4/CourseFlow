"""Thread comment read models (lazy-loaded; not embedded in graph projection)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from course_flow_v2.api.common.schemas import CamelSchema


class CommentAuthorOut(CamelSchema):
    uuid: UUID
    email: str
    first_name: str
    last_name: str


class CommentOut(CamelSchema):
    uuid: UUID
    thread_uuid: UUID
    body: str
    date_created: datetime
    modified_on: datetime
    author: CommentAuthorOut
