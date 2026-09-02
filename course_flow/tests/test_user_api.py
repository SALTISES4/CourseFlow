from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.application.services.notification_service import (
    NotificationService,
)
from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.models import Authtoken, Notification


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
    Authtoken.objects.create(
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
    assert body["firstName"] == "Owner"
    assert body["lastName"] == "User"
    assert body["languagePreference"] == "en"


@pytest.mark.django_db
def test_patch_profile_settings_updates_allowed_fields(client: Client, user):
    raw_token = _issue_token_for(user)
    response = client.patch(
        "/api/user/me/profile-settings",
        data={
            "firstName": "  Alex  ",
            "lastName": "  Dray ",
            "languagePreference": "fr",
        },
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    body = response.json()["item"]
    assert body["firstName"] == "Alex"
    assert body["lastName"] == "Dray"
    assert body["languagePreference"] == "fr"
    user.refresh_from_db()
    assert user.first_name == "Alex"
    assert user.last_name == "Dray"
    assert user.language_preference == "fr-ca"


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
    assert response.json() == {
        "code": "email_update_not_supported",
        "params": {},
    }
    user.refresh_from_db()
    assert user.email == "owner@example.com"


@pytest.mark.django_db
def test_patch_profile_settings_rejects_names_over_200_characters(
    client: Client, user
):
    raw_token = _issue_token_for(user)
    response = client.patch(
        "/api/user/me/profile-settings",
        data={"firstName": "x" * 201, "lastName": "y" * 201},
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 400
    assert response.json() == {
        "code": "validation_failed",
        "params": {},
        "fieldErrors": {
            "firstName": {"code": "first_name_too_long", "params": {}},
            "lastName": {"code": "last_name_too_long", "params": {}},
        },
    }
    user.refresh_from_db()
    assert user.first_name == "Owner"
    assert user.last_name == "User"


@pytest.mark.django_db
def test_patch_profile_password_rejects_incorrect_current_password(
    client: Client, user
):
    raw_token = _issue_token_for(user)
    response = client.patch(
        "/api/user/me/password-reset",
        data={
            "password": "incorrect-password",
            "newPassword": "Valid-New-Password-123!",
        },
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 400
    assert response.json() == {
        "code": "validation_failed",
        "params": {},
        "fieldErrors": {
            "password": {"code": "current_password_incorrect", "params": {}}
        },
    }
    user.refresh_from_db()
    assert user.check_password("password123")


@pytest.mark.django_db
def test_patch_profile_password_rejects_weak_or_reused_password(client: Client, user):
    raw_token = _issue_token_for(user)
    weak_response = client.patch(
        "/api/user/me/password-reset",
        data={"password": "password123", "newPassword": "too-short"},
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert weak_response.status_code == 400
    assert weak_response.json() == {
        "code": "validation_failed",
        "params": {},
        "fieldErrors": {
            "newPassword": {"code": "password_strength_required", "params": {}}
        },
    }

    reused_response = client.patch(
        "/api/user/me/password-reset",
        data={"password": "password123", "newPassword": "password123"},
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert reused_response.status_code == 400
    assert reused_response.json() == {
        "code": "validation_failed",
        "params": {},
        "fieldErrors": {
            "newPassword": {
                "code": "new_password_matches_current",
                "params": {},
            }
        },
    }
    user.refresh_from_db()
    assert user.check_password("password123")


@pytest.mark.django_db
def test_patch_profile_password_updates_password(client: Client, user):
    raw_token = _issue_token_for(user)
    response = client.patch(
        "/api/user/me/password-reset",
        data={
            "password": "password123",
            "newPassword": "Valid-New-Password-123!",
        },
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    assert response.json()["uuid"] == str(user.uuid)
    user.refresh_from_db()
    assert user.check_password("Valid-New-Password-123!")


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
    assert response.json()["item"]["notificationsActive"] is True


@pytest.mark.django_db
def test_patch_notification_settings_updates_boolean(client: Client, user):
    raw_token = _issue_token_for(user)
    response = client.patch(
        "/api/user/me/notification-settings",
        data={"notificationsActive": True},
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    assert response.json()["item"]["notificationsActive"] is True
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
    assert {"uuid", "email", "firstName", "lastName"} == set(first.keys())


@pytest.mark.django_db
def test_get_user_list_filter_by_first_name(client: Client, user):
    user_model = get_user_model()
    user_model.objects.create_user(
        email="zara.zed@example.com",
        password="password123",
        first_name="Zara",
        last_name="Zed",
    )
    user_model.objects.create_user(
        email="bee.unique@example.com",
        password="password123",
        first_name="Alpha",
        last_name="Bee",
    )
    raw_token = _issue_token_for(user)
    response = client.get(
        "/api/user?filter=Alpha",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["total"] == 1
    assert body["items"][0]["firstName"] == "Alpha"


@pytest.mark.django_db
def test_get_user_list_filter_by_last_name(client: Client, user):
    user_model = get_user_model()
    user_model.objects.create_user(
        email="ln-one@example.com",
        password="password123",
        first_name="X",
        last_name="UniqueLast",
    )
    user_model.objects.create_user(
        email="ln-two@example.com",
        password="password123",
        first_name="Y",
        last_name="Other",
    )
    raw_token = _issue_token_for(user)
    response = client.get(
        "/api/user?filter=UniqueLast",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["total"] == 1
    assert body["items"][0]["lastName"] == "UniqueLast"


@pytest.mark.django_db
def test_get_user_list_filter_by_email(client: Client, user):
    user_model = get_user_model()
    user_model.objects.create_user(
        email="very.special.email@example.com",
        password="password123",
        first_name="E",
        last_name="M",
    )
    raw_token = _issue_token_for(user)
    response = client.get(
        "/api/user?filter=very.special",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["total"] == 1
    assert body["items"][0]["email"] == "very.special.email@example.com"


@pytest.mark.django_db
def test_get_user_list_blank_filter_same_as_unfiltered(client: Client, user, other_user):
    raw_token = _issue_token_for(user)
    unfiltered = client.get("/api/user", **_auth_header(raw_token))
    blank = client.get("/api/user?filter=", **_auth_header(raw_token))
    spaces = client.get("/api/user?filter=%20%20", **_auth_header(raw_token))
    assert unfiltered.status_code == 200
    assert blank.status_code == 200
    assert spaces.status_code == 200
    assert unfiltered.json()["meta"]["total"] == blank.json()["meta"]["total"]
    assert unfiltered.json()["meta"]["total"] == spaces.json()["meta"]["total"]


@pytest.mark.django_db
def test_get_user_list_unauthorized_rejected(client: Client):
    response = client.get("/api/user")
    assert response.status_code == 401


@pytest.mark.django_db
def test_list_notifications_only_for_current_user_ordered_newest_first(
    client: Client, user, other_user
):
    raw_token = _issue_token_for(user)
    older = Notification.objects.create(user=user, legacy_message="old", is_read=False)
    newer = Notification.objects.create(user=user, legacy_message="new", is_read=True)
    Notification.objects.create(user=other_user, legacy_message="other", is_read=False)
    response = client.get("/api/user/me/notifications", **_auth_header(raw_token))
    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["total"] == 2
    assert body["meta"]["unreadCount"] == 1
    assert body["meta"]["totalPages"] == 1
    assert body["meta"]["currentPage"] == 1
    assert body["meta"]["pageSize"] == 10
    assert len(body["items"]) == 2
    assert body["items"][0]["uuid"] == str(newer.uuid)
    assert body["items"][1]["uuid"] == str(older.uuid)
    assert body["items"][0]["messageCode"] is None
    assert body["items"][0]["messageParams"] == {}
    assert body["items"][0]["legacyMessage"] == "new"


@pytest.mark.django_db
def test_list_notifications_returns_semantic_message_contract(client: Client, user):
    raw_token = _issue_token_for(user)
    notification = Notification.objects.create(
        user=user,
        message_code="project.shared",
        message_params={"projectTitle": "Biology 101"},
    )

    response = client.get("/api/user/me/notifications", **_auth_header(raw_token))

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["uuid"] == str(notification.uuid)
    assert item["messageCode"] == "project.shared"
    assert item["messageParams"] == {"projectTitle": "Biology 101"}
    assert item["legacyMessage"] is None


@pytest.mark.django_db
def test_system_notification_creation_validates_code_and_required_params(user):
    service = NotificationService()
    notification = service.create_system_notification(
        user_id=user.id,
        message_code="project.shared",
        message_params={"projectTitle": "Biology 101"},
    )
    assert notification.message_code == "project.shared"
    assert notification.message_params == {"projectTitle": "Biology 101"}

    with pytest.raises(ValueError, match="Unknown system notification code"):
        service.create_system_notification(
            user_id=user.id,
            message_code="unknown.event",
        )

    with pytest.raises(ValueError, match="Missing parameters"):
        service.create_system_notification(
            user_id=user.id,
            message_code="project.shared",
        )


@pytest.mark.django_db
def test_list_notifications_pagination_distinct_pages(client: Client, user):
    raw_token = _issue_token_for(user)
    for i in range(11):
        Notification.objects.create(user=user, legacy_message=f"n{i}", is_read=False)
    r1 = client.get(
        "/api/user/me/notifications?page=1&page_size=10",
        **_auth_header(raw_token),
    )
    assert r1.status_code == 200
    b1 = r1.json()
    assert b1["meta"]["total"] == 11
    assert b1["meta"]["totalPages"] == 2
    assert b1["meta"]["currentPage"] == 1
    assert b1["meta"]["pageSize"] == 10
    assert len(b1["items"]) == 10

    r2 = client.get(
        "/api/user/me/notifications?page=2&page_size=10",
        **_auth_header(raw_token),
    )
    assert r2.status_code == 200
    b2 = r2.json()
    assert b2["meta"]["total"] == 11
    assert b2["meta"]["totalPages"] == 2
    assert b2["meta"]["currentPage"] == 2
    assert b2["meta"]["pageSize"] == 10
    assert len(b2["items"]) == 1

    uuids_p1 = {row["uuid"] for row in b1["items"]}
    uuids_p2 = {row["uuid"] for row in b2["items"]}
    assert not uuids_p1.intersection(uuids_p2)


@pytest.mark.django_db
def test_list_notifications_page_beyond_last_is_clamped(client: Client, user):
    raw_token = _issue_token_for(user)
    Notification.objects.create(user=user, legacy_message="only", is_read=False)
    response = client.get(
        "/api/user/me/notifications?page=5&page_size=10",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["total"] == 1
    assert body["meta"]["totalPages"] == 1
    assert body["meta"]["currentPage"] == 1
    assert len(body["items"]) == 1


@pytest.mark.django_db
def test_list_notifications_rejects_invalid_page(client: Client, user):
    raw_token = _issue_token_for(user)
    response = client.get(
        "/api/user/me/notifications?page=0",
        **_auth_header(raw_token),
    )
    assert response.status_code == 422


@pytest.mark.django_db
def test_list_notifications_rejects_oversized_page_size(client: Client, user):
    raw_token = _issue_token_for(user)
    response = client.get(
        "/api/user/me/notifications?page=1&page_size=500",
        **_auth_header(raw_token),
    )
    assert response.status_code == 422


@pytest.mark.django_db
def test_mark_one_notification_as_read(client: Client, user):
    raw_token = _issue_token_for(user)
    notification = Notification.objects.create(user=user, legacy_message="mark me", is_read=False)
    response = client.post(
        f"/api/user/me/notifications/{notification.uuid}/mark-as-read",
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    assert response.json()["item"]["isRead"] is True
    notification.refresh_from_db()
    assert notification.is_read is True


@pytest.mark.django_db
def test_mark_one_notification_as_read_already_read_noop(client: Client, user):
    raw_token = _issue_token_for(user)
    notification = Notification.objects.create(user=user, legacy_message="already", is_read=True)
    response = client.post(
        f"/api/user/me/notifications/{notification.uuid}/mark-as-read",
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    assert response.json()["item"]["isRead"] is True


@pytest.mark.django_db
def test_mark_one_notification_as_read_cross_user_forbidden(client: Client, user, other_user):
    raw_token = _issue_token_for(user)
    other_notification = Notification.objects.create(
        user=other_user, legacy_message="private", is_read=False
    )
    response = client.post(
        f"/api/user/me/notifications/{other_notification.uuid}/mark-as-read",
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_mark_all_notifications_as_read_only_for_current_user(client: Client, user, other_user):
    raw_token = _issue_token_for(user)
    Notification.objects.create(user=user, legacy_message="one", is_read=False)
    Notification.objects.create(user=user, legacy_message="two", is_read=False)
    Notification.objects.create(user=other_user, legacy_message="other", is_read=False)
    response = client.post(
        "/api/user/me/notifications/mark-all-as-read",
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    assert response.json()["meta"]["updatedCount"] == 2
    assert response.json()["meta"]["unreadCount"] == 0
    assert Notification.objects.filter(user=user, is_read=False).count() == 0
    assert Notification.objects.filter(user=other_user, is_read=False).count() == 1


@pytest.mark.django_db
def test_delete_notification_for_current_user_returns_204(client: Client, user):
    raw_token = _issue_token_for(user)
    notification = Notification.objects.create(user=user, legacy_message="delete me", is_read=False)
    response = client.delete(
        f"/api/user/me/notifications/{notification.uuid}",
        **_auth_header(raw_token),
    )
    assert response.status_code == 204
    assert Notification.objects.filter(uuid=notification.uuid).count() == 0


@pytest.mark.django_db
def test_delete_notification_cross_user_forbidden(client: Client, user, other_user):
    raw_token = _issue_token_for(user)
    notification = Notification.objects.create(
        user=other_user, legacy_message="do not delete", is_read=False
    )
    response = client.delete(
        f"/api/user/me/notifications/{notification.uuid}",
        **_auth_header(raw_token),
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_list_notifications_unauthorized_rejected(client: Client):
    response = client.get("/api/user/me/notifications")
    assert response.status_code == 401
