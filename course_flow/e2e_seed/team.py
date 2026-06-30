"""E2E fixture team members with explicit contributor roles."""

from __future__ import annotations

from course_flow.core.enum import Role
from course_flow.core.models import Project, TeamUser, User
from course_flow.dev_seed.constants import (
    DEV_SEED_DEMO_PASSWORD,
    DEV_SEED_STUDENT_EMAIL,
    DEV_SEED_TEACHER_EMAIL,
)
from course_flow.dev_seed.project_builder import _ensure_demo_user, ensure_team


def _contributor_manifest(*, email: str, role: Role) -> dict:
    return {
        "email": email,
        "role": role.value,
        "password": DEV_SEED_DEMO_PASSWORD,
    }


def ensure_e2e_contributors(project: Project, owner: User) -> list[dict]:
    """
    Attach demo teacher (editor) and student (viewer) to the E2E project team.

    Returns manifest entries for Playwright role-variant specs.
    """
    teacher = _ensure_demo_user(
        email=DEV_SEED_TEACHER_EMAIL,
        first_name="testteacher",
        last_name="",
        password=DEV_SEED_DEMO_PASSWORD,
    )
    student = _ensure_demo_user(
        email=DEV_SEED_STUDENT_EMAIL,
        first_name="teststudent",
        last_name="",
        password=DEV_SEED_DEMO_PASSWORD,
    )
    team = ensure_team(project, owner)
    TeamUser.objects.update_or_create(
        team=team,
        user=teacher,
        defaults={"role": Role.EDITOR},
    )
    TeamUser.objects.update_or_create(
        team=team,
        user=student,
        defaults={"role": Role.VIEWER},
    )
    return [
        _contributor_manifest(email=DEV_SEED_TEACHER_EMAIL, role=Role.EDITOR),
        _contributor_manifest(email=DEV_SEED_STUDENT_EMAIL, role=Role.VIEWER),
    ]
