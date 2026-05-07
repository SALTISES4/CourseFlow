from datetime import datetime
from enum import Enum
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema


class WorkflowTypeIn(str, Enum):
    PROGRAM = "program"
    COURSE = "course"
    ACTIVITY = "activity"
    TASK = "task"


class GraphCreateIn(CamelSchema):
    """Create a Graph row and its single root Workflow (see ``Workflow`` / ``Graph`` ORM)."""

    workflow_project_id: int | None = None
    workflow_title: str = ""
    workflow_type: WorkflowTypeIn
    workflow_description: str = ""


class GraphUpdateIn(CamelSchema):
    workflow_title: str | None = None
    workflow_project_id: int | None = None


class GraphListItemOut(CamelSchema):
    uuid: UUID
    workflow_title: str
    author_id: int | None
    workflow_project_id: int | None
    revision_id: int
    modified_on: datetime


class GraphListMetaOut(CamelSchema):
    total: int


class GraphListOut(CamelSchema):
    items: list[GraphListItemOut]
    meta: GraphListMetaOut


class GraphDetailOut(CamelSchema):
    uuid: UUID
    workflow_title: str
    author_id: int | None
    workflow_project_id: int | None
    revision_id: int
    date_created: datetime
    modified_on: datetime


class GraphDetailOutResp(CamelSchema):
    item: GraphDetailOut
