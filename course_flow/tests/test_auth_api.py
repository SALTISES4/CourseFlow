from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.models import Authtoken, Project


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def user():
    user_model = get_user_model()
    return user_model.objects.create_user(email="owner@example.com", password="password123")


@pytest.fixture
def other_user():
    user_model = get_user_model()
    return user_model.objects.create_user(email="other@example.com", password="password123")


def _auth_header(raw_token: str) -> dict[str, str]:
    return {"HTTP_AUTHORIZATION": f"Bearer {raw_token}"}


def _issue_token_for(user, *, expires_delta: timedelta = timedelta(hours=1), revoked: bool = False):
    now = timezone.now()
    raw_token = generate_raw_token()
    token = Authtoken.objects.create(
        user=user,
        token_hash=hash_token(raw_token),
        expires_at=now + expires_delta,
        last_used_at=now,
        revoked_at=now if revoked else None,
    )
    return raw_token, token


@pytest.mark.django_db
def test_login_returns_raw_token_and_stores_hash_only(client: Client, user):
    response = client.post(
        "/api/auth/login",
        data={"email": user.email, "password": "password123"},
        content_type="application/json",
    )
    assert response.status_code == 200
    payload = response.json()
    raw_token = payload["accessToken"]
    assert raw_token

    token_row = Authtoken.objects.get(user=user)
    assert token_row.token_hash == hash_token(raw_token)
    assert token_row.token_hash != raw_token


@pytest.mark.django_db
def test_register_creates_user_and_returns_usable_token(client: Client):
    response = client.post(
        "/api/auth/register",
        data={
            "email": "  NewUser@example.com  ",
            "password": "password123",
            "firstName": "  New  ",
            "lastName": "  User  ",
        },
        content_type="application/json",
    )
    assert response.status_code == 200
    body = response.json()
    assert body["accessToken"]
    assert body["tokenType"] == "Bearer"
    assert body["user"]["email"] == "NewUser@example.com"
    assert body["user"]["firstName"] == "New"
    assert body["user"]["lastName"] == "User"

    user_model = get_user_model()
    db_user = user_model.objects.get(email="NewUser@example.com")
    assert db_user.password != "password123"
    assert db_user.check_password("password123")

    me_response = client.get("/api/auth/me", **_auth_header(body["accessToken"]))
    assert me_response.status_code == 200
    assert me_response.json()["item"]["uuid"] == str(db_user.uuid)


@pytest.mark.django_db
def test_register_rejects_duplicate_email(client: Client, user):
    response = client.post(
        "/api/auth/register",
        data={
            "email": user.email,
            "password": "password123",
            "firstName": "Alex",
            "lastName": "Dray",
        },
        content_type="application/json",
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Email is already registered"


@pytest.mark.django_db
def test_register_requires_all_fields(client: Client):
    response = client.post(
        "/api/auth/register",
        data={
            "email": "new@example.com",
            "password": "",
            "firstName": "Alex",
            "lastName": "Dray",
        },
        content_type="application/json",
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "All fields are required"


@pytest.mark.django_db
def test_authenticated_me_succeeds_with_valid_bearer(client: Client, user):
    raw_token, _ = _issue_token_for(user)

    response = client.get("/api/auth/me", **_auth_header(raw_token))
    assert response.status_code == 200
    assert response.json()["item"]["uuid"] == str(user.uuid)


@pytest.mark.django_db
def test_invalid_token_is_rejected(client: Client):
    response = client.get("/api/auth/me", **_auth_header("not-a-real-token"))
    assert response.status_code == 401


@pytest.mark.django_db
def test_expired_token_is_rejected(client: Client, user):
    raw_token, _ = _issue_token_for(user, expires_delta=timedelta(seconds=-1))

    response = client.get("/api/auth/me", **_auth_header(raw_token))
    assert response.status_code == 401
    assert response.json()["detail"] == "Token expired"


@pytest.mark.django_db
def test_revoked_token_is_rejected(client: Client, user):
    raw_token, _ = _issue_token_for(user, revoked=True)

    response = client.get("/api/auth/me", **_auth_header(raw_token))
    assert response.status_code == 401
    assert response.json()["detail"] == "Token revoked"


@pytest.mark.django_db
def test_logout_revokes_current_token(client: Client, user):
    raw_token, token = _issue_token_for(user)

    response = client.post("/api/auth/logout", content_type="application/json", **_auth_header(raw_token))
    assert response.status_code == 200
    token.refresh_from_db()
    assert token.revoked_at is not None


@pytest.mark.django_db
def test_create_project_uses_authenticated_user_for_owner(
    client: Client,
    user,
    other_user,
):
    raw_token, _ = _issue_token_for(user)
    payload = {
        "title": "Secured Project",
        "description": "created by auth context",
        "isPublished": False,
        "isTemplate": False,
    }

    response = client.post(
        "/api/project",
        data=payload,
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["ownerId"] == user.id
    project = Project.objects.get(uuid=body["uuid"])
    assert project.owner_id == user.id
    assert project.owner_id != other_user.id
