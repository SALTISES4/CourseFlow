from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow_v2.core.auth import generate_raw_token, hash_token
from course_flow_v2.core.models import AuthToken, Channel, Graph, Node, Section


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


def _create_graph(client: Client, raw_token: str) -> str:
    response = client.post(
        "/api/graph",
        data={
            "projectId": None,
            "graphTitle": "Graph Test",
            "workflowTitle": "Root",
            "workflowType": "course",
            "workflowDescription": "",
        },
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200, response.content
    return response.json()["uuid"]


@pytest.mark.django_db
def test_graph_view_top_level_shape_and_flat_collections(client: Client, user):
    raw_token = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw_token)

    response = client.get(
        f"/api/graph/{wf_uuid}/view",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    body = response.json()

    assert set(body.keys()) == {
        "graph",
        "channels",
        "sections",
        "nodes",
        "edges",
        "threadCommentCounts",
    }
    assert isinstance(body["channels"], list)
    assert isinstance(body["sections"], list)
    assert isinstance(body["nodes"], list)
    assert isinstance(body["edges"], list)
    assert isinstance(body["threadCommentCounts"], list)

    wf = body["graph"]
    assert wf["uuid"] == str(wf_uuid)
    assert wf["title"] == "Graph Test"
    assert wf["revisionId"] == 0
    assert "rootWorkflowUuid" in wf
    assert "rootWorkflowType" in wf


@pytest.mark.django_db
def test_graph_view_uses_uuid_references_not_nested_entities(client: Client, user):
    raw_token = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw_token)

    body = client.get(
        f"/api/graph/{wf_uuid}/view",
        **_auth_header(raw_token),
    ).json()

    for ch in body["channels"]:
        assert isinstance(ch, dict)
        assert "uuid" in ch
        assert "graphUuid" in ch
        assert ch["graphUuid"] == str(wf_uuid)
        assert "threadUuid" in ch

    for node in body["nodes"]:
        assert isinstance(node, dict)
        assert "uuid" in node
        for key in ("sectionUuid", "channelUuid", "sectionRow", "workflowUuid", "threadUuid"):
            assert key in node
        assert "outcomeUuids" in node
        assert isinstance(node["outcomeUuids"], list)

    for edge in body["edges"]:
        assert "sourceNodeUuid" in edge
        assert "targetNodeUuid" in edge


@pytest.mark.django_db
def test_graph_view_requires_auth(client: Client, user):
    raw_token = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw_token)

    response = client.get(f"/api/graph/{wf_uuid}/view")
    assert response.status_code == 401


@pytest.mark.django_db
def test_graph_view_node_includes_section_row(client: Client, user):
    raw_token = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw_token)
    wf = Graph.objects.get(uuid=wf_uuid)
    channel = Channel.objects.create(graph=wf, title="Col A", position=0)
    section = Section.objects.create(graph=wf, title="Grid 1", position=0)
    Node.objects.create(section=section, channel=channel, section_row=4)

    body = client.get(
        f"/api/graph/{wf_uuid}/view",
        **_auth_header(raw_token),
    ).json()
    assert len(body["nodes"]) == 1
    row = body["nodes"][0]
    assert row["sectionRow"] == 4
    assert row["sectionUuid"] == str(section.uuid)
    assert row["channelUuid"] == str(channel.uuid)


@pytest.mark.django_db
def test_graph_view_allows_non_owner_with_placeholder_permissions(
    client: Client, user, other_user
):
    raw_owner = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw_owner)

    raw_other = _issue_token_for(other_user)
    response = client.get(
        f"/api/graph/{wf_uuid}/view",
        **_auth_header(raw_other),
    )
    assert response.status_code == 200
