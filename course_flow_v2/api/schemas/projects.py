from datetime import datetime
from uuid import UUID

from ninja import Schema


class ProjectCreateIn(Schema):
    title: str
    description: str = ""
    is_published: bool = False
    is_template: bool = False


class ProjectUpdateIn(Schema):
    title: str | None = None
    description: str | None = None
    is_published: bool | None = None
    is_template: bool | None = None


class ProjectListItemOut(Schema):
    """List rows: compact project fields only."""

    id: int
    uuid: UUID
    title: str
    owner_id: int
    is_published: bool
    is_template: bool
    modified_on: datetime


class ProjectDetailOut(Schema):
    """Single project resource: persisted fields only (no related collections)."""

    id: int
    uuid: UUID
    title: str
    description: str
    is_published: bool
    is_template: bool
    owner_id: int
    date_created: datetime
    modified_on: datetime
