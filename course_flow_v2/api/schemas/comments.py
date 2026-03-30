"""Thread comment read models (lazy-loaded; not embedded in graph projection)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from ninja import Schema


class CommentAuthorOut(Schema):
    uuid: UUID
    email: str
    first_name: str
    last_name: str


class CommentOut(Schema):
    uuid: UUID
    thread_uuid: UUID
    body: str
    date_created: datetime
    modified_on: datetime
    author: CommentAuthorOut
