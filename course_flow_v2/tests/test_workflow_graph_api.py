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
    Section,
    Workflow,
)


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def user():
    user_model = get_user_model()
    return user_model.objects.create_user(email="graph-owner@example.com", password="password123")


@pytest.fixture
def other_user():
    user_model = get_user_model()
    return user_model.objects.create_user(email="graph-other@example.com", password="password123")


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


def _create_workflow(client: Client, raw_token: str) -> str:
    response = client.post(
        "/api/workflow",
        data={
            "project_id": None,
            "workflow_title": "Graph Test",
            "unit_title": "Root",
            "unit_type": "course",
            "unit_description": "",
        },
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200, response.content
    return response.json()["uuid"]


@pytest.mark.django_db
def test_workflow_graph_top_level_shape_and_flat_collections(client: Client, user):
    raw_token = _issue_token_for(user)
    wf_uuid = _create_workflow(client, raw_token)

    response = client.get(
        f"/api/workflow/{wf_uuid}/graph",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    body = response.json()

    assert set(body.keys()) == {
        "workflow",
        "channels",
        "sections",
        "nodes",
        "edges",
        "thread_comment_counts",
    }
    assert isinstance(body["channels"], list)
    assert isinstance(body["sections"], list)
    assert isinstance(body["nodes"], list)
    assert isinstance(body["edges"], list)
    assert isinstance(body["thread_comment_counts"], list)

    wf = body["workflow"]
    assert wf["uuid"] == str(wf_uuid)
    assert wf["title"] == "Graph Test"
    assert wf["revision_id"] == 0
    assert "root_unit_uuid" in wf
    assert "root_unit_type" in wf


@pytest.mark.django_db
def test_workflow_graph_uses_uuid_references_not_nested_entities(client: Client, user):
    raw_token = _issue_token_for(user)
    wf_uuid = _create_workflow(client, raw_token)

    body = client.get(
        f"/api/workflow/{wf_uuid}/graph",
        **_auth_header(raw_token),
    ).json()

    for ch in body["channels"]:
        assert isinstance(ch, dict)
        assert "uuid" in ch
        assert "workflow_uuid" in ch
        assert ch["workflow_uuid"] == str(wf_uuid)
        assert "thread_uuid" in ch

    for node in body["nodes"]:
        assert isinstance(node, dict)
        assert "uuid" in node
        for key in ("section_uuid", "channel_uuid", "section_row", "unit_uuid", "thread_uuid"):
            assert key in node
        assert "outcome_uuids" in node
        assert isinstance(node["outcome_uuids"], list)

    for edge in body["edges"]:
        assert "source_node_uuid" in edge
        assert "target_node_uuid" in edge


@pytest.mark.django_db
def test_workflow_graph_requires_auth(client: Client, user):
    raw_token = _issue_token_for(user)
    wf_uuid = _create_workflow(client, raw_token)

    response = client.get(f"/api/workflow/{wf_uuid}/graph")
    assert response.status_code == 401


@pytest.mark.django_db
def test_workflow_graph_node_includes_section_row(client: Client, user):
    raw_token = _issue_token_for(user)
    wf_uuid = _create_workflow(client, raw_token)
    wf = Workflow.objects.get(uuid=wf_uuid)
    channel = Channel.objects.create(workflow=wf, title="Col A", position=0)
    section = Section.objects.create(workflow=wf, title="Grid 1", position=0)
    Node.objects.create(section=section, channel=channel, section_row=4)

    body = client.get(
        f"/api/workflow/{wf_uuid}/graph",
        **_auth_header(raw_token),
    ).json()
    assert len(body["nodes"]) == 1
    row = body["nodes"][0]
    assert row["section_row"] == 4
    assert row["section_uuid"] == str(section.uuid)
    assert row["channel_uuid"] == str(channel.uuid)


@pytest.mark.django_db
def test_workflow_graph_forbidden_for_non_owner(client: Client, user, other_user):
    raw_owner = _issue_token_for(user)
    wf_uuid = _create_workflow(client, raw_owner)

    raw_other = _issue_token_for(other_user)
    response = client.get(
        f"/api/workflow/{wf_uuid}/graph",
        **_auth_header(raw_other),
    )
    assert response.status_code == 403
