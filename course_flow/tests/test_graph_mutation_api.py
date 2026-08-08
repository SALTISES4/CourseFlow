from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.models import (
    Authtoken,
    Channel,
    Edge,
    Graph,
    Node,
    Outcome,
    Section,
    Tag,
    Thread,
)
from course_flow.tests.node_helpers import create_grid_node


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
    Authtoken.objects.create(
        user=user,
        token_hash=hash_token(raw_token),
        expires_at=now + expires_delta,
        last_used_at=now,
    )
    return raw_token


def _create_graph(
    client: Client, raw_token: str, *, workflow_type: str = "course"
) -> str:
    response = client.post(
        "/api/workflow",
        data={
            "projectId": None,
            "title": "Root",
            "workflowType": workflow_type,
            "description": "",
        },
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200, response.content
    return response.json()["graphUuid"]


def _section_and_channel(wf_uuid: str):
    g = Graph.objects.select_related("workflow").get(uuid=wf_uuid)
    section = Section.objects.create(graph=g, title="S", position=0)
    channel = Channel.objects.create(graph=g, title="C", position=0)
    return section, channel, g.workflow


def _assert_envelope_shape(body: dict) -> None:
    assert set(body.keys()) == {"graphId", "revisionId", "changes", "meta"}
    ch = body["changes"]
    assert set(ch.keys()) == {
        "nodes",
        "edges",
        "channels",
        "sections",
        "tags",
        "outcomes",
    }
    for entity in ("nodes", "edges", "channels", "sections", "tags", "outcomes"):
        b = ch[entity]
        assert set(b.keys()) == {"created", "updated", "deleted"}
    assert set(body["meta"].keys()) == {"triggeredBy", "triggerEntityId"}


@pytest.mark.django_db
def test_delete_node_returns_delta_with_cascaded_edges_and_bumps_revision(
    client: Client,
    user,
):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    n1 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )
    n2 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=1
    )
    edge = Edge.objects.create(
        source_node=n1,
        target_node=n2,
        source_port="1",
        target_port="1",
    )

    r = client.delete(
        f"/api/node/{n1.uuid}",
        **_auth_header(raw),
    )
    assert r.status_code == 200
    body = r.json()
    _assert_envelope_shape(body)
    assert body["graphId"] == str(wf_uuid)
    assert body["revisionId"] == 1
    assert body["meta"]["triggeredBy"] == "delete_node"
    assert body["meta"]["triggerEntityId"] == str(n1.uuid)
    assert body["changes"]["nodes"]["deleted"] == [str(n1.uuid)]
    assert body["changes"]["edges"]["deleted"] == [edge.id]
    assert body["changes"]["nodes"]["created"] == []
    assert body["changes"]["tags"]["deleted"] == []

    wf = Graph.objects.get(uuid=wf_uuid)
    assert wf.revision_id == 1
    wf = Graph.objects.select_related("workflow").get(uuid=wf_uuid)
    graph = client.get(
        f"/api/graph/{wf.workflow.uuid}/view",
        **_auth_header(raw),
    ).json()
    assert graph["graph"]["revisionId"] == 1


@pytest.mark.django_db
def test_create_and_delete_edge_envelopes(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    n1 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )
    n2 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=1
    )

    r1 = client.post(
        f"/api/graph/{wf_uuid}/edges",
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
def test_create_edge_requires_ports(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    n1 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )
    n2 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=1
    )

    r = client.post(
        f"/api/graph/{wf_uuid}/edges",
        data={
            "sourceNodeUuid": str(n1.uuid),
            "targetNodeUuid": str(n2.uuid),
            "lineType": "solid",
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 422


@pytest.mark.django_db
def test_update_edge_metadata_envelope(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    n1 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )
    n2 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=1
    )

    r1 = client.post(
        f"/api/graph/{wf_uuid}/edges",
        data={
            "sourceNodeUuid": str(n1.uuid),
            "targetNodeUuid": str(n2.uuid),
            "sourcePort": "1",
            "targetPort": "3",
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r1.status_code == 200
    eid = r1.json()["changes"]["edges"]["created"][0]["id"]

    r2 = client.patch(
        f"/api/edge/{eid}",
        data={
            "title": "Link label",
            "textPosition": 25,
            "lineType": "dashed",
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r2.status_code == 200
    body = r2.json()
    _assert_envelope_shape(body)
    assert body["meta"]["triggeredBy"] == "update_edge"
    updated = body["changes"]["edges"]["updated"][0]
    assert updated["id"] == eid
    assert updated["title"] == "Link label"
    assert updated["textPosition"] == 25
    assert updated["lineType"] == "dashed"

    edge = Edge.objects.get(pk=eid)
    assert edge.title == "Link label"
    assert edge.text_position == 25
    assert edge.line_type == "dashed"


@pytest.mark.django_db
def test_create_node_and_update_node_envelopes(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, _w = _section_and_channel(wf_uuid)

    r1 = client.post(
        f"/api/graph/{wf_uuid}/nodes",
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
def test_insert_node_below_row_mode_shifts_sibling(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    n0 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )
    n1 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=1
    )

    r = client.post(
        f"/api/graph/{wf_uuid}/nodes/insert-below",
        data={
            "nodeUuid": str(n0.uuid),
            "mode": "row",
            "duplicate": False,
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200, r.content
    body = r.json()
    _assert_envelope_shape(body)
    assert body["meta"]["triggeredBy"] == "insert_node_below"
    created = body["changes"]["nodes"]["created"][0]
    assert created["sectionRow"] == 1
    updated = {u["uuid"]: u["sectionRow"] for u in body["changes"]["nodes"]["updated"]}
    assert updated[str(n1.uuid)] == 2


@pytest.mark.django_db
def test_move_graph_node_returns_multi_node_envelope(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    sec2 = Section.objects.create(graph=section.graph, title="S2", position=1)
    ch2 = Channel.objects.create(graph=section.graph, title="C2", position=1)
    n0 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )
    n1 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=1
    )

    r = client.post(
        f"/api/node/{n0.uuid}/move",
        data={
            "toSectionUuid": str(sec2.uuid),
            "toChannelUuid": str(ch2.uuid),
            "rowHint": 0,
            "mode": "row",
            "edge": "bottom",
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200, r.content
    body = r.json()
    assert body["meta"]["triggeredBy"] == "move_node_grid"
    moved = next(
        u for u in body["changes"]["nodes"]["updated"] if u["uuid"] == str(n0.uuid)
    )
    assert moved["sectionUuid"] == str(sec2.uuid)
    assert moved["channelUuid"] == str(ch2.uuid)


@pytest.mark.django_db
def test_link_and_unlink_node_outcome(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    g = Graph.objects.get(uuid=wf_uuid)
    node = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )
    outcome = Outcome.objects.create(graph=g, thread=Thread.objects.create())

    link = client.post(
        f"/api/node/{node.uuid}/link-outcome",
        data={"outcomeUuid": str(outcome.uuid)},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert link.status_code == 200, link.content
    linked = link.json()["changes"]["nodes"]["updated"][0]
    assert str(outcome.uuid) in linked["outcomeUuids"]
    assert node.outcomes.filter(pk=outcome.pk).exists()

    unlink = client.post(
        f"/api/node/{node.uuid}/unlink-outcome",
        data={"outcomeUuid": str(outcome.uuid)},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert unlink.status_code == 200, unlink.content
    unlinked = unlink.json()["changes"]["nodes"]["updated"][0]
    assert str(outcome.uuid) not in unlinked["outcomeUuids"]
    assert not node.outcomes.filter(pk=outcome.pk).exists()


@pytest.mark.django_db
def test_patch_node_meta_updates_fields_and_returns_envelope(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    node = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )

    r = client.patch(
        f"/api/node/{node.uuid}/meta",
        data={
            "title": "Lab 1",
            "description": "Intro activity",
            "contextClassification": 2,
            "taskClassification": 3,
            "timeRequired": 1.5,
            "timeUnits": 2,
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200, r.content
    body = r.json()
    assert body["meta"]["triggeredBy"] == "update_node_meta"
    updated = body["changes"]["nodes"]["updated"][0]
    assert updated["title"] == "Lab 1"
    assert updated["contextClassification"] == 2
    assert updated["timeUnits"] == 2

    node.refresh_from_db()
    assert node.title == "Lab 1"
    assert node.activitymeta.context_classification == 2


@pytest.mark.django_db
def test_patch_program_course_node_meta_persists_local_fields(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw, workflow_type="program")
    section, channel, workflow = _section_and_channel(wf_uuid)
    node = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )

    response = client.patch(
        f"/api/node/{node.uuid}/meta",
        data={
            "timeRequired": 3.5,
            "credits": 4,
            "ponderationTheory": 1.5,
            "ponderationPractice": 2,
            "ponderationIndividual": 2.5,
            "specificEducation": True,
        },
        content_type="application/json",
        **_auth_header(raw),
    )

    assert response.status_code == 200, response.content
    updated = response.json()["changes"]["nodes"]["updated"][0]
    assert updated["timeRequired"] == 3.5
    assert updated["credits"] == 4
    assert updated["ponderationTheory"] == 1.5
    assert updated["ponderationPractice"] == 2
    assert updated["ponderationIndividual"] == 2.5
    assert updated["specificEducation"] is True

    node.refresh_from_db()
    assert node.coursemeta.time_required == Decimal("3.50")
    assert node.coursemeta.credits == 4
    assert node.coursemeta.specific_education is True


@pytest.mark.django_db
def test_link_node_workflow_and_unlink(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    other_wf_uuid = _create_graph(client, raw, workflow_type="activity")
    section, channel, workflow = _section_and_channel(wf_uuid)
    other_graph = Graph.objects.select_related("workflow").get(uuid=other_wf_uuid)
    other_workflow = other_graph.workflow
    node = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )

    r = client.post(
        f"/api/node/{node.uuid}/link-workflow",
        data={"workflowUuid": str(other_workflow.uuid)},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200, r.content
    body = r.json()
    _assert_envelope_shape(body)
    assert body["meta"]["triggeredBy"] == "link_node_workflow"
    updated = body["changes"]["nodes"]["updated"][0]
    assert updated["linkedWorkflowUuid"] == str(other_workflow.uuid)
    node.refresh_from_db()
    assert node.workflow_id == workflow.id
    assert node.linked_workflow_id == other_workflow.id

    r2 = client.post(
        f"/api/node/{node.uuid}/link-workflow",
        data={"workflowUuid": None},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r2.status_code == 200, r2.content
    body2 = r2.json()
    assert body2["meta"]["triggeredBy"] == "unlink_node_workflow"
    node.refresh_from_db()
    assert node.workflow_id == workflow.id
    assert node.linked_workflow_id is None


@pytest.mark.django_db
def test_place_graph_node_at_row_hint(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)

    r = client.post(
        f"/api/graph/{wf_uuid}/nodes/place",
        data={
            "sectionUuid": str(section.uuid),
            "channelUuid": str(channel.uuid),
            "rowHint": 0,
            "mode": "row",
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200, r.content
    body = r.json()
    assert body["meta"]["triggeredBy"] == "place_node"
    assert body["changes"]["nodes"]["created"][0]["sectionRow"] == 0


@pytest.mark.django_db
def test_delete_channel_returns_delta_with_cascaded_nodes_and_edges(
    client: Client,
    user,
):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    n1 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )
    n2 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=1
    )
    edge = Edge.objects.create(
        source_node=n1,
        target_node=n2,
        source_port="1",
        target_port="1",
    )

    r = client.delete(
        f"/api/channel/{channel.uuid}",
        **_auth_header(raw),
    )
    assert r.status_code == 200
    body = r.json()
    _assert_envelope_shape(body)
    assert body["graphId"] == str(wf_uuid)
    assert body["revisionId"] == 1
    assert body["meta"]["triggeredBy"] == "delete_channel"
    assert body["meta"]["triggerEntityId"] == str(channel.uuid)
    assert body["changes"]["channels"]["deleted"] == [str(channel.uuid)]
    assert set(body["changes"]["nodes"]["deleted"]) == {str(n1.uuid), str(n2.uuid)}
    assert body["changes"]["edges"]["deleted"] == [edge.id]
    assert body["changes"]["channels"]["created"] == []
    assert body["changes"]["tags"]["deleted"] == []

    wf = Graph.objects.get(uuid=wf_uuid)
    assert wf.revision_id == 1
    assert not Channel.objects.filter(uuid=channel.uuid).exists()
    assert not Node.objects.filter(uuid__in=[n1.uuid, n2.uuid]).exists()


@pytest.mark.django_db
def test_delete_section_returns_delta_with_cascaded_nodes_and_edges(
    client: Client,
    user,
):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    n1 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )
    n2 = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=1
    )
    edge = Edge.objects.create(
        source_node=n1,
        target_node=n2,
        source_port="1",
        target_port="1",
    )

    r = client.delete(
        f"/api/section/{section.uuid}",
        **_auth_header(raw),
    )
    assert r.status_code == 200
    body = r.json()
    _assert_envelope_shape(body)
    assert body["graphId"] == str(wf_uuid)
    assert body["revisionId"] == 1
    assert body["meta"]["triggeredBy"] == "delete_section"
    assert body["meta"]["triggerEntityId"] == str(section.uuid)
    assert body["changes"]["sections"]["deleted"] == [str(section.uuid)]
    assert set(body["changes"]["nodes"]["deleted"]) == {str(n1.uuid), str(n2.uuid)}
    assert body["changes"]["edges"]["deleted"] == [edge.id]
    assert body["changes"]["sections"]["created"] == []
    assert body["changes"]["tags"]["deleted"] == []

    wf = Graph.objects.get(uuid=wf_uuid)
    assert wf.revision_id == 1
    assert not Section.objects.filter(uuid=section.uuid).exists()
    assert not Node.objects.filter(uuid__in=[n1.uuid, n2.uuid]).exists()


@pytest.mark.django_db
def test_reorder_channels_returns_updated_positions(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    ch2 = Channel.objects.create(graph=section.graph, title="C2", position=1)

    r = client.put(
        f"/api/graph/{wf_uuid}/channels/order",
        data={"channelUuids": [str(ch2.uuid), str(channel.uuid)]},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200
    body = r.json()
    _assert_envelope_shape(body)
    assert body["meta"]["triggeredBy"] == "reorder_channels"
    updated = {item["uuid"]: item["position"] for item in body["changes"]["channels"]["updated"]}
    assert updated[str(ch2.uuid)] == 0
    assert updated[str(channel.uuid)] == 1


@pytest.mark.django_db
def test_reorder_sections_returns_updated_positions(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    sec2 = Section.objects.create(graph=section.graph, title="S2", position=1)

    r = client.put(
        f"/api/graph/{wf_uuid}/sections/order",
        data={"sectionUuids": [str(sec2.uuid), str(section.uuid)]},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200
    body = r.json()
    _assert_envelope_shape(body)
    assert body["meta"]["triggeredBy"] == "reorder_sections"
    updated = {item["uuid"]: item["position"] for item in body["changes"]["sections"]["updated"]}
    assert updated[str(sec2.uuid)] == 0
    assert updated[str(section.uuid)] == 1


@pytest.mark.django_db
def test_insert_channel_append_returns_created_channel(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)

    r = client.post(
        f"/api/graph/{wf_uuid}/channels/insert-below",
        data={"duplicate": False},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200
    body = r.json()
    _assert_envelope_shape(body)
    assert body["meta"]["triggeredBy"] == "insert_channel_below"
    assert len(body["changes"]["channels"]["created"]) == 1
    created = body["changes"]["channels"]["created"][0]
    assert created["title"] == ""
    assert created["position"] == 1
    assert body["changes"]["channels"]["updated"] == []


@pytest.mark.django_db
def test_insert_channel_below_shifts_positions(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    ch2 = Channel.objects.create(graph=section.graph, title="C2", position=1)

    r = client.post(
        f"/api/graph/{wf_uuid}/channels/insert-below",
        data={"channelUuid": str(channel.uuid), "duplicate": False},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200
    body = r.json()
    created = body["changes"]["channels"]["created"][0]
    assert created["position"] == 1
    updated = {item["uuid"]: item["position"] for item in body["changes"]["channels"]["updated"]}
    assert updated[str(ch2.uuid)] == 2


@pytest.mark.django_db
def test_update_channel_colour(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    _section, channel, _workflow = _section_and_channel(wf_uuid)

    r = client.patch(
        f"/api/channel/{channel.uuid}",
        data={"colour": "#ff00aa"},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["item"]["colour"] == "#ff00aa"

    channel.refresh_from_db()
    assert channel.colour == "#ff00aa"


@pytest.mark.django_db
def test_insert_section_below_returns_created_section(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    sec2 = Section.objects.create(graph=section.graph, title="S2", position=1)

    r = client.post(
        f"/api/graph/{wf_uuid}/sections/insert-below",
        data={"sectionUuid": str(section.uuid), "duplicate": False},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200
    body = r.json()
    _assert_envelope_shape(body)
    assert body["meta"]["triggeredBy"] == "insert_section_below"
    assert len(body["changes"]["sections"]["created"]) == 1
    created = body["changes"]["sections"]["created"][0]
    assert created["title"] == ""
    assert created["position"] == 1
    updated = {item["uuid"]: item["position"] for item in body["changes"]["sections"]["updated"]}
    assert updated[str(sec2.uuid)] == 2


@pytest.mark.django_db
def test_duplicate_section_below_copies_title(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    section.title = "Week 1"
    section.save(update_fields=["title"])

    r = client.post(
        f"/api/graph/{wf_uuid}/sections/insert-below",
        data={"sectionUuid": str(section.uuid), "duplicate": True},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["meta"]["triggeredBy"] == "duplicate_section_below"
    created = body["changes"]["sections"]["created"][0]
    assert created["title"] == "Week 1 (copy)"
    assert created["position"] == 1


@pytest.mark.django_db
def test_duplicate_section_below_copies_internal_graph_content(client: Client, user):
    raw = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw)
    linked_graph_uuid = _create_graph(client, raw)
    section, channel, workflow = _section_and_channel(wf_uuid)
    graph = section.graph
    other_section = Section.objects.create(graph=graph, title="Other", position=1)
    linked_workflow = Graph.objects.select_related("workflow").get(
        uuid=linked_graph_uuid
    ).workflow

    source_a = create_grid_node(
        section=section,
        channel=channel,
        workflow=workflow,
        linked_workflow=linked_workflow,
        section_row=0,
        title="Source A",
        description="Source description",
    )
    source_b = create_grid_node(
        section=section,
        channel=channel,
        workflow=workflow,
        section_row=1,
        title="Source B",
    )
    outside = create_grid_node(
        section=other_section,
        channel=channel,
        workflow=workflow,
        section_row=0,
        title="Outside",
    )

    source_a.activitymeta.context_classification = 3
    source_a.activitymeta.task_classification = 4
    source_a.activitymeta.time_required = Decimal("2.50")
    source_a.activitymeta.time_units = 2
    source_a.activitymeta.represents_workflow = True
    source_a.activitymeta.context = "Seminar"
    source_a.activitymeta.classification = "Formative"
    source_a.activitymeta.save()

    tag = Tag.objects.create(label="Pedagogy")
    outcome = Outcome.objects.create(graph=graph, order=0, title="Outcome")
    source_a.tags.add(tag)
    source_a.outcomes.add(outcome)

    internal_edge = Edge.objects.create(
        source_node=source_a,
        target_node=source_b,
        title="Internal",
        text_position=25,
        line_type="dashed",
        source_port="out",
        target_port="in",
    )
    cross_edge = Edge.objects.create(
        source_node=source_a,
        target_node=outside,
        title="Cross",
        line_type="solid",
        source_port="out",
        target_port="in",
    )

    response = client.post(
        f"/api/graph/{wf_uuid}/sections/insert-below",
        data={"sectionUuid": str(section.uuid), "duplicate": True},
        content_type="application/json",
        **_auth_header(raw),
    )

    assert response.status_code == 200, response.content
    body = response.json()
    created_section_payload = body["changes"]["sections"]["created"][0]
    duplicate = Section.objects.get(uuid=created_section_payload["uuid"])
    assert duplicate.thread_id != section.thread_id

    created_nodes = body["changes"]["nodes"]["created"]
    assert len(created_nodes) == 2
    copied_a = Node.objects.select_related(
        "activitymeta", "linked_workflow", "thread"
    ).get(section=duplicate, title="Source A")
    copied_b = Node.objects.get(section=duplicate, title="Source B")

    assert copied_a.uuid != source_a.uuid
    assert copied_a.channel_id == source_a.channel_id
    assert copied_a.workflow_id == source_a.workflow_id
    assert copied_a.section_row == source_a.section_row
    assert copied_a.description == source_a.description
    assert copied_a.linked_workflow_id == source_a.linked_workflow_id
    assert copied_a.thread_id != source_a.thread_id
    assert copied_a.activitymeta.context_classification == 3
    assert copied_a.activitymeta.task_classification == 4
    assert copied_a.activitymeta.time_required == source_a.activitymeta.time_required
    assert copied_a.activitymeta.time_units == 2
    assert copied_a.activitymeta.represents_workflow is True
    assert copied_a.activitymeta.context == "Seminar"
    assert copied_a.activitymeta.classification == "Formative"
    assert list(copied_a.tags.values_list("id", flat=True)) == [tag.id]
    assert list(copied_a.outcomes.values_list("id", flat=True)) == [outcome.id]

    created_edges = body["changes"]["edges"]["created"]
    assert len(created_edges) == 1
    copied_edge = Edge.objects.get(pk=created_edges[0]["id"])
    assert copied_edge.source_node_id == copied_a.id
    assert copied_edge.target_node_id == copied_b.id
    assert copied_edge.title == internal_edge.title
    assert copied_edge.text_position == internal_edge.text_position
    assert copied_edge.line_type == internal_edge.line_type
    assert copied_edge.source_port == internal_edge.source_port
    assert copied_edge.target_port == internal_edge.target_port

    assert Edge.objects.filter(pk=cross_edge.pk).exists()
    assert not Edge.objects.filter(
        source_node__section=duplicate,
        target_node=outside,
    ).exists()


@pytest.mark.django_db
def test_graph_mutation_forbidden_for_non_owner(client: Client, user, other_user):
    raw_owner = _issue_token_for(user)
    wf_uuid = _create_graph(client, raw_owner)
    section, channel, workflow = _section_and_channel(wf_uuid)
    n = create_grid_node(
        section=section, channel=channel, workflow=workflow, section_row=0
    )

    raw_other = _issue_token_for(other_user)
    r = client.delete(
        f"/api/node/{n.uuid}",
        **_auth_header(raw_other),
    )
    assert r.status_code == 403
