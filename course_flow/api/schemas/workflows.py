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


class WorkflowOverviewMetadataIn(CamelSchema):
    code: str | None = Field(default=None, max_length=255)
    calculate_time_automatically: bool | None = None
    time: float | None = Field(default=None, ge=0)
    time_units: int | None = Field(default=None, ge=1)
    calculate_ponderation_automatically: bool | None = None
    theory_time: float | None = Field(default=None, ge=0)
    practical_time: float | None = Field(default=None, ge=0)
    individual_time: float | None = Field(default=None, ge=0)
    calculate_credits_automatically: bool | None = None
    credits: int | None = Field(default=None, ge=0)
    calculate_classification_automatically: bool | None = None
    general_time: float | None = Field(default=None, ge=0)
    specific_time: float | None = Field(default=None, ge=0)


class WorkflowOverviewMetadataOut(CamelSchema):
    code: str = ""
    calculate_time_automatically: bool = False
    time: float | None = None
    time_units: int | None = None
    calculate_ponderation_automatically: bool = False
    theory_time: float | None = None
    practical_time: float | None = None
    individual_time: float | None = None
    calculate_credits_automatically: bool = False
    credits: int | None = None
    calculate_classification_automatically: bool = False
    general_time: float | None = None
    specific_time: float | None = None


class WorkflowUpdateIn(CamelSchema):
    title: str | None = None
    project_uuid: UUID | None = None
    description: str | None = None
    overview_metadata: WorkflowOverviewMetadataIn | None = None


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
    overview_metadata: WorkflowOverviewMetadataOut
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
