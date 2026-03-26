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
    owner_id: int
    project_id: int | None = None
    workflow_title: str
    unit_title: str = ""
    unit_type: UnitTypeIn
    unit_description: str = ""


class WorkflowOut(Schema):
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
