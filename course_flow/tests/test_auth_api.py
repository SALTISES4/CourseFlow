from __future__ import annotations

import threading
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.db import close_old_connections, transaction
from django.test import Client
from django.utils import timezone

from course_flow.application.services.auth_service import (
    AuthService,
    InvalidCredentialsError,
)
from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.models import Authtoken, Project, User


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
    assert token_row.credential_version == user.credential_version


@pytest.mark.django_db(transaction=True)
def test_login_checks_password_only_after_requesting_user_row_lock(user, monkeypatch):
    events: list[str] = []
    lock_requested = threading.Event()
    outcome: dict[str, object] = {}
    original_select_for_update = User.objects.select_for_update
    original_check_password = User.check_password

    def tracked_select_for_update(*args, **kwargs):
        events.append("lock_requested")
        lock_requested.set()
        return original_select_for_update(*args, **kwargs)

    def tracked_check_password(self, raw_password):
        events.append("password_checked")
        return original_check_password(self, raw_password)

    def attempt_old_password_login():
        close_old_connections()
        try:
            outcome["result"] = AuthService().login(
                email=user.email,
                password="password123",
            )
        except Exception as exc:  # captured for assertion in the test thread
            outcome["error"] = exc
        finally:
            close_old_connections()

    with transaction.atomic():
        locked_user = User.objects.select_for_update().get(pk=user.pk)
        monkeypatch.setattr(
            User.objects,
            "select_for_update",
            tracked_select_for_update,
        )
        monkeypatch.setattr(User, "check_password", tracked_check_password)

        login_thread = threading.Thread(target=attempt_old_password_login)
        login_thread.start()
        assert lock_requested.wait(timeout=5)
        assert events == ["lock_requested"]

        locked_user.set_password("Valid-New-Password-123!")
        locked_user.save(update_fields=["password"])

    login_thread.join(timeout=5)
    assert not login_thread.is_alive()
    assert isinstance(outcome.get("error"), InvalidCredentialsError)
    assert "result" not in outcome
    assert events == ["lock_requested", "password_checked"]
    assert Authtoken.objects.filter(user=user).count() == 0


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
    assert body["user"]["accountRole"] == "student"
    assert body["user"]["languagePreference"] == "en"

    user_model = get_user_model()
    db_user = user_model.objects.get(email="NewUser@example.com")
    assert db_user.password != "password123"
    assert db_user.check_password("password123")

    me_response = client.get("/api/auth/me", **_auth_header(body["accessToken"]))
    assert me_response.status_code == 200
    assert me_response.json()["uuid"] == str(db_user.uuid)
    assert me_response.json()["accountRole"] == "student"
    assert me_response.json()["languagePreference"] == "en"


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
    assert response.json() == {
        "code": "email_already_registered",
        "params": {},
    }


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
    assert response.json() == {
        "code": "registration_fields_required",
        "params": {},
    }


@pytest.mark.django_db
def test_authenticated_me_succeeds_with_valid_bearer(client: Client, user):
    raw_token, _ = _issue_token_for(user)

    response = client.get("/api/auth/me", **_auth_header(raw_token))
    assert response.status_code == 200
    assert response.json()["uuid"] == str(user.uuid)
    assert response.json()["languagePreference"] == "en"


@pytest.mark.django_db
def test_invalid_token_is_rejected(client: Client):
    response = client.get("/api/auth/me", **_auth_header("not-a-real-token"))
    assert response.status_code == 401


@pytest.mark.django_db
def test_expired_token_is_rejected(client: Client, user):
    raw_token, _ = _issue_token_for(user, expires_delta=timedelta(seconds=-1))

    response = client.get("/api/auth/me", **_auth_header(raw_token))
    assert response.status_code == 401
    assert response.json() == {"code": "token_expired", "params": {}}


@pytest.mark.django_db
def test_revoked_token_is_rejected(client: Client, user):
    raw_token, _ = _issue_token_for(user, revoked=True)

    response = client.get("/api/auth/me", **_auth_header(raw_token))
    assert response.status_code == 401
    assert response.json() == {"code": "token_revoked", "params": {}}


@pytest.mark.django_db
def test_token_from_older_credential_version_is_rejected(client: Client, user):
    raw_token, token = _issue_token_for(user)
    user.credential_version += 1
    user.save(update_fields=["credential_version"])

    response = client.get("/api/auth/me", **_auth_header(raw_token))

    assert token.revoked_at is None
    assert response.status_code == 401
    assert response.json() == {"code": "token_revoked", "params": {}}


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
    assert body["owner"]["id"] == user.id
    project = Project.objects.get(uuid=body["uuid"])
    assert project.owner_id == user.id
    assert project.owner_id != other_user.id
