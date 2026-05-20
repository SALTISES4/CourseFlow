from datetime import datetime
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema
from course_flow.core.enum import WorkflowType


class ProjectCreateIn(CamelSchema):
    title: str
    description: str = ""
    is_published: bool = False
    is_template: bool = False


class ProjectUpdateIn(CamelSchema):
    title: str | None = None
    description: str | None = None
    is_published: bool | None = None
    is_template: bool | None = None


class ProjectListItemOut(CamelSchema):
    """
    List rows: compact project fields only.
    """

    uuid: UUID
    title: str
    owner_id: int
    is_published: bool
    is_template: bool
    modified_on: datetime


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
    is_favorite: bool


class ProjectDetailOut(CamelSchema):
    """
    Single project resource with minimal child workflow list metadata.
    """

    uuid: UUID
    title: str
    description: str
    is_published: bool
    is_template: bool
    is_favorite: bool
    owner_id: int
    date_created: datetime
    modified_on: datetime
    workflows: list[ProjectWorkflowListItemOut] = []


class ProjectDetailOutResp(CamelSchema):
    item: ProjectDetailOut


class ProjectDuplicatePlaceholderOut(CamelSchema):
    """
    Response for POST /project/{uuid}/duplicate while duplication is not implemented.
    """

    success: bool = True
    message: str
    project_uuid: UUID
