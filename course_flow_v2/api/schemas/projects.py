from datetime import datetime, timedelta
from uuid import UUID

from ninja import Schema


class ProjectCreateIn(Schema):
    title: str
    description: str = ""
    is_published: bool = False
    is_template: bool = False


class ProjectUpdateIn(Schema):
    title: str | None = None
    description: str | None = None
    is_published: bool | None = None
    is_template: bool | None = None


class ProjectListItemOut(Schema):
    """List rows: compact project fields only."""

    uuid: UUID
    title: str
    owner_id: int
    is_published: bool
    is_template: bool
    modified_on: datetime


class ProjectListMetaOut(Schema):
    total: int


class ProjectListOut(Schema):
    items: list[ProjectListItemOut]
    meta: ProjectListMetaOut


class ProjectDetailOut(Schema):
    """Single project resource: persisted fields only (no related collections)."""

    uuid: UUID
    title: str
    description: str
    is_published: bool
    is_template: bool
    owner_id: int
    date_created: datetime
    modified_on: datetime
    workflows: list["ProjectWorkflowOut"] = []


class ProjectDetailOutResp(Schema):
    item: ProjectDetailOut


class TaskMetaOut(Schema):
    kind: str = "task_meta"
    context: str


class ProgramMetaOut(Schema):
    kind: str = "program_meta"
    calculate_time: str
    calculate_credits: str
    calculate_ponderation: str
    calculate_classification: str
    classification_general_time: timedelta | None = None
    classification_specific_time: timedelta | None = None


class CourseMetaOut(Schema):
    kind: str = "course_meta"
    classification: str
    code: str


class ActivityMetaOut(Schema):
    kind: str = "activity_meta"
    context: str
    classification: str


class UnitOut(Schema):
    uuid: UUID
    title: str
    description: str
    unit_type: str
    meta: TaskMetaOut | ProgramMetaOut | CourseMetaOut | ActivityMetaOut | None = None


class ProjectWorkflowOut(Schema):
    uuid: UUID
    title: str
    owner_id: int
    project_id: int | None
    revision_id: int
    date_created: datetime
    modified_on: datetime
    unit: UnitOut
