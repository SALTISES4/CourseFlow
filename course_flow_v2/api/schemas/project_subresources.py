from uuid import UUID

from ninja import Schema


class DisciplineListItemOut(Schema):
    id: int
    label: str
    translation_plural: str


class TagListItemOut(Schema):
    id: int
    label: str
    translation_plural: str


class ProjectTeamMemberOut(Schema):
    """Join row for project team membership; extend when role fields exist on the model."""

    id: int
    project_team_uuid: UUID
    user_uuid: UUID
    user_email: str
