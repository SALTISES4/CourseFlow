from datetime import datetime
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema
from course_flow.api.schemas.permissions import PermissionContextOut


class GraphDetailOut(CamelSchema):
    uuid: UUID
    workflow_title: str
    author_id: int | None
    workflow_project_id: int | None
    is_archived: bool
    revision_id: int
    date_created: datetime
    modified_on: datetime
    permissions: PermissionContextOut


class GraphDetailOutResp(CamelSchema):
    item: GraphDetailOut
