from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.enum import NodeType, WorkflowType
from course_flow.core.hierarchy import child_node_type_value_for_workflow
from course_flow.core.models import (
    Authtoken,
    Channel,
    Graph,
    Node,
    Outcome,
    Project,
    Section,
    Team,
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
    Authtoken.objects.create(
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
    assert Team.objects.filter(project=project).exists()


@pytest.mark.django_db
def test_project_detail_includes_workflow_list_metadata(client: Client, user):
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

    create_graph = client.post(
        "/api/workflow",
        data={
            "projectUuid": project_uuid,
            "title": "Course Workflow",
            "workflowType": "course",
            "description": "",
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert create_graph.status_code == 200, create_graph.content

    detail = client.get(f"/api/project/{project_uuid}", **_auth_header(raw))
    assert detail.status_code == 200, detail.content
    item = detail.json()["item"]
    assert "graphs" not in item
    assert "workflows" in item
    assert len(item["workflows"]) == 1
    workflow = item["workflows"][0]
    assert workflow["title"] == "Course Workflow"
    assert workflow["description"] == ""
    assert workflow["workflowType"] == "course"
    assert workflow["isFavorite"] is False
    assert workflow["isArchived"] is False
    assert workflow["permissions"]["resourceRole"] == "owner"


@pytest.mark.django_db
@pytest.mark.parametrize("title", ["", "   ", "x" * 201])
def test_create_workflow_rejects_invalid_title(client: Client, user, title: str):
    raw = _issue_token_for(user)

    response = client.post(
        "/api/workflow",
        data={
            "projectUuid": None,
            "title": title,
            "workflowType": "course",
            "description": "",
        },
        content_type="application/json",
        **_auth_header(raw),
    )

    assert response.status_code == 422, response.content
    assert not Workflow.objects.exists()


@pytest.mark.django_db
def test_create_workflow_trims_title(client: Client, user):
    raw = _issue_token_for(user)

    response = client.post(
        "/api/workflow",
        data={
            "projectUuid": None,
            "title": "  Valid title  ",
            "workflowType": "course",
            "description": "",
        },
        content_type="application/json",
        **_auth_header(raw),
    )

    assert response.status_code == 200, response.content
    assert response.json()["title"] == "Valid title"


@pytest.mark.django_db
def test_create_invariants_auto_create_threads_and_workflow_meta(user):
    g = Graph.objects.create()
    workflow = Workflow.objects.create(
        graph=g,
        author=user,
        title="Activity Workflow",
        description="",
        workflow_type=WorkflowType.ACTIVITY,
    )
    workflow.refresh_from_db()
    assert hasattr(workflow, "activitymeta")

    channel = Channel.objects.create(graph=g, title="C", position=0)
    section = Section.objects.create(graph=g, title="S", position=0)
    node = Node.objects.create(
        section=section,
        channel=channel,
        workflow=workflow,
        section_row=0,
        node_type=child_node_type_value_for_workflow(workflow.workflow_type),
    )
    outcome = Outcome.objects.create(graph=g)

    assert channel.thread_id is not None
    assert section.thread_id is not None
    assert node.thread_id is not None
    assert outcome.thread_id is not None
    assert node.node_type == NodeType.TASK
    assert hasattr(node, "taskmeta")
