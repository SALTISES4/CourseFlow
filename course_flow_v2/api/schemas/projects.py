from datetime import datetime
from uuid import UUID

from ninja import Schema


class ProjectCreateIn(Schema):
    owner_id: int
    title: str
    description: str = ""
    is_published: bool = False
    is_template: bool = False


class ProjectOut(Schema):
    id: int
    uuid: UUID
    title: str
    description: str
    is_published: bool
    is_template: bool
    owner_id: int
    date_created: datetime
    modified_on: datetime
