from datetime import datetime, timedelta
from uuid import UUID

from course_flow_v2.api.common.schemas import CamelSchema


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
    """List rows: compact project fields only."""

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


class ProjectDetailOut(CamelSchema):
    """Single project resource: persisted fields only (no related collections)."""

    uuid: UUID
    title: str
    description: str
    is_published: bool
    is_template: bool
    owner_id: int
    date_created: datetime
    modified_on: datetime
    graphs: list["ProjectGraphOut"] = []


class ProjectDetailOutResp(CamelSchema):
    item: ProjectDetailOut


class ProjectDuplicatePlaceholderOut(CamelSchema):
    """Response for POST /project/{uuid}/duplicate while duplication is not implemented."""

    success: bool = True
    message: str
    project_uuid: UUID


class TaskMetaOut(CamelSchema):
    kind: str = "task_meta"
    context: str


class ProgramMetaOut(CamelSchema):
    kind: str = "program_meta"
    calculate_time: str
    calculate_credits: str
    calculate_ponderation: str
    calculate_classification: str
    classification_general_time: timedelta | None = None
    classification_specific_time: timedelta | None = None


class CourseMetaOut(CamelSchema):
    kind: str = "course_meta"
    classification: str
    code: str


class ActivityMetaOut(CamelSchema):
    kind: str = "activity_meta"
    context: str
    classification: str


class WorkflowOut(CamelSchema):
    uuid: UUID
    title: str
    description: str
    workflow_type: str
    meta: TaskMetaOut | ProgramMetaOut | CourseMetaOut | ActivityMetaOut | None = None


class ProjectGraphOut(CamelSchema):
    uuid: UUID
    title: str
    owner_id: int
    project_id: int | None
    revision_id: int
    date_created: datetime
    modified_on: datetime
    workflow: WorkflowOut
