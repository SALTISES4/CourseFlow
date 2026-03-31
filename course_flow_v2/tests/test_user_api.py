from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow_v2.core.auth import generate_raw_token, hash_token
from course_flow_v2.core.models import AuthToken, Notification


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def user():
    user_model = get_user_model()
    return user_model.objects.create_user(
        email="owner@example.com",
        password="password123",
        first_name="Owner",
        last_name="User",
    )


@pytest.fixture
def other_user():
    user_model = get_user_model()
    return user_model.objects.create_user(
        email="other@example.com",
        password="password123",
        first_name="Other",
        last_name="User",
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


@pytest.mark.django_db
def test_get_profile_settings_returns_enveloped_profile(client: Client, user):
    raw_token = _issue_token_for(user)
    response = client.get("/api/user/me/profile-settings", **_auth_header(raw_token))
    assert response.status_code == 200
    body = response.json()["item"]
    assert body["uuid"] == str(user.uuid)
    assert body["email"] == user.email
    assert body["first_name"] == "Owner"
    assert body["last_name"] == "User"
    assert body["language_preference"] == "en"


@pytest.mark.django_db
def test_patch_profile_settings_updates_allowed_fields(client: Client, user):
    raw_token = _issue_token_for(user)
    response = client.patch(
        "/api/user/me/profile-settings",
        data={
            "first_name": "  Alex  ",
            "last_name": "  Dray ",
            "language_preference": "fr",
        },
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    body = response.json()["item"]
    assert body["first_name"] == "Alex"
    assert body["last_name"] == "Dray"
    assert body["language_preference"] == "fr"
    user.refresh_from_db()
    assert user.first_name == "Alex"
    assert user.last_name == "Dray"
    assert user.language_preference == "fr"


@pytest.mark.django_db
def test_patch_profile_settings_rejects_email_mutation(client: Client, user):
    raw_token = _issue_token_for(user)
    response = client.patch(
        "/api/user/me/profile-settings",
        data={"email": "new@example.com"},
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email updates are not supported"
    user.refresh_from_db()
    assert user.email == "owner@example.com"


@pytest.mark.django_db
def test_profile_settings_unauthorized_rejected(client: Client):
    response = client.get("/api/user/me/profile-settings")
    assert response.status_code == 401


@pytest.mark.django_db
def test_get_notification_settings_returns_enveloped_item(client: Client, user):
    raw_token = _issue_token_for(user)
    user.notifications_active = True
    user.save(update_fields=["notifications_active"])
    response = client.get(
        "/api/user/me/notification-settings",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    assert response.json()["item"]["notifications_active"] is True


@pytest.mark.django_db
def test_patch_notification_settings_updates_boolean(client: Client, user):
    raw_token = _issue_token_for(user)
    response = client.patch(
        "/api/user/me/notification-settings",
        data={"notifications_active": True},
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    assert response.json()["item"]["notifications_active"] is True
    user.refresh_from_db()
    assert user.notifications_active is True


@pytest.mark.django_db
def test_notification_settings_unauthorized_rejected(client: Client):
    response = client.get("/api/user/me/notification-settings")
    assert response.status_code == 401


@pytest.mark.django_db
def test_get_user_list_returns_items_and_meta(client: Client, user, other_user):
    raw_token = _issue_token_for(user)
    response = client.get("/api/user", **_auth_header(raw_token))
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "meta" in body
    assert body["meta"]["total"] == len(body["items"])
    assert len(body["items"]) >= 2
    first = body["items"][0]
    assert {"uuid", "email", "first_name", "last_name"} == set(first.keys())


@pytest.mark.django_db
def test_get_user_list_unauthorized_rejected(client: Client):
    response = client.get("/api/user")
    assert response.status_code == 401


@pytest.mark.django_db
def test_list_notifications_only_for_current_user_ordered_newest_first(
    client: Client, user, other_user
):
    raw_token = _issue_token_for(user)
    older = Notification.objects.create(user=user, message="old", is_read=False)
    newer = Notification.objects.create(user=user, message="new", is_read=True)
    Notification.objects.create(user=other_user, message="other", is_read=False)
    response = client.get("/api/user/me/notifications", **_auth_header(raw_token))
    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["total"] == 2
    assert body["meta"]["unread_count"] == 1
    assert body["items"][0]["uuid"] == str(newer.uuid)
    assert body["items"][1]["uuid"] == str(older.uuid)


@pytest.mark.django_db
def test_mark_one_notification_as_read(client: Client, user):
    raw_token = _issue_token_for(user)
    notification = Notification.objects.create(user=user, message="mark me", is_read=False)
    response = client.post(
        f"/api/user/me/notifications/{notification.uuid}/mark-as-read",
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    assert response.json()["item"]["is_read"] is True
    notification.refresh_from_db()
    assert notification.is_read is True


@pytest.mark.django_db
def test_mark_one_notification_as_read_already_read_noop(client: Client, user):
    raw_token = _issue_token_for(user)
    notification = Notification.objects.create(user=user, message="already", is_read=True)
    response = client.post(
        f"/api/user/me/notifications/{notification.uuid}/mark-as-read",
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    assert response.json()["item"]["is_read"] is True


@pytest.mark.django_db
def test_mark_one_notification_as_read_cross_user_404(client: Client, user, other_user):
    raw_token = _issue_token_for(user)
    other_notification = Notification.objects.create(
        user=other_user, message="private", is_read=False
    )
    response = client.post(
        f"/api/user/me/notifications/{other_notification.uuid}/mark-as-read",
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_mark_all_notifications_as_read_only_for_current_user(client: Client, user, other_user):
    raw_token = _issue_token_for(user)
    Notification.objects.create(user=user, message="one", is_read=False)
    Notification.objects.create(user=user, message="two", is_read=False)
    Notification.objects.create(user=other_user, message="other", is_read=False)
    response = client.post(
        "/api/user/me/notifications/mark-all-as-read",
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    assert response.json()["meta"]["updated_count"] == 2
    assert response.json()["meta"]["unread_count"] == 0
    assert Notification.objects.filter(user=user, is_read=False).count() == 0
    assert Notification.objects.filter(user=other_user, is_read=False).count() == 1


@pytest.mark.django_db
def test_delete_notification_for_current_user_returns_204(client: Client, user):
    raw_token = _issue_token_for(user)
    notification = Notification.objects.create(user=user, message="delete me", is_read=False)
    response = client.delete(
        f"/api/user/me/notifications/{notification.uuid}",
        **_auth_header(raw_token),
    )
    assert response.status_code == 204
    assert Notification.objects.filter(uuid=notification.uuid).count() == 0


@pytest.mark.django_db
def test_delete_notification_cross_user_returns_404(client: Client, user, other_user):
    raw_token = _issue_token_for(user)
    notification = Notification.objects.create(
        user=other_user, message="do not delete", is_read=False
    )
    response = client.delete(
        f"/api/user/me/notifications/{notification.uuid}",
        **_auth_header(raw_token),
    )
    assert response.status_code == 404
