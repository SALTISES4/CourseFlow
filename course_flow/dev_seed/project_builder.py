"""Create project shell: owner context, team, disciplines, tags."""

from __future__ import annotations

from django.contrib.auth import get_user_model

from course_flow.core.enum import Role
from course_flow.core.models import (
    Discipline,
    Project,
    ProjectDiscipline,
    Team,
    TeamUser,
)
from course_flow.dev_seed.constants import DEV_SEED_PROJECT_TITLE_PREFIX
from course_flow.dev_seed.rng import SeededRNG

User = get_user_model()
DEV_SEED_OWNER_EMAIL = "admin@courseflow.com"

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


def ensure_seed_users(
    *,
    rng: SeededRNG,
    seed: int,
    team_size: int = 3,
) -> tuple:
    """
    Deterministic users for owner + team members.

    Owner is always the local admin account so seeded projects/graphs are
    authored by the same user across runs.
    """
    owner_email = DEV_SEED_OWNER_EMAIL
    owner, _ = User.objects.get_or_create(
        email=owner_email,
        defaults={
            "first_name": "Admin",
            "last_name": "CourseFlow",
            "is_staff": True,
            "is_superuser": True,
        },
    )
    if not owner.is_staff or not owner.is_superuser:
        owner.is_staff = True
        owner.is_superuser = True
        owner.save(update_fields=["is_staff", "is_superuser"])
    if not owner.has_usable_password():
        owner.set_password("dev-seed-password")
        owner.save()

    members: list = [owner]
    for i in range(1, team_size):
        email = f"cf-dev-seed-{seed}-member{i}@local.test"
        u, _ = User.objects.get_or_create(
            email=email,
            defaults={"first_name": f"Member{i}", "last_name": "Seed"},
        )
        if not u.has_usable_password():
            u.set_password("dev-seed-password")
            u.save()
        members.append(u)

    return owner, members


def create_project(
    owner,
    *,
    fake,
    rng: SeededRNG,
) -> Project:
    title = f"{DEV_SEED_PROJECT_TITLE_PREFIX}{fake.catch_phrase()}"
    return Project.objects.create(
        owner=owner,
        title=title,
        description=fake.text(max_nb_chars=400),
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


def ensure_team(
    project: Project,
    members: list,
    *,
    rng: SeededRNG,
) -> Team:
    team, _ = Team.objects.get_or_create(project=project)
    if len(members) == 1:
        to_add = members
    else:
        extra = rng.randint(1, len(members) - 1)
        to_add = [members[0]] + members[1 : 1 + extra]
    for u in to_add:
        TeamUser.objects.get_or_create(
            team=team,
            user=u,
            defaults={"role": Role.VIEWER},
        )
    return team
