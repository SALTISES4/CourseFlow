from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True, slots=True)
class ProjectDTO:
    id: int
    uuid: UUID
    title: str
    description: str
    is_published: bool
    is_template: bool
    owner_id: int
    date_created: datetime
    modified_on: datetime


@dataclass(frozen=True, slots=True)
class WorkflowDTO:
    id: int
    uuid: UUID
    title: str
    owner_id: int
    project_id: int | None
    revision_id: int
    unit_uuid: UUID
    unit_type: str
    unit_title: str
    date_created: datetime
    modified_on: datetime


@dataclass(frozen=True, slots=True)
class DisciplineDTO:
    id: int
    label: str
    translation_plural: str


@dataclass(frozen=True, slots=True)
class TagDTO:
    id: int
    label: str
    translation_plural: str


@dataclass(frozen=True, slots=True)
class ProjectTeamMemberDTO:
    """Membership row (join); extend when role/metadata is added to the model."""

    id: int
    project_team_uuid: UUID
    user_uuid: UUID
    user_email: str


@dataclass(frozen=True, slots=True)
class CommentAuthorDTO:
    uuid: UUID
    email: str
    first_name: str
    last_name: str


@dataclass(frozen=True, slots=True)
class CommentDTO:
    uuid: UUID
    thread_uuid: UUID
    body: str
    date_created: datetime
    modified_on: datetime
    author: CommentAuthorDTO
