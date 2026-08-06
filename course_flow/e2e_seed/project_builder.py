"""Project, team, and user builders used by the E2E fixture orchestrator."""

from __future__ import annotations

from django.contrib.auth import get_user_model

from course_flow.core.enum import AccountRole, Role
from course_flow.core.models import Project, Team, TeamUser

User = get_user_model()


def ensure_fixture_user(
    *,
    email: str,
    first_name: str,
    last_name: str,
    password: str,
    account_role: AccountRole,
) -> User:
    user, _ = User.objects.get_or_create(
        email=email,
        defaults={
            "first_name": first_name,
            "last_name": last_name,
        },
    )
    changed: list[str] = []
    if user.first_name != first_name:
        user.first_name = first_name
        changed.append("first_name")
    if user.last_name != last_name:
        user.last_name = last_name
        changed.append("last_name")
    user.set_password(password)
    changed.append("password")
    if changed:
        user.save()
    user.set_account_role(account_role)
    return user


def create_project(
    owner: User,
    *,
    title: str,
    description: str,
) -> Project:
    return Project.objects.create(
        owner=owner,
        title=title,
        description=description,
        is_published=False,
        is_template=False,
    )


def ensure_team(project: Project, owner: User) -> Team:
    """Attach the project owner as the canonical owner-team membership."""
    team, _ = Team.objects.get_or_create(project=project)
    TeamUser.objects.get_or_create(
        team=team,
        user=owner,
        defaults={"role": Role.VIEWER},
    )
    return team
