from datetime import datetime
from uuid import UUID

from pydantic import Field

from course_flow.api.common.schemas import CamelSchema
from course_flow.api.schemas.auth import UserSummaryOut
from course_flow.api.schemas.permissions import PermissionContextOut
from course_flow.core.enum import WorkflowType


class DisciplineOption(CamelSchema):
    id: int
    title: str


class ProjectCreateIn(CamelSchema):
    title: str
    description: str | None = None
    is_published: bool = False
    is_template: bool = False
    disciplines: list[int] = Field(default_factory=list)


class ProjectUpdateIn(CamelSchema):
    title: str | None = None
    description: str | None = None
    is_published: bool | None = None
    is_template: bool | None = None
    disciplines: list[int] = Field(default_factory=list)


class ProjectListItemOut(CamelSchema):
    """
    List rows: compact project fields only.
    """

    uuid: UUID
    title: str
    owner_id: int
    is_published: bool
    is_archived: bool
    is_template: bool
    modified_on: datetime
    permissions: PermissionContextOut


class ProjectListMetaOut(CamelSchema):
    total: int


class ProjectListOut(CamelSchema):
    items: list[ProjectListItemOut]
    meta: ProjectListMetaOut


class ProjectWorkflowListItemOut(CamelSchema):
    uuid: UUID
    title: str
    description: str
    workflow_type: WorkflowType
    is_archived: bool
    is_favorite: bool
    permissions: PermissionContextOut


class ProjectDetailOut(CamelSchema):
    """
    Single project resource with minimal child workflow list metadata.
    """

    uuid: UUID
    title: str
    description: str
    is_published: bool
    is_archived: bool
    is_template: bool
    is_favorite: bool
    is_archived: bool
    owner: UserSummaryOut
    date_created: datetime
    modified_on: datetime
    disciplines: list[DisciplineOption] = []
    workflows: list[ProjectWorkflowListItemOut] = []
    permissions: PermissionContextOut


class ProjectDetailOutResp(CamelSchema):
    item: ProjectDetailOut


class ProjectDuplicatePlaceholderOut(CamelSchema):
    """
    Response for POST /project/{uuid}/duplicate while duplication is not implemented.
    """

    success: bool = True
    message: str
    project_uuid: UUID
