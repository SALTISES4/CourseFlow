from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True, slots=True)
class ProjectDTO:
    id: int
    uuid: UUID
    title: str
    description: str
    is_published: bool
    is_template: bool
    owner_id: int
    date_created: datetime
    modified_on: datetime


@dataclass(frozen=True, slots=True)
class WorkflowDTO:
    id: int
    uuid: UUID
    title: str
    owner_id: int
    project_id: int | None
    unit_uuid: UUID
    unit_type: str
    unit_title: str
    date_created: datetime
    modified_on: datetime
