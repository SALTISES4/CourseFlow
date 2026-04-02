from uuid import UUID

from course_flow_v2.api.common.schemas import CamelSchema


class DisciplineListItemOut(CamelSchema):
    id: int
    label: str
    translation_plural: str


class TagListItemOut(CamelSchema):
    id: int
    label: str
    translation_plural: str


class ProjectTeamMemberOut(CamelSchema):
    """Join row for project team membership; extend when role fields exist on the model."""

    id: int
    project_team_uuid: UUID
    user_uuid: UUID
    user_email: str
