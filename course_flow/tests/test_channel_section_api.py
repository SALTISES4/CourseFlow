from __future__ import annotations

from datetime import timedelta
from importlib import import_module

import pytest
from django.apps import apps
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.models import Authtoken, Channel, Graph
from course_flow.core.system_labels import DEFAULT_CHANNELS_BY_WORKFLOW_TYPE


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def user():
    user_model = get_user_model()
    return user_model.objects.create_user(
        email="channel-owner@example.com", password="password123"
    )


@pytest.fixture
def other_user():
    user_model = get_user_model()
    return user_model.objects.create_user(
        email="channel-other@example.com", password="password123"
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


def _create_graph(client: Client, raw_token: str) -> str:
    response = client.post(
        "/api/workflow",
        data={
            "projectId": None,
            "title": "Root",
            "workflowType": "course",
            "description": "",
        },
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200, response.content
    return response.json()["graphUuid"]


@pytest.mark.django_db
def test_channel_crud_and_graph_collection(client: Client, user):
    raw = _issue_token_for(user)
    graph_uuid = _create_graph(client, raw)

    created = client.post(
        "/api/channel",
        data={"graphUuid": graph_uuid, "title": "Channel A", "position": 2},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert created.status_code == 200, created.content
    channel_uuid = created.json()["uuid"]

    detail = client.get(f"/api/channel/{channel_uuid}", **_auth_header(raw))
    assert detail.status_code == 200
    assert detail.json()["item"]["uuid"] == channel_uuid
    assert detail.json()["item"]["graphUuid"] == graph_uuid

    updated = client.patch(
        f"/api/channel/{channel_uuid}",
        data={"title": "Channel B", "position": 7},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert updated.status_code == 200
    assert updated.json()["item"]["title"] == "Channel B"
    assert updated.json()["item"]["position"] == 7

    listing = client.get(f"/api/graph/{graph_uuid}/channels", **_auth_header(raw))
    assert listing.status_code == 200
    items = listing.json()["items"]
    course_label_codes = {
        code for code, _colour in DEFAULT_CHANNELS_BY_WORKFLOW_TYPE["course"]
    }
    assert listing.json()["meta"]["total"] == len(course_label_codes) + 1
    assert {
        item["systemLabelCode"] for item in items if item["systemLabelCode"]
    } == set(course_label_codes)
    assert next(item for item in items if item["uuid"] == channel_uuid)["title"] == (
        "Channel B"
    )

    deleted = client.delete(f"/api/channel/{channel_uuid}", **_auth_header(raw))
    assert deleted.status_code == 200
    body = deleted.json()
    assert body["changes"]["channels"]["deleted"] == [channel_uuid]
    assert body["meta"]["triggeredBy"] == "delete_channel"

    missing = client.get(f"/api/channel/{channel_uuid}", **_auth_header(raw))
    assert missing.status_code == 404


@pytest.mark.django_db
def test_system_channel_backfill_requires_the_full_generated_signature(
    client: Client, user
):
    raw = _issue_token_for(user)
    graph_uuid = _create_graph(client, raw)
    graph = Graph.objects.get(uuid=graph_uuid)
    generated = Channel.objects.get(graph=graph, position=0)
    generated.title = "Preparation"
    generated.colour = "#F7B92A"
    generated.system_label_code = None
    generated.save(update_fields=["title", "colour", "system_label_code"])
    authored_near_match = Channel.objects.create(
        graph=graph,
        title="Preparation",
        colour="#F7B92A",
        position=9,
    )

    migration = import_module("course_flow.core.migrations.0022_system_graph_labels")
    migration.mark_known_system_channels(apps, None)

    generated.refresh_from_db()
    authored_near_match.refresh_from_db()
    assert generated.title == ""
    assert generated.system_label_code == "course_preparation"
    assert authored_near_match.title == "Preparation"
    assert authored_near_match.system_label_code is None


@pytest.mark.django_db
def test_section_reads_deny_non_contributor(client: Client, user, other_user):
    raw_owner = _issue_token_for(user)
    graph_uuid = _create_graph(client, raw_owner)

    created = client.post(
        f"/api/graph/{graph_uuid}/sections",
        data={"title": "Section A", "position": 0},
        content_type="application/json",
        **_auth_header(raw_owner),
    )
    assert created.status_code == 200, created.content
    section_uuid = created.json()["uuid"]

    raw_other = _issue_token_for(other_user)

    forbidden_detail = client.get(
        f"/api/section/{section_uuid}", **_auth_header(raw_other)
    )
    assert forbidden_detail.status_code == 403

    forbidden_list = client.get(
        f"/api/graph/{graph_uuid}/sections", **_auth_header(raw_other)
    )
    assert forbidden_list.status_code == 403

    owner_patch = client.patch(
        f"/api/section/{section_uuid}",
        data={"title": "Section B"},
        content_type="application/json",
        **_auth_header(raw_owner),
    )
    assert owner_patch.status_code == 200
    assert owner_patch.json()["item"]["title"] == "Section B"

    owner_delete = client.delete(
        f"/api/section/{section_uuid}", **_auth_header(raw_owner)
    )
    assert owner_delete.status_code == 200
    body = owner_delete.json()
    assert body["changes"]["sections"]["deleted"] == [section_uuid]
    assert body["meta"]["triggeredBy"] == "delete_section"
