from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow_v2.core.auth import generate_raw_token, hash_token
from course_flow_v2.core.models import AuthToken, Project


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def user():
    user_model = get_user_model()
    return user_model.objects.create_user(
        email="project-api@example.com", password="password123"
    )


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


def _create_project(client: Client, raw_token: str) -> str:
    response = client.post(
        "/api/project",
        data={
            "title": "Initial Title",
            "description": "Initial description",
            "is_published": False,
            "is_template": False,
        },
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200, response.content
    return response.json()["uuid"]


@pytest.mark.django_db
def test_patch_project_success_updates_fields(client: Client, user):
    raw = _issue_token_for(user)
    project_uuid = _create_project(client, raw)

    response = client.patch(
        f"/api/project/{project_uuid}",
        data={
            "title": "Updated Title",
            "is_template": True,
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert response.status_code == 200, response.content
    body = response.json()
    assert body["item"]["uuid"] == project_uuid
    assert body["item"]["title"] == "Updated Title"
    assert body["item"]["isTemplate"] is True

    persisted = Project.objects.get(uuid=project_uuid)
    assert persisted.title == "Updated Title"
    assert persisted.is_template is True
    assert persisted.description == "Initial description"


@pytest.mark.django_db
def test_patch_project_partial_leaves_other_fields_unchanged(client: Client, user):
    raw = _issue_token_for(user)
    project_uuid = _create_project(client, raw)

    response = client.patch(
        f"/api/project/{project_uuid}",
        data={"title": "Only Title Changed"},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert response.status_code == 200, response.content
    assert response.json()["item"]["title"] == "Only Title Changed"

    persisted = Project.objects.get(uuid=project_uuid)
    assert persisted.description == "Initial description"
    assert persisted.is_published is False
    assert persisted.is_template is False


@pytest.mark.django_db
def test_json_uses_camel_case_get_and_post_accepts_camel_case_body(client: Client, user):
    """GET/PATCH responses serialize snake_case schema fields as camelCase JSON."""
    raw = _issue_token_for(user)
    created = client.post(
        "/api/project",
        data={
            "title": "Camel Post",
            "description": "d",
            "isPublished": True,
            "isTemplate": False,
        },
        content_type="application/json",
        **_auth_header(raw),
    )
    assert created.status_code == 200, created.content
    pid = created.json()["uuid"]
    assert created.json()["isPublished"] is True

    got = client.get(f"/api/project/{pid}", **_auth_header(raw))
    assert got.status_code == 200
    item = got.json()["item"]
    assert "dateCreated" in item and "modifiedOn" in item
    assert item["isPublished"] is True


@pytest.mark.django_db
def test_patch_project_not_found(client: Client, user):
    raw = _issue_token_for(user)
    missing = uuid4()
    response = client.patch(
        f"/api/project/{missing}",
        data={"title": "Nope"},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_delete_project_success_and_get_returns_404(client: Client, user):
    raw = _issue_token_for(user)
    project_uuid = _create_project(client, raw)

    deleted = client.delete(f"/api/project/{project_uuid}", **_auth_header(raw))
    assert deleted.status_code == 200
    assert deleted.json() == {"success": True}

    missing = client.get(f"/api/project/{project_uuid}", **_auth_header(raw))
    assert missing.status_code == 404


@pytest.mark.django_db
def test_delete_project_not_found(client: Client, user):
    raw = _issue_token_for(user)
    response = client.delete(f"/api/project/{uuid4()}", **_auth_header(raw))
    assert response.status_code == 404
