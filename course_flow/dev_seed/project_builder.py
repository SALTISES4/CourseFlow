"""Create project shell: owner context, team, disciplines, tags."""

from __future__ import annotations

from django.contrib.auth import get_user_model

from course_flow.core.enum import AccountRole, Role
from course_flow.core.models import (
    Discipline,
    Project,
    ProjectDiscipline,
    Team,
    TeamUser,
)
from course_flow.dev_seed.constants import (
    DEV_SEED_ADMIN_EMAIL,
    DEV_SEED_DEMO_PASSWORD,
    DEV_SEED_PROJECT_TITLE_PREFIX,
    DEV_SEED_STUDENT_EMAIL,
    DEV_SEED_TEACHER_EMAIL,
)
from course_flow.dev_seed.rng import SeededRNG

User = get_user_model()

# Global discipline catalog — we only link projects; we never delete these on clear.
_CANONICAL_DISCIPLINES = (
    "Computer Science",
    "Mathematics",
    "Education",
)


def get_or_create_disciplines() -> list[Discipline]:
    out: list[Discipline] = []
    for label in _CANONICAL_DISCIPLINES:
        d = Discipline.objects.filter(label=label).first()
        if d is None:
            d = Discipline.objects.create(
                label=label,
                translation_plural=label + " (plural)",
            )
        out.append(d)
    return out


class DevSeedAdminMissingError(RuntimeError):
    """Raised when the pre-created admin account is not in the database."""


def _get_existing_admin() -> User:
    try:
        return User.objects.get(email=DEV_SEED_ADMIN_EMAIL)
    except User.DoesNotExist as exc:
        raise DevSeedAdminMissingError(
            f"{DEV_SEED_ADMIN_EMAIL} must exist before seeding "
            "(run: just django-create-superuser)."
        ) from exc


def get_existing_admin() -> User:
    """Return the pre-created admin account required for seed commands."""
    return _get_existing_admin()


def _ensure_demo_user(
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


def ensure_dev_seed_accounts() -> list[User]:
    """
    Resolve seed project owners: existing admin plus teacher/student demo users.

    Admin is not created or modified here (see ``django-create-superuser``).
    Teacher and student are created/updated with ``DEV_SEED_DEMO_PASSWORD``.
    No extra member users are created.
    """
    admin = _get_existing_admin()
    admin.set_account_role(AccountRole.ADMIN)
    teacher = _ensure_demo_user(
        email=DEV_SEED_TEACHER_EMAIL,
        first_name="testteacher",
        last_name="",
        password=DEV_SEED_DEMO_PASSWORD,
        account_role=AccountRole.TEACHER,
    )
    student = _ensure_demo_user(
        email=DEV_SEED_STUDENT_EMAIL,
        first_name="teststudent",
        last_name="",
        password=DEV_SEED_DEMO_PASSWORD,
        account_role=AccountRole.STUDENT,
    )
    return [admin, teacher, student]


def create_project(
    owner,
    *,
    fake,
    rng: SeededRNG,
    title: str | None = None,
    description: str | None = None,
) -> Project:
    resolved_title = (
        title
        if title is not None
        else f"{DEV_SEED_PROJECT_TITLE_PREFIX}{fake.catch_phrase()}"
    )
    return Project.objects.create(
        owner=owner,
        title=resolved_title,
        description=description if description is not None else fake.text(max_nb_chars=400),
        is_published=False,
        is_template=False,
    )


def attach_disciplines(
    project: Project,
    pool: list[Discipline],
    *,
    rng: SeededRNG,
    max_n: int = 3,
) -> None:
    n = rng.randint(0, min(max_n, len(pool)))
    if n == 0:
        return
    for d in rng.sample(pool, n):
        ProjectDiscipline.objects.get_or_create(project=project, discipline=d)


def ensure_team(project: Project, owner: User) -> Team:
    """Attach the project owner as the sole team member."""
    team, _ = Team.objects.get_or_create(project=project)
    TeamUser.objects.get_or_create(
        team=team,
        user=owner,
        defaults={"role": Role.VIEWER},
    )
    return team
