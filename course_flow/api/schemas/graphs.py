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
    project_id: int | None = None
    graph_title: str
    workflow_title: str = ""
    workflow_type: WorkflowTypeIn
    workflow_description: str = ""


class GraphUpdateIn(CamelSchema):
    title: str | None = None
    project_id: int | None = None


class GraphListItemOut(CamelSchema):
    """
    List rows: graph entity fields only.
    """

    uuid: UUID
    title: str
    owner_id: int | None
    project_id: int | None
    revision_id: int
    modified_on: datetime


class GraphListMetaOut(CamelSchema):
    total: int


class GraphListOut(CamelSchema):
    items: list[GraphListItemOut]
    meta: GraphListMetaOut


class GraphDetailOut(CamelSchema):
    """
    Single graph resource: persisted fields only (no workflow/sections/channels).
    """

    uuid: UUID
    title: str
    owner_id: int | None
    project_id: int | None
    revision_id: int
    date_created: datetime
    modified_on: datetime


class GraphDetailOutResp(CamelSchema):
    item: GraphDetailOut
