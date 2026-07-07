from datetime import datetime
from enum import Enum
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema
from course_flow.core.enum import WorkflowType


class WorkflowTypeIn(str, Enum):
    """Allowed root graph workflow types (``task`` is only valid on grid nodes)."""

    PROGRAM = "program"
    COURSE = "course"
    ACTIVITY = "activity"


class WorkflowCreateIn(CamelSchema):
    """Create a root ``Workflow`` and its backing ``Graph`` row (1:1 ORM)."""

    project_uuid: UUID | None = None
    title: str = ""
    workflow_type: WorkflowTypeIn
    description: str = ""


class WorkflowUpdateIn(CamelSchema):
    title: str | None = None
    project_uuid: UUID | None = None
    description: str | None = None


class WorkflowListItemOut(CamelSchema):
    uuid: UUID
    graph_uuid: UUID
    title: str
    author_id: int | None
    project_uuid: UUID | None
    workflow_type: str
    revision_id: int
    modified_on: datetime


class WorkflowListMetaOut(CamelSchema):
    total: int


class WorkflowListOut(CamelSchema):
    items: list[WorkflowListItemOut]
    meta: WorkflowListMetaOut


class WorkflowDetailOut(CamelSchema):
    uuid: UUID
    graph_uuid: UUID
    title: str
    description: str
    workflow_type: WorkflowType
    author_id: int | None
    project_uuid: UUID | None
    revision_id: int
    date_created: datetime
    modified_on: datetime


class WorkflowDetailOutResp(CamelSchema):
    item: WorkflowDetailOut
