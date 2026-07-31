"""E2E fixture team members with explicit contributor roles."""

from __future__ import annotations

from course_flow.core.enum import AccountRole, Role
from course_flow.core.models import Project, TeamUser, User
from course_flow.e2e_seed.constants import (
    E2E_FIXTURE_COMMENTER_EMAIL,
    E2E_FIXTURE_EDITOR_EMAIL,
    E2E_FIXTURE_PASSWORD,
    E2E_FIXTURE_STUDENT_EMAIL,
    E2E_FIXTURE_TEACHER_EMAIL,
)
from course_flow.e2e_seed.project_builder import (
    ensure_fixture_user,
    ensure_team,
)


def _contributor_manifest(*, email: str, role: Role) -> dict:
    return {
        "email": email,
        "role": role.value,
        "password": E2E_FIXTURE_PASSWORD,
    }


def ensure_e2e_owner() -> User:
    """Create or update the primary E2E actor: a non-admin teacher."""
    return ensure_fixture_user(
        email=E2E_FIXTURE_TEACHER_EMAIL,
        first_name="testteacher",
        last_name="Teacher",
        password=E2E_FIXTURE_PASSWORD,
        account_role=AccountRole.TEACHER,
    )


def ensure_e2e_contributors(project: Project, owner: User) -> list[dict]:
    """
    Attach non-admin editor, commenter, and viewer accounts to the E2E project.

    Returns manifest entries for Playwright role-variant specs.
    """
    editor = ensure_fixture_user(
        email=E2E_FIXTURE_EDITOR_EMAIL,
        first_name="testeditor",
        last_name="Editor",
        password=E2E_FIXTURE_PASSWORD,
        account_role=AccountRole.TEACHER,
    )
    commenter = ensure_fixture_user(
        email=E2E_FIXTURE_COMMENTER_EMAIL,
        first_name="testcommenter",
        last_name="Commenter",
        password=E2E_FIXTURE_PASSWORD,
        account_role=AccountRole.TEACHER,
    )
    student = ensure_fixture_user(
        email=E2E_FIXTURE_STUDENT_EMAIL,
        first_name="teststudent",
        last_name="Student",
        password=E2E_FIXTURE_PASSWORD,
        account_role=AccountRole.STUDENT,
    )
    team = ensure_team(project, owner)
    TeamUser.objects.update_or_create(
        team=team,
        user=editor,
        defaults={"role": Role.EDITOR},
    )
    TeamUser.objects.update_or_create(
        team=team,
        user=commenter,
        defaults={"role": Role.COMMENTER},
    )
    TeamUser.objects.update_or_create(
        team=team,
        user=student,
        defaults={"role": Role.VIEWER},
    )
    return [
        _contributor_manifest(email=E2E_FIXTURE_EDITOR_EMAIL, role=Role.EDITOR),
        _contributor_manifest(email=E2E_FIXTURE_COMMENTER_EMAIL, role=Role.COMMENTER),
        _contributor_manifest(email=E2E_FIXTURE_STUDENT_EMAIL, role=Role.VIEWER),
    ]
