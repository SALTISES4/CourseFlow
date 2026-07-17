from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import Field

from course_flow.api.common.schemas import CamelSchema
from course_flow.api.schemas.permissions import PermissionContextOut
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


class WorkflowCopyIn(CamelSchema):
    """Copy an existing workflow into an eligible destination project."""

    project_uuid: UUID
    title: str = Field(min_length=1, max_length=200)


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
    is_archived: bool
    revision_id: int
    modified_on: datetime
    permissions: PermissionContextOut
    project_permissions: PermissionContextOut | None


class WorkflowListMetaOut(CamelSchema):
    total: int


class WorkflowListOut(CamelSchema):
    items: list[WorkflowListItemOut]
    meta: WorkflowListMetaOut


class WorkflowRelatedOut(CamelSchema):
    contains: list[WorkflowListItemOut]
    appears_in: list[WorkflowListItemOut]


class WorkflowDetailOut(CamelSchema):
    uuid: UUID
    graph_uuid: UUID
    title: str
    description: str
    workflow_type: WorkflowType
    author_id: int | None
    project_uuid: UUID | None
    is_archived: bool
    revision_id: int
    date_created: datetime
    modified_on: datetime
    permissions: PermissionContextOut
    project_permissions: PermissionContextOut | None


class WorkflowDetailOutResp(CamelSchema):
    item: WorkflowDetailOut
