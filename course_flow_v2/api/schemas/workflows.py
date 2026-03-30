from datetime import datetime
from enum import Enum
from uuid import UUID

from ninja import Schema


class UnitTypeIn(str, Enum):
    PROGRAM = "program"
    COURSE = "course"
    ACTIVITY = "activity"
    TASK = "task"


class WorkflowCreateIn(Schema):
    project_id: int | None = None
    workflow_title: str
    unit_title: str = ""
    unit_type: UnitTypeIn
    unit_description: str = ""


class WorkflowUpdateIn(Schema):
    title: str | None = None
    project_id: int | None = None


class WorkflowListItemOut(Schema):
    """List rows: workflow entity fields only."""

    id: int
    uuid: UUID
    title: str
    owner_id: int
    project_id: int | None
    revision_id: int
    modified_on: datetime


class WorkflowDetailOut(Schema):
    """Single workflow resource: persisted fields only (no unit/sections/channels)."""

    id: int
    uuid: UUID
    title: str
    owner_id: int
    project_id: int | None
    revision_id: int
    date_created: datetime
    modified_on: datetime
