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
class ProjectDuplicatePlaceholderDTO:
    """Echoes the source project UUID for the duplicate placeholder endpoint only."""

    project_uuid: UUID


@dataclass(frozen=True, slots=True)
class GraphDTO:
    id: int
    uuid: UUID
    title: str
    owner_id: int | None
    project_id: int | None
    revision_id: int
    workflow_uuid: UUID
    workflow_type: str
    workflow_title: str
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
    """Membership row (join) for project team API."""

    id: int
    project_team_uuid: UUID
    user_uuid: UUID
    user_email: str
    user_first_name: str
    user_last_name: str
    role: str


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


@dataclass(frozen=True, slots=True)
class ChannelDTO:
    uuid: UUID
    graph_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None
    date_created: datetime
    modified_on: datetime


@dataclass(frozen=True, slots=True)
class SectionDTO:
    uuid: UUID
    graph_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None
    date_created: datetime
    modified_on: datetime
