"""Tests for deterministic E2E fixture generation and clear behavior."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from course_flow.core.enum import AccountRole
from course_flow.core.models import (
    Discipline,
    FavoriteGraph,
    FavoriteProject,
    Project,
    Section,
    TeamUser,
)
from course_flow.e2e_seed.catalog import seed_assets_by_id
from course_flow.e2e_seed.clear import clear_e2e_fixtures
from course_flow.e2e_seed.constants import (
    E2E_FIXTURE_ARCHIVED_HOME_PROJECT_TITLE,
    E2E_FIXTURE_COMMENTER_EMAIL,
    E2E_FIXTURE_EDITOR_EMAIL,
    E2E_FIXTURE_FAVOURITE_PROJECT_TITLES,
    E2E_FIXTURE_HOME_PROJECT_TITLES,
    E2E_FIXTURE_PROJECT_TITLE,
    E2E_FIXTURE_PROJECT_TITLE_PREFIX,
    E2E_FIXTURE_RESTRICTED_PROJECT_TITLE,
    E2E_FIXTURE_STUDENT_EMAIL,
    E2E_FIXTURE_TEACHER_EMAIL,
    E2E_OUTCOME_TITLE,
    E2E_SECTION_TITLES,
)
from course_flow.e2e_seed.disciplines import E2E_DISCIPLINE_CATALOGUE
from course_flow.e2e_seed.orchestrator import (
    clear_then_seed_e2e_fixtures,
    generate_e2e_fixtures,
)


@pytest.fixture(autouse=True)
def _clear_e2e_fixtures_before_each(django_db_blocker):
    with django_db_blocker.unblock():
        clear_e2e_fixtures()


@pytest.mark.django_db
def test_e2e_fixture_project_has_fixed_section_titles():
    manifest = generate_e2e_fixtures()
    project = Project.objects.get(uuid=manifest["project_uuid"])
    assert project.title == E2E_FIXTURE_PROJECT_TITLE

    sections = list(
        Section.objects.filter(
            graph__uuid=manifest["assets"]["workflow.standard_activity"]["graph_uuid"]
        ).order_by("position")
    )
    assert [section.title for section in sections] == list(E2E_SECTION_TITLES)
    assert manifest["assets"]["workflow.standard_activity"]["sections"][1]["title"] == ""


@pytest.mark.django_db
def test_e2e_fixture_primary_user_is_teacher_owner():
    manifest = generate_e2e_fixtures()
    project = Project.objects.get(uuid=manifest["project_uuid"])

    assert manifest["owner_email"] == E2E_FIXTURE_TEACHER_EMAIL
    assert manifest["primary_user"]["email"] == E2E_FIXTURE_TEACHER_EMAIL
    assert manifest["primary_user"]["account_role"] == AccountRole.TEACHER.value
    assert project.owner.email == E2E_FIXTURE_TEACHER_EMAIL
    assert project.owner.first_name == "testteacher"
    assert project.owner.last_name == "Teacher"


@pytest.mark.django_db
def test_e2e_fixture_disciplines_match_code_owned_catalogue():
    generate_e2e_fixtures()

    assert list(
        Discipline.objects.filter(
            code__in=E2E_DISCIPLINE_CATALOGUE
        )
        .order_by("code")
        .values_list("code", flat=True)
    ) == list(E2E_DISCIPLINE_CATALOGUE)


@pytest.mark.django_db
def test_e2e_fixture_manifest_includes_contributors():
    manifest = generate_e2e_fixtures()
    contributors = {c["role"]: c["email"] for c in manifest["contributors"]}
    assert contributors == {
        "editor": E2E_FIXTURE_EDITOR_EMAIL,
        "commenter": E2E_FIXTURE_COMMENTER_EMAIL,
        "viewer": E2E_FIXTURE_STUDENT_EMAIL,
    }


@pytest.mark.django_db
def test_e2e_fixture_favourites_cover_default_project_and_workflow_scopes():
    manifest = generate_e2e_fixtures()
    template_project = Project.objects.get(uuid=manifest["template_project_uuid"])
    primary_project = Project.objects.get(uuid=manifest["project_uuid"])

    assert FavoriteGraph.objects.filter(
        user__email=E2E_FIXTURE_TEACHER_EMAIL,
        graph__workflow__project=primary_project,
    ).count() == 1

    assert FavoriteProject.objects.filter(
        user__email=E2E_FIXTURE_TEACHER_EMAIL,
        project=template_project,
    ).exists()
    assert FavoriteGraph.objects.filter(
        user__email=E2E_FIXTURE_TEACHER_EMAIL,
        graph__workflow__project=template_project,
    ).count() == 3
    favourite_projects = manifest["assets"]["project.favourite_collection"]["items"]
    assert len(favourite_projects) == 5
    assert FavoriteProject.objects.filter(
        user__email=E2E_FIXTURE_TEACHER_EMAIL,
        project__uuid__in=[project["uuid"] for project in favourite_projects],
    ).count() == 5


@pytest.mark.django_db
def test_e2e_fixture_home_projects_cover_cap_order_and_archive_exclusion():
    manifest = generate_e2e_fixtures()
    recent_projects = manifest["recent_projects"]

    assert [project["title"] for project in recent_projects] == list(
        E2E_FIXTURE_HOME_PROJECT_TITLES
    )
    assert len(recent_projects) == 5
    assert all(not project["is_archived"] for project in recent_projects)
    assert [project["modified_on"] for project in recent_projects] == sorted(
        (project["modified_on"] for project in recent_projects),
        reverse=True,
    )
    assert Project.objects.filter(
        uuid__in=[project["uuid"] for project in recent_projects],
        owner__email=E2E_FIXTURE_TEACHER_EMAIL,
        is_archived=False,
    ).count() == len(recent_projects)

    archived_project = manifest["archived_home_project"]
    assert archived_project["title"] == E2E_FIXTURE_ARCHIVED_HOME_PROJECT_TITLE
    assert archived_project["is_archived"] is True
    assert (
        Project.objects.get(uuid=archived_project["uuid"]).owner.email
        == E2E_FIXTURE_TEACHER_EMAIL
    )
    assert set(
        TeamUser.objects.filter(
            team__project__uuid=archived_project["uuid"],
        ).values_list("role", flat=True)
    ) == {"editor", "commenter", "viewer"}


@pytest.mark.django_db
def test_e2e_fixture_manifest_includes_workflow_path_and_sections():
    manifest = generate_e2e_fixtures()
    assert set(manifest["assets"]) == set(seed_assets_by_id())
    workflow = manifest["assets"]["workflow.standard_activity"]
    workflow_uuid = workflow["workflow_uuid"]

    assert workflow["workflow_path"] == f"/workflow/{workflow_uuid}/graph"
    assert len(workflow["sections"]) == len(E2E_SECTION_TITLES)
    assert all(section["uuid"] for section in workflow["sections"])


@pytest.mark.django_db
def test_e2e_fixture_includes_private_workflow_outside_primary_teacher_scope():
    manifest = generate_e2e_fixtures()
    restricted = manifest["restricted_workflow"]
    project = Project.objects.get(uuid=restricted["project_uuid"])

    assert project.title == E2E_FIXTURE_RESTRICTED_PROJECT_TITLE
    assert project.is_published is False
    assert project.owner.email == E2E_FIXTURE_EDITOR_EMAIL
    assert not TeamUser.objects.filter(
        team__project=project,
        user__email=E2E_FIXTURE_TEACHER_EMAIL,
    ).exists()
    assert restricted["workflow_path"].startswith("/workflow/")


@pytest.mark.django_db
def test_e2e_fixture_manifest_includes_outcomes():
    manifest = generate_e2e_fixtures()
    workflow = manifest["assets"]["workflow.standard_activity"]

    assert workflow.get("outcome_count", 0) >= 1
    outcomes = workflow.get("outcomes") or []
    assert len(outcomes) >= 1
    assert outcomes[0]["title"] == E2E_OUTCOME_TITLE
    assert outcomes[0]["uuid"]


@pytest.mark.django_db
def test_e2e_fixture_manifest_written_to_path(tmp_path: Path):
    manifest_path = tmp_path / "workflow.json"
    generate_e2e_fixtures(manifest_path=manifest_path)

    payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert payload["project_title"] == E2E_FIXTURE_PROJECT_TITLE
    assert payload["assets"]["workflow.standard_activity"]["workflow_path"].startswith(
        "/workflow/"
    )


def test_seed_asset_catalog_matches_runtime_manifest_contract():
    catalog_ids = set(seed_assets_by_id())
    assert {
        "actor.teacher",
        "project.primary",
        "workflow.standard_activity",
        "workflow.navigation_course",
        "workflow.navigation_program",
    }.issubset(catalog_ids)


@pytest.mark.django_db
def test_clear_then_seed_e2e_fixtures_replaces_existing_fixture_project():
    first = generate_e2e_fixtures()
    second = clear_then_seed_e2e_fixtures()

    assert first["project_uuid"] != second["project_uuid"]
    assert second["project_title"] == E2E_FIXTURE_PROJECT_TITLE
    assert (
        Project.objects.filter(
            title__startswith=E2E_FIXTURE_PROJECT_TITLE_PREFIX
        ).count()
        == 3
        + len(E2E_FIXTURE_HOME_PROJECT_TITLES)
        + len(E2E_FIXTURE_FAVOURITE_PROJECT_TITLES)
        + 1
    )
