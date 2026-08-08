from __future__ import annotations

from uuid import UUID

from django.contrib.auth import get_user_model
from django.db import transaction

from course_flow.application.dto import (
    DisciplineDTO,
    ProjectTeamMemberDTO,
    TagDTO,
)
from course_flow.core.models import Project, Tag, Team, TeamUser, Workflow

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

    def create_tag(self, project_uuid: UUID, label: str) -> TagDTO | None:
        try:
            project = Project.objects.get(uuid=project_uuid)
        except Project.DoesNotExist:
            return None
        clean_label = label.strip()
        if not clean_label:
            raise ValueError("tag_label_required")
        tag = Tag.objects.create(project=project, label=clean_label)
        return TagDTO(
            id=tag.id,
            label=tag.label,
            translation_plural=tag.translation_plural,
        )

    def update_tag(
        self, project_uuid: UUID, tag_id: int, label: str
    ) -> TagDTO | None:
        clean_label = label.strip()
        if not clean_label:
            raise ValueError("tag_label_required")
        tag = Tag.objects.filter(project__uuid=project_uuid, id=tag_id).first()
        if tag is None:
            return None
        tag.label = clean_label
        tag.save(update_fields=["label"])
        return TagDTO(
            id=tag.id,
            label=tag.label,
            translation_plural=tag.translation_plural,
        )

    def delete_tag(self, project_uuid: UUID, tag_id: int) -> bool:
        deleted, _ = Tag.objects.filter(
            project__uuid=project_uuid,
            id=tag_id,
        ).delete()
        return deleted > 0

    def _team_member_to_dto(
        self, m: TeamUser, team: Team
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
            team: Team = p.team
        except Team.DoesNotExist:
            return []
        rows = (
            TeamUser.objects.filter(team_id=team.id)
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
        team, _ = Team.objects.get_or_create(project=p)

        unique_uuids = list(dict.fromkeys(user_uuids))
        users = list(User.objects.filter(uuid__in=unique_uuids))
        found = {u.uuid for u in users}
        if found != set(unique_uuids):
            raise ValueError("unknown_user_uuids")

        by_uuid = {u.uuid: u for u in users}
        ordered_users = [by_uuid[uid] for uid in unique_uuids]

        out: list[ProjectTeamMemberDTO] = []
        for u in ordered_users:
            m, _created = TeamUser.objects.get_or_create(
                team=team,
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
        team, _ = Team.objects.get_or_create(project=p)
        m = (
            TeamUser.objects.filter(pk=membership_id, team_id=team.id)
            .select_related("user")
            .first()
        )
        if m is None:
            return None
        m.role = role
        m.save(update_fields=["role"])
        return self._team_member_to_dto(m, team)

    @transaction.atomic
    def remove_team_member(
        self, project_uuid: UUID, membership_id: int
    ) -> bool:
        try:
            p = Project.objects.select_for_update().get(uuid=project_uuid)
        except Project.DoesNotExist:
            return False
        team, _ = Team.objects.get_or_create(project=p)
        membership = (
            TeamUser.objects.select_for_update()
            .filter(pk=membership_id, team_id=team.id)
            .first()
        )
        if membership is None:
            return False

        # Workflow authorship conveys owner permissions. Transfer it before
        # removing membership so a former contributor cannot retain access.
        Workflow.objects.filter(
            project_id=p.id,
            author_id=membership.user_id,
        ).update(author_id=p.owner_id)
        membership.delete()
        return True
