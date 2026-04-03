from __future__ import annotations

from uuid import UUID

from django.contrib.auth import get_user_model

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

User = get_user_model()


class ProjectRelationsService:
    """Read-side queries for project-related collections (not embedded on primary resources)."""

    def list_disciplines(self, project_uuid: UUID) -> list[DisciplineDTO] | None:
        try:
            p = Project.objects.get(uuid=project_uuid)
        except Project.DoesNotExist:
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
        try:
            p = Project.objects.get(uuid=project_uuid)
        except Project.DoesNotExist:
            return None
        return [
            TagDTO(
                id=t.id,
                label=t.label,
                translation_plural=t.translation_plural,
            )
            for t in Tag.objects.filter(project_id=p.id).order_by("label", "id")
        ]

    def _team_member_to_dto(
        self, m: ProjectTeamMember, team: ProjectTeam
    ) -> ProjectTeamMemberDTO:
        return ProjectTeamMemberDTO(
            id=m.id,
            project_team_uuid=team.uuid,
            user_uuid=m.user.uuid,
            user_email=m.user.email,
            user_first_name=m.user.first_name or "",
            user_last_name=m.user.last_name or "",
            role=m.role,
        )

    def list_team_members(self, project_uuid: UUID) -> list[ProjectTeamMemberDTO] | None:
        try:
            p = Project.objects.get(uuid=project_uuid)
        except Project.DoesNotExist:
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
        return [self._team_member_to_dto(m, team) for m in rows]

    def add_team_members(
        self,
        project_uuid: UUID,
        user_uuids: list[UUID],
        role: str,
    ) -> list[ProjectTeamMemberDTO] | None:
        """Attach users to the project's team.

        Duplicate UUIDs in ``user_uuids`` are de-duplicated (order preserved).

        If a user is already a member, returns the existing row unchanged (role is
        not updated here; use ``update_team_member_role`` to change roles).
        """
        try:
            p = Project.objects.get(uuid=project_uuid)
        except Project.DoesNotExist:
            return None
        team, _ = ProjectTeam.objects.get_or_create(project=p)

        unique_uuids = list(dict.fromkeys(user_uuids))
        users = list(User.objects.filter(uuid__in=unique_uuids))
        found = {u.uuid for u in users}
        if found != set(unique_uuids):
            raise ValueError("unknown_user_uuids")

        by_uuid = {u.uuid: u for u in users}
        ordered_users = [by_uuid[uid] for uid in unique_uuids]

        out: list[ProjectTeamMemberDTO] = []
        for u in ordered_users:
            m, _created = ProjectTeamMember.objects.get_or_create(
                projectteam=team,
                user=u,
                defaults={"role": role},
            )
            out.append(self._team_member_to_dto(m, team))
        return out

    def update_team_member_role(
        self,
        project_uuid: UUID,
        membership_id: int,
        role: str,
    ) -> ProjectTeamMemberDTO | None:
        try:
            p = Project.objects.get(uuid=project_uuid)
        except Project.DoesNotExist:
            return None
        team, _ = ProjectTeam.objects.get_or_create(project=p)
        m = (
            ProjectTeamMember.objects.filter(pk=membership_id, projectteam_id=team.id)
            .select_related("user")
            .first()
        )
        if m is None:
            return None
        m.role = role
        m.save(update_fields=["role"])
        return self._team_member_to_dto(m, team)

    def remove_team_member(
        self, project_uuid: UUID, membership_id: int
    ) -> bool:
        try:
            p = Project.objects.get(uuid=project_uuid)
        except Project.DoesNotExist:
            return False
        team, _ = ProjectTeam.objects.get_or_create(project=p)
        deleted, _ = ProjectTeamMember.objects.filter(
            pk=membership_id, projectteam_id=team.id
        ).delete()
        return deleted > 0
