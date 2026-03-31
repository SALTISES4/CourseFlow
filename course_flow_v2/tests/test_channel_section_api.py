from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow_v2.core.auth import generate_raw_token, hash_token
from course_flow_v2.core.models import AuthToken


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def user():
    user_model = get_user_model()
    return user_model.objects.create_user(email="channel-owner@example.com", password="password123")


@pytest.fixture
def other_user():
    user_model = get_user_model()
    return user_model.objects.create_user(email="channel-other@example.com", password="password123")


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
            "workflow_title": "Entity Test",
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
def test_channel_crud_and_workflow_collection(client: Client, user):
    raw = _issue_token_for(user)
    workflow_uuid = _create_workflow(client, raw)

    created = client.post(
        "/api/channel",
        data={"workflow_uuid": workflow_uuid, "title": "Channel A", "position": 2},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert created.status_code == 200, created.content
    channel_uuid = created.json()["uuid"]

    detail = client.get(f"/api/channel/{channel_uuid}", **_auth_header(raw))
    assert detail.status_code == 200
    assert detail.json()["item"]["uuid"] == channel_uuid
    assert detail.json()["item"]["workflow_uuid"] == workflow_uuid

    updated = client.patch(
        f"/api/channel/{channel_uuid}",
        data={"title": "Channel B", "position": 7},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert updated.status_code == 200
    assert updated.json()["item"]["title"] == "Channel B"
    assert updated.json()["item"]["position"] == 7

    listing = client.get(f"/api/workflow/{workflow_uuid}/channels", **_auth_header(raw))
    assert listing.status_code == 200
    assert listing.json()["meta"]["total"] == 1
    assert listing.json()["items"][0]["uuid"] == channel_uuid

    deleted = client.delete(f"/api/channel/{channel_uuid}", **_auth_header(raw))
    assert deleted.status_code == 200
    assert deleted.json()["success"] is True

    missing = client.get(f"/api/channel/{channel_uuid}", **_auth_header(raw))
    assert missing.status_code == 404


@pytest.mark.django_db
def test_section_crud_allows_cross_owner_with_placeholder_permissions(
    client: Client, user, other_user
):
    raw_owner = _issue_token_for(user)
    workflow_uuid = _create_workflow(client, raw_owner)

    created = client.post(
        f"/api/workflow/{workflow_uuid}/sections",
        data={"title": "Section A", "position": 0},
        content_type="application/json",
        **_auth_header(raw_owner),
    )
    assert created.status_code == 200, created.content
    section_uuid = created.json()["uuid"]

    raw_other = _issue_token_for(other_user)

    forbidden_detail = client.get(f"/api/section/{section_uuid}", **_auth_header(raw_other))
    assert forbidden_detail.status_code == 200

    forbidden_list = client.get(
        f"/api/workflow/{workflow_uuid}/sections", **_auth_header(raw_other)
    )
    assert forbidden_list.status_code == 200

    owner_patch = client.patch(
        f"/api/section/{section_uuid}",
        data={"title": "Section B"},
        content_type="application/json",
        **_auth_header(raw_owner),
    )
    assert owner_patch.status_code == 200
    assert owner_patch.json()["item"]["title"] == "Section B"

    owner_delete = client.delete(f"/api/section/{section_uuid}", **_auth_header(raw_owner))
    assert owner_delete.status_code == 200
