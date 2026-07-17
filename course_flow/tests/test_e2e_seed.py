"""Tests for deterministic E2E fixture generation and clear behavior."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from django.contrib.auth import get_user_model

from course_flow.core.enum import AccountRole
from course_flow.core.models import Project, Section, TeamUser
from course_flow.dev_seed.constants import (
    DEV_SEED_ADMIN_EMAIL,
    DEV_SEED_PROJECT_TITLE_PREFIX,
    DEV_SEED_STUDENT_EMAIL,
    DEV_SEED_TEACHER_EMAIL,
)
from course_flow.dev_seed.orchestrator import SeedConfig, generate_dev_seed
from course_flow.e2e_seed.clear import clear_e2e_fixtures
from course_flow.e2e_seed.constants import (
    E2E_FIXTURE_ARCHIVED_HOME_PROJECT_TITLE,
    E2E_FIXTURE_COMMENTER_EMAIL,
    E2E_FIXTURE_EDITOR_EMAIL,
    E2E_FIXTURE_HOME_PROJECT_TITLES,
    E2E_FIXTURE_PROJECT_TITLE,
    E2E_FIXTURE_PROJECT_TITLE_PREFIX,
    E2E_OUTCOME_TITLE,
    E2E_SECTION_TITLES,
)
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
            graph__uuid=manifest["workflows"][0]["graph_uuid"]
        ).order_by("position")
    )
    assert [section.title for section in sections] == list(E2E_SECTION_TITLES)
    assert manifest["workflows"][0]["sections"][1]["title"] == ""


@pytest.mark.django_db
def test_e2e_fixture_primary_user_is_teacher_owner_without_admin_membership():
    manifest = generate_e2e_fixtures()
    project = Project.objects.get(uuid=manifest["project_uuid"])

    assert manifest["owner_email"] == DEV_SEED_TEACHER_EMAIL
    assert manifest["primary_user"]["email"] == DEV_SEED_TEACHER_EMAIL
    assert manifest["primary_user"]["account_role"] == AccountRole.TEACHER.value
    assert project.owner.email == DEV_SEED_TEACHER_EMAIL
    assert not TeamUser.objects.filter(
        team__project=project,
        user__email=DEV_SEED_ADMIN_EMAIL,
    ).exists()


@pytest.mark.django_db
def test_e2e_fixture_manifest_includes_contributors():
    manifest = generate_e2e_fixtures()
    contributors = {c["role"]: c["email"] for c in manifest["contributors"]}
    assert contributors == {
        "editor": E2E_FIXTURE_EDITOR_EMAIL,
        "commenter": E2E_FIXTURE_COMMENTER_EMAIL,
        "viewer": DEV_SEED_STUDENT_EMAIL,
    }


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
        owner__email=DEV_SEED_TEACHER_EMAIL,
        is_archived=False,
    ).count() == len(recent_projects)

    archived_project = manifest["archived_home_project"]
    assert archived_project["title"] == E2E_FIXTURE_ARCHIVED_HOME_PROJECT_TITLE
    assert archived_project["is_archived"] is True


@pytest.mark.django_db
def test_e2e_fixture_manifest_includes_workflow_path_and_sections():
    manifest = generate_e2e_fixtures()
    workflow = manifest["workflows"][0]
    workflow_uuid = workflow["workflow_uuid"]

    assert workflow["workflow_path"] == f"/workflow/{workflow_uuid}/graph"
    assert len(workflow["sections"]) == len(E2E_SECTION_TITLES)
    assert all(section["uuid"] for section in workflow["sections"])


@pytest.mark.django_db
def test_e2e_fixture_manifest_includes_outcomes():
    manifest = generate_e2e_fixtures()
    workflow = manifest["workflows"][0]

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
    assert payload["workflows"][0]["workflow_path"].startswith("/workflow/")


@pytest.mark.django_db
def test_clear_e2e_fixtures_does_not_remove_dev_seed_projects():
    # The dev seeder intentionally retains its own admin prerequisite; this
    # setup is local to the cross-seeder isolation test, not the E2E seeder.
    get_user_model().objects.create_superuser(
        email=DEV_SEED_ADMIN_EMAIL,
        password="password",
    )
    generate_dev_seed(SeedConfig(seed=1))
    generate_e2e_fixtures()

    assert Project.objects.filter(
        title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX
    ).exists()
    assert Project.objects.filter(
        title__startswith=E2E_FIXTURE_PROJECT_TITLE_PREFIX
    ).exists()

    clear_e2e_fixtures()

    assert Project.objects.filter(
        title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX
    ).exists()
    assert not Project.objects.filter(
        title__startswith=E2E_FIXTURE_PROJECT_TITLE_PREFIX
    ).exists()


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
        == 2 + len(E2E_FIXTURE_HOME_PROJECT_TITLES) + 1
    )
