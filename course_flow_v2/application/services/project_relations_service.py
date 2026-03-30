from __future__ import annotations

from uuid import UUID

from course_flow_v2.application.dto import (
    DisciplineDTO,
    ProjectTeamMemberDTO,
    TagDTO,
)
from course_flow_v2.core.models import (
    Project,
    ProjectTeam,
    ProjectTeamMember,
    Tag,
)


class ProjectRelationsService:
    """Read-side queries for project-related collections (not embedded on primary resources)."""

    def list_disciplines(self, project_uuid: UUID) -> list[DisciplineDTO] | None:
        p = Project.objects.filter(uuid=project_uuid).first()
        if p is None:
            return None
        return [
            DisciplineDTO(
                id=d.id,
                label=d.label,
                translation_plural=d.translation_plural,
            )
            for d in p.disciplines.all().order_by("label", "id")
        ]

    def list_tags(self, project_uuid: UUID) -> list[TagDTO] | None:
        p = Project.objects.filter(uuid=project_uuid).first()
        if p is None:
            return None
        return [
            TagDTO(
                id=t.id,
                label=t.label,
                translation_plural=t.translation_plural,
            )
            for t in Tag.objects.filter(project_id=p.id).order_by("label", "id")
        ]

    def list_team_members(self, project_uuid: UUID) -> list[ProjectTeamMemberDTO] | None:
        p = Project.objects.filter(uuid=project_uuid).first()
        if p is None:
            return None
        try:
            team: ProjectTeam = p.team
        except ProjectTeam.DoesNotExist:
            return []
        rows = (
            ProjectTeamMember.objects.filter(projectteam_id=team.id)
            .select_related("user")
            .order_by("id")
        )
        return [
            ProjectTeamMemberDTO(
                id=m.id,
                project_team_uuid=team.uuid,
                user_uuid=m.user.uuid,
                user_email=m.user.email,
            )
            for m in rows
        ]
