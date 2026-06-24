"""Tests for deterministic E2E fixture generation and clear behavior."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from django.contrib.auth import get_user_model

from course_flow.core.models import Project, Section
from course_flow.dev_seed.constants import (
    DEV_SEED_ADMIN_EMAIL,
    DEV_SEED_PROJECT_TITLE_PREFIX,
)
from course_flow.dev_seed.orchestrator import SeedConfig, generate_dev_seed
from course_flow.e2e_seed.clear import clear_e2e_fixtures
from course_flow.e2e_seed.constants import (
    E2E_FIXTURE_PROJECT_TITLE,
    E2E_FIXTURE_PROJECT_TITLE_PREFIX,
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


@pytest.fixture(autouse=True)
def _admin_user_for_e2e_seed(django_db_blocker):
    User = get_user_model()
    with django_db_blocker.unblock():
        User.objects.get_or_create(
            email=DEV_SEED_ADMIN_EMAIL,
            defaults={
                "first_name": "Admin",
                "last_name": "CourseFlow",
                "is_staff": True,
                "is_superuser": True,
            },
        )


@pytest.mark.django_db
def test_e2e_fixture_project_has_fixed_section_titles():
    manifest = generate_e2e_fixtures()
    project = Project.objects.get(uuid=manifest["project_uuid"])
    assert project.title == E2E_FIXTURE_PROJECT_TITLE

    sections = list(
        Section.objects.filter(graph__uuid=manifest["workflows"][0]["graph_uuid"]).order_by(
            "position"
        )
    )
    assert [section.title for section in sections] == list(E2E_SECTION_TITLES)
    assert manifest["workflows"][0]["sections"][1]["title"] == ""


@pytest.mark.django_db
def test_e2e_fixture_manifest_includes_contributors():
    manifest = generate_e2e_fixtures()
    roles = {c["role"] for c in manifest["contributors"]}
    assert roles == {"editor", "viewer"}


@pytest.mark.django_db
def test_e2e_fixture_manifest_includes_workflow_path_and_sections():
    manifest = generate_e2e_fixtures()
    workflow = manifest["workflows"][0]
    workflow_uuid = workflow["workflow_uuid"]

    assert workflow["workflow_path"] == f"/workflow/{workflow_uuid}/graph"
    assert len(workflow["sections"]) == len(E2E_SECTION_TITLES)
    assert all(section["uuid"] for section in workflow["sections"])


@pytest.mark.django_db
def test_e2e_fixture_manifest_written_to_path(tmp_path: Path):
    manifest_path = tmp_path / "workflow.json"
    generate_e2e_fixtures(manifest_path=manifest_path)

    payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert payload["project_title"] == E2E_FIXTURE_PROJECT_TITLE
    assert payload["workflows"][0]["workflow_path"].startswith("/workflow/")


@pytest.mark.django_db
def test_clear_e2e_fixtures_does_not_remove_dev_seed_projects():
    generate_dev_seed(SeedConfig(seed=1))
    generate_e2e_fixtures()

    assert Project.objects.filter(title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX).exists()
    assert Project.objects.filter(title__startswith=E2E_FIXTURE_PROJECT_TITLE_PREFIX).exists()

    clear_e2e_fixtures()

    assert Project.objects.filter(title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX).exists()
    assert not Project.objects.filter(title__startswith=E2E_FIXTURE_PROJECT_TITLE_PREFIX).exists()


@pytest.mark.django_db
def test_clear_then_seed_e2e_fixtures_replaces_existing_fixture_project():
    first = generate_e2e_fixtures()
    second = clear_then_seed_e2e_fixtures()

    assert first["project_uuid"] != second["project_uuid"]
    assert second["project_title"] == E2E_FIXTURE_PROJECT_TITLE
    assert (
        Project.objects.filter(title__startswith=E2E_FIXTURE_PROJECT_TITLE_PREFIX).count() == 1
    )
