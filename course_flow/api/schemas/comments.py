"""Thread comment read models (lazy-loaded; not embedded in Graph View)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema


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


class CommentCreateIn(CamelSchema):
    """Body for POST /thread/{uuid}/comments."""

    body: str


class ThreadCommentsBulkDeleteOut(CamelSchema):
    """Response for DELETE /thread/{uuid}/comments (delete all)."""

    success: bool = True
    deleted_count: int
