from datetime import datetime
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema


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
