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
    Edge,
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
    return user_model.objects.create_user(email="mut-owner@example.com", password="password123")


@pytest.fixture
def other_user():
    user_model = get_user_model()
    return user_model.objects.create_user(email="mut-other@example.com", password="password123")


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
            "projectId": None,
            "workflowTitle": "Mut Test",
            "unitTitle": "Root",
            "unitType": "course",
            "unitDescription": "",
        },
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200, response.content
    return response.json()["uuid"]


def _section_and_channel(wf_uuid: str):
    wf = Workflow.objects.get(uuid=wf_uuid)
    section = Section.objects.create(workflow=wf, title="S", position=0)
    channel = Channel.objects.create(workflow=wf, title="C", position=0)
    return section, channel


def _assert_envelope_shape(body: dict) -> None:
    assert set(body.keys()) == {"workflowId", "revisionId", "changes", "meta"}
    ch = body["changes"]
    assert set(ch.keys()) == {"nodes", "edges", "tags"}
    for entity in ("nodes", "edges", "tags"):
        b = ch[entity]
        assert set(b.keys()) == {"created", "updated", "deleted"}
    assert set(body["meta"].keys()) == {"triggeredBy", "triggerEntityId"}


@pytest.mark.django_db
def test_delete_node_returns_delta_with_cascaded_edges_and_bumps_revision(
    client: Client,
    user,
):
    raw = _issue_token_for(user)
    wf_uuid = _create_workflow(client, raw)
    section, channel = _section_and_channel(wf_uuid)
    n1 = Node.objects.create(section=section, channel=channel, section_row=0)
    n2 = Node.objects.create(section=section, channel=channel, section_row=1)
    edge = Edge.objects.create(source_node=n1, target_node=n2)

    r = client.delete(
        f"/api/node/{n1.uuid}",
        **_auth_header(raw),
    )
    assert r.status_code == 200
    body = r.json()
    _assert_envelope_shape(body)
    assert body["workflowId"] == str(wf_uuid)
    assert body["revisionId"] == 1
    assert body["meta"]["triggeredBy"] == "delete_node"
    assert body["meta"]["triggerEntityId"] == str(n1.uuid)
    assert body["changes"]["nodes"]["deleted"] == [str(n1.uuid)]
    assert body["changes"]["edges"]["deleted"] == [edge.id]
    assert body["changes"]["nodes"]["created"] == []
    assert body["changes"]["tags"]["deleted"] == []

    wf = Workflow.objects.get(uuid=wf_uuid)
    assert wf.revision_id == 1
    graph = client.get(
        f"/api/workflow/{wf_uuid}/graph",
        **_auth_header(raw),
    ).json()
    assert graph["workflow"]["revisionId"] == 1


@pytest.mark.django_db
def test_create_and_delete_edge_envelopes(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_workflow(client, raw)
    section, channel = _section_and_channel(wf_uuid)
    n1 = Node.objects.create(section=section, channel=channel, section_row=0)
    n2 = Node.objects.create(section=section, channel=channel, section_row=1)

    r1 = client.post(
        f"/api/workflow/{wf_uuid}/edges",
        data={
            "sourceNodeUuid": str(n1.uuid),
            "targetNodeUuid": str(n2.uuid),
            "lineType": "solid",
            "sourcePort": "out",
            "targetPort": "in",
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r1.status_code == 200
    b1 = r1.json()
    _assert_envelope_shape(b1)
    assert b1["revisionId"] == 1
    assert b1["meta"]["triggeredBy"] == "create_edge"
    eid = b1["changes"]["edges"]["created"][0]["id"]
    assert b1["changes"]["edges"]["created"][0]["sourceNodeUuid"] == str(n1.uuid)
    assert b1["meta"]["triggerEntityId"] == str(eid)

    r2 = client.delete(
        f"/api/edge/{eid}",
        **_auth_header(raw),
    )
    assert r2.status_code == 200
    b2 = r2.json()
    assert b2["revisionId"] == 2
    assert b2["changes"]["edges"]["deleted"] == [eid]
    assert b2["meta"]["triggeredBy"] == "delete_edge"


@pytest.mark.django_db
def test_create_node_and_update_node_envelopes(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_workflow(client, raw)
    section, channel = _section_and_channel(wf_uuid)

    r1 = client.post(
        f"/api/workflow/{wf_uuid}/nodes",
        data={
            "sectionUuid": str(section.uuid),
            "channelUuid": str(channel.uuid),
            "sectionRow": 3,
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r1.status_code == 200
    b1 = r1.json()
    _assert_envelope_shape(b1)
    assert b1["revisionId"] == 1
    assert b1["meta"]["triggeredBy"] == "create_node"
    node_uuid = b1["changes"]["nodes"]["created"][0]["uuid"]
    assert b1["changes"]["nodes"]["created"][0]["sectionRow"] == 3

    r2 = client.patch(
        f"/api/node/{node_uuid}",
        data={"sectionRow": 7},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r2.status_code == 200
    b2 = r2.json()
    assert b2["revisionId"] == 2
    assert b2["changes"]["nodes"]["updated"][0]["sectionRow"] == 7
    assert b2["meta"]["triggeredBy"] == "update_node"


@pytest.mark.django_db
def test_graph_mutation_forbidden_for_non_owner(client: Client, user, other_user):
    raw_owner = _issue_token_for(user)
    wf_uuid = _create_workflow(client, raw_owner)
    section, channel = _section_and_channel(wf_uuid)
    n = Node.objects.create(section=section, channel=channel, section_row=0)

    raw_other = _issue_token_for(other_user)
    r = client.delete(
        f"/api/node/{n.uuid}",
        **_auth_header(raw_other),
    )
    assert r.status_code == 403
