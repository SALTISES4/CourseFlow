from enum import Enum
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema


class ProjectTeamRoleSchema(str, Enum):
    EDITOR = "editor"
    COMMENTER = "commenter"
    VIEWER = "viewer"


class DisciplineListItemOut(CamelSchema):
    code: str
    label: str
    translation_plural: str


class TagListItemOut(CamelSchema):
    id: int
    label: str
    translation_plural: str


class ProjectTagCreateIn(CamelSchema):
    label: str


class ProjectTagPatchIn(CamelSchema):
    label: str


class ProjectTeamListMetaOut(CamelSchema):
    total: int


class ProjectTeamMemberOut(CamelSchema):
    """
    Project team membership row.
    """

    id: int
    project_team_uuid: UUID
    user_uuid: UUID
    user_email: str
    user_first_name: str
    user_last_name: str
    role: ProjectTeamRoleSchema


class ProjectTeamListOut(CamelSchema):
    items: list[ProjectTeamMemberOut]
    meta: ProjectTeamListMetaOut


class ProjectTeamMemberAddIn(CamelSchema):
    """
    Add one or more users to the project team.
    """

    user_uuids: list[UUID]
    role: ProjectTeamRoleSchema


class ProjectTeamMemberRolePatchIn(CamelSchema):
    role: ProjectTeamRoleSchema
