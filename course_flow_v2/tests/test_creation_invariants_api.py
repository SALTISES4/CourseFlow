from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow_v2.core.auth import generate_raw_token, hash_token
from course_flow_v2.core.models import (
    AuthToken,
    Channel,
    Node,
    Outcome,
    Project,
    ProjectTeam,
    Section,
    Unit,
    Workflow,
)


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def user():
    user_model = get_user_model()
    return user_model.objects.create_user(email="inv-owner@example.com", password="password123")


def _auth_header(raw_token: str) -> dict[str, str]:
    return {"HTTP_AUTHORIZATION": f"Bearer {raw_token}"}


def _issue_token_for(user, *, expires_delta: timedelta = timedelta(hours=1)):
    now = timezone.now()
    raw_token = generate_raw_token()
    AuthToken.objects.create(
        user=user,
        token_hash=hash_token(raw_token),
        expires_at=now + expires_delta,
        last_used_at=now,
    )
    return raw_token


@pytest.mark.django_db
def test_project_create_initializes_project_team(client: Client, user):
    raw = _issue_token_for(user)
    resp = client.post(
        "/api/project",
        data={
            "title": "Project Invariants",
            "description": "",
            "is_published": False,
            "is_template": False,
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert resp.status_code == 200, resp.content
    project_uuid = resp.json()["uuid"]
    project = Project.objects.get(uuid=project_uuid)
    assert ProjectTeam.objects.filter(project=project).exists()


@pytest.mark.django_db
def test_project_detail_includes_workflow_unit_and_typed_meta(client: Client, user):
    raw = _issue_token_for(user)
    create_project = client.post(
        "/api/project",
        data={
            "title": "P",
            "description": "",
            "is_published": False,
            "is_template": False,
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert create_project.status_code == 200, create_project.content
    project_uuid = create_project.json()["uuid"]
    project = Project.objects.get(uuid=project_uuid)

    create_workflow = client.post(
        "/api/workflow",
        data={
            "project_id": project.id,
            "workflow_title": "W",
            "unit_title": "Task Unit",
            "unit_type": "task",
            "unit_description": "",
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert create_workflow.status_code == 200, create_workflow.content

    detail = client.get(f"/api/project/{project_uuid}", **_auth_header(raw))
    assert detail.status_code == 200, detail.content
    item = detail.json()["item"]
    assert "workflows" in item
    assert len(item["workflows"]) == 1
    wf = item["workflows"][0]
    assert wf["unit"]["unit_type"] == "task"
    assert wf["unit"]["meta"]["kind"] == "task_meta"
    assert "context" in wf["unit"]["meta"]


@pytest.mark.django_db
def test_create_invariants_auto_create_threads_and_unit_meta(user):
    wf = Workflow.objects.create(owner=user, title="WF")
    unit = Unit.objects.create(
        workflow=wf,
        title="Activity Unit",
        description="",
        unit_type=Unit.UnitType.ACTIVITY,
    )
    unit.refresh_from_db()
    assert hasattr(unit, "activity_meta")

    channel = Channel.objects.create(workflow=wf, title="C", position=0)
    section = Section.objects.create(workflow=wf, title="S", position=0)
    node = Node.objects.create(section=section, channel=channel, section_row=0)
    outcome = Outcome.objects.create(workflow=wf)

    assert channel.thread_id is not None
    assert section.thread_id is not None
    assert node.thread_id is not None
    assert outcome.thread_id is not None
