from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.enum import NodeType, WorkflowType
from course_flow.core.hierarchy import (
    InvalidWorkflowTypeError,
    child_node_type_for_workflow,
)
from course_flow.core.models import (
    Activitymeta,
    Authtoken,
    Channel,
    Coursemeta,
    Graph,
    Node,
    Section,
    Taskmeta,
    Workflow,
)


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def user():
    user_model = get_user_model()
    return user_model.objects.create_user(
        email="hierarchy@example.com", password="password123"
    )


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


def test_child_node_type_mapping():
    assert child_node_type_for_workflow("program") == NodeType.COURSE
    assert child_node_type_for_workflow("course") == NodeType.ACTIVITY
    assert child_node_type_for_workflow("activity") == NodeType.TASK


def test_task_workflow_type_is_not_allowed_at_root():
    with pytest.raises(InvalidWorkflowTypeError):
        child_node_type_for_workflow("task")


@pytest.mark.django_db
def test_create_workflow_rejects_task_type(client: Client, user):
    raw = _issue_token_for(user)
    resp = client.post(
        "/api/workflow",
        data={
            "projectId": None,
            "title": "Task root",
            "workflowType": "task",
            "description": "",
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert resp.status_code == 422


@pytest.mark.django_db
def test_node_create_sets_type_and_typed_meta(user):
    g = Graph.objects.create()
    workflow = Workflow.objects.create(
        graph=g,
        author=user,
        title="Program",
        description="",
        workflow_type=WorkflowType.PROGRAM,
    )
    channel = Channel.objects.create(graph=g, title="C", position=0)
    section = Section.objects.create(graph=g, title="S", position=0)
    node = Node.objects.create(
        section=section,
        channel=channel,
        workflow=workflow,
        section_row=0,
        node_type=NodeType.COURSE,
    )
    assert node.node_type == NodeType.COURSE
    assert hasattr(node, "coursemeta")


@pytest.mark.django_db
def test_activity_graph_nodes_are_task_type_with_taskmeta(user):
    g = Graph.objects.create()
    workflow = Workflow.objects.create(
        graph=g,
        author=user,
        title="Activity",
        description="",
        workflow_type=WorkflowType.ACTIVITY,
    )
    channel = Channel.objects.create(graph=g, title="C", position=0)
    section = Section.objects.create(graph=g, title="S", position=0)
    node = Node.objects.create(
        section=section,
        channel=channel,
        workflow=workflow,
        section_row=0,
        node_type=NodeType.TASK,
    )
    assert hasattr(node, "taskmeta")
    assert not Coursemeta.objects.filter(node=node).exists()


@pytest.mark.django_db
def test_api_place_node_assigns_child_type(client: Client, user):
    raw = _issue_token_for(user)
    create = client.post(
        "/api/workflow",
        data={
            "projectId": None,
            "title": "Course graph",
            "workflowType": "course",
            "description": "",
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert create.status_code == 200, create.content
    graph_uuid = create.json()["graphUuid"]
    g = Graph.objects.select_related("workflow").get(uuid=graph_uuid)
    section = Section.objects.create(graph=g, title="S", position=0)
    channel = Channel.objects.create(graph=g, title="C", position=0)

    place = client.post(
        f"/api/graph/{graph_uuid}/nodes/place",
        data={
            "sectionUuid": str(section.uuid),
            "channelUuid": str(channel.uuid),
            "rowHint": 0,
            "mode": "row",
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert place.status_code == 200, place.content
    created = place.json()["changes"]["nodes"]["created"][0]
    assert created["nodeType"] == "activity"
    node = Node.objects.get(uuid=created["uuid"])
    assert Activitymeta.objects.filter(node=node).exists()
