from datetime import datetime
from enum import Enum
from uuid import UUID

from course_flow_v2.api.common.schemas import CamelSchema


class UnitTypeIn(str, Enum):
    PROGRAM = "program"
    COURSE = "course"
    ACTIVITY = "activity"
    TASK = "task"


class WorkflowCreateIn(CamelSchema):
    project_id: int | None = None
    workflow_title: str
    unit_title: str = ""
    unit_type: UnitTypeIn
    unit_description: str = ""


class WorkflowUpdateIn(CamelSchema):
    title: str | None = None
    project_id: int | None = None


class WorkflowListItemOut(CamelSchema):
    """
    List rows: workflow entity fields only.
    """

    uuid: UUID
    title: str
    owner_id: int
    project_id: int | None
    revision_id: int
    modified_on: datetime


class WorkflowListMetaOut(CamelSchema):
    total: int


class WorkflowListOut(CamelSchema):
    items: list[WorkflowListItemOut]
    meta: WorkflowListMetaOut


class WorkflowDetailOut(CamelSchema):
    """
    Single workflow resource: persisted fields only (no unit/sections/channels).
    """

    uuid: UUID
    title: str
    owner_id: int
    project_id: int | None
    revision_id: int
    date_created: datetime
    modified_on: datetime


class WorkflowDetailOutResp(CamelSchema):
    item: WorkflowDetailOut
