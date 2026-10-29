from __future__ import annotations

import re
import threading
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlsplit

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.db import close_old_connections
from django.test import Client
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from course_flow.application.services.password_recovery_service import (
    PasswordRecoveryService,
    PasswordResetTokenInvalidError,
)
from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.models import Authtoken, PasswordResetAttempt


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def user():
    return get_user_model().objects.create_user(
        email="owner@example.com",
        password="password123",
        first_name="Owner",
        last_name="User",
    )


@pytest.fixture(autouse=True)
def password_recovery_settings(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    settings.DEFAULT_FROM_EMAIL = "sender@example.com"
    settings.COURSEFLOW_SUPPORT_EMAIL = "support@example.com"
    settings.COURSEFLOW_FRONTEND_URL = "http://localhost:3000"
    settings.ENVIRONMENT = "development"
    settings.PASSWORD_RESET_RATE_LIMIT_SECRET = "test-rate-limit-secret"
    settings.COURSEFLOW_TRUST_PROXY_CLIENT_IP = False


def _post_request(
    client: Client,
    email: str,
    *,
    remote_addr: str = "192.0.2.10",
    forwarded_for: str | None = None,
):
    headers: dict[str, str] = {"REMOTE_ADDR": remote_addr}
    if forwarded_for is not None:
        headers["HTTP_X_FORWARDED_FOR"] = forwarded_for
    return client.post(
        "/api/auth/password-reset/request",
        data={"email": email},
        content_type="application/json",
        **headers,
    )


def _link_credentials(message) -> tuple[str, str]:
    match = re.search(r"https?://\S+/password-reset/confirm#[^\s]+", message.body)
    assert match is not None
    fragment = parse_qs(urlsplit(match.group(0)).fragment)
    return fragment["uid"][0], fragment["token"][0]


def _issue_token_for(user, *, expires_delta: timedelta = timedelta(hours=1)):
    now = timezone.now()
    raw_token = generate_raw_token()
    row = Authtoken.objects.create(
        user=user,
        token_hash=hash_token(raw_token),
        credential_version=user.credential_version,
        expires_at=now + expires_delta,
        last_used_at=now,
    )
    return raw_token, row


class _RecordingEmailService:
    def __init__(self):
        self._lock = threading.Lock()
        self.send_count = 0

    def send(self, **kwargs):
        with self._lock:
            self.send_count += 1


@pytest.mark.django_db
def test_request_for_active_account_sends_fragment_link_and_generic_success(
    client: Client,
    user,
):
    response = _post_request(client, "  OWNER@EXAMPLE.COM  ")

    assert response.status_code == 200
    assert response.json() == {"success": True}
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == [user.email]
    uid, token = _link_credentials(mail.outbox[0])
    assert uid
    assert token
    assert "?uid=" not in mail.outbox[0].body

    validate_response = client.post(
        "/api/auth/password-reset/validate",
        data={"uid": uid, "token": token},
        content_type="application/json",
    )
    assert validate_response.status_code == 200
    assert validate_response.json() == {"valid": True}


@pytest.mark.django_db
@pytest.mark.parametrize("account_state", ["unknown", "inactive"])
def test_request_does_not_disclose_unknown_or_inactive_account(
    client: Client,
    user,
    account_state: str,
):
    email = "unknown@example.com"
    if account_state == "inactive":
        user.is_active = False
        user.save(update_fields=["is_active"])
        email = user.email

    response = _post_request(client, email)

    assert response.status_code == 200
    assert response.json() == {"success": True}
    assert len(mail.outbox) == 0
    assert PasswordResetAttempt.objects.count() == 1


@pytest.mark.django_db
def test_request_rejects_invalid_email_without_recording_attempt(client: Client):
    response = _post_request(client, "not-an-email")

    assert response.status_code == 400
    assert response.json() == {
        "code": "validation_failed",
        "params": {},
        "fieldErrors": {
            "email": {"code": "invalid_email_format", "params": {}}
        },
    }
    assert PasswordResetAttempt.objects.count() == 0


@pytest.mark.django_db
def test_sixth_normalized_email_request_is_suppressed_but_still_succeeds(
    client: Client,
    user,
):
    for index in range(5):
        email = " OWNER@example.com " if index % 2 else "owner@EXAMPLE.com"
        response = _post_request(
            client,
            email,
            remote_addr=f"192.0.2.{index + 1}",
        )
        assert response.status_code == 200

    sixth = _post_request(client, user.email, remote_addr="192.0.2.200")

    assert sixth.status_code == 200
    assert sixth.json() == {"success": True}
    assert len(mail.outbox) == 5
    assert PasswordResetAttempt.objects.count() == 6


@pytest.mark.django_db(transaction=True)
def test_concurrent_email_attempts_cannot_exceed_delivery_limit(user):
    email_service = _RecordingEmailService()
    service = PasswordRecoveryService(email_service)  # type: ignore[arg-type]
    barrier = threading.Barrier(6)
    results = []
    failures: list[Exception] = []
    result_lock = threading.Lock()

    def request(index: int):
        close_old_connections()
        try:
            barrier.wait(timeout=5)
            result = service.request_reset(
                email=user.email,
                client_ip=f"192.0.2.{index + 1}",
            )
            with result_lock:
                results.append(result)
        except Exception as exc:
            with result_lock:
                failures.append(exc)
        finally:
            close_old_connections()

    threads = [threading.Thread(target=request, args=(index,)) for index in range(6)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=10)

    assert all(not thread.is_alive() for thread in threads)
    assert failures == []
    assert len(results) == 6
    assert sum(result.email_sent for result in results) == 5
    assert sum(result.rate_limited for result in results) == 1
    assert email_service.send_count == 5
    assert PasswordResetAttempt.objects.count() == 6


@pytest.mark.django_db
def test_twenty_first_ip_request_is_suppressed_and_attempts_store_only_hmacs():
    client_ip = "198.51.100.42"
    service = PasswordRecoveryService(_RecordingEmailService())  # type: ignore[arg-type]
    results = []
    for index in range(21):
        results.append(
            service.request_reset(
                email=f"unknown-{index}@example.com",
                client_ip=client_ip,
            )
        )

    assert all(not result.rate_limited for result in results[:20])
    assert results[20].rate_limited is True
    rows = list(PasswordResetAttempt.objects.order_by("id"))
    assert len(rows) == 21
    assert len({row.ip_key for row in rows}) == 1
    assert all(len(row.email_key) == 64 for row in rows)
    assert all(
        row.email_key != f"unknown-{index}@example.com"
        for index, row in enumerate(rows)
    )
    assert rows[0].ip_key != client_ip
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_attempts_outside_rolling_hour_do_not_suppress_delivery(
    client: Client,
    user,
):
    service = PasswordRecoveryService(_RecordingEmailService())  # type: ignore[arg-type]
    email_key = service._fingerprint("email", user.email)
    old_time = timezone.now() - timedelta(hours=1, seconds=1)
    PasswordResetAttempt.objects.bulk_create(
        [
            PasswordResetAttempt(
                email_key=email_key,
                ip_key=service._fingerprint("ip", f"192.0.2.{index + 1}"),
                created_at=old_time,
            )
            for index in range(5)
        ]
    )

    response = _post_request(
        client,
        user.email,
        remote_addr="192.0.2.100",
    )

    assert response.status_code == 200
    assert len(mail.outbox) == 1
    assert PasswordResetAttempt.objects.count() == 6


@pytest.mark.django_db
def test_forwarded_ip_is_used_only_when_explicitly_trusted(client: Client, settings):
    _post_request(
        client,
        "first@example.com",
        remote_addr="192.0.2.10",
        forwarded_for="203.0.113.8, 10.0.0.2",
    )
    direct_key = PasswordResetAttempt.objects.get().ip_key

    PasswordResetAttempt.objects.all().delete()
    settings.COURSEFLOW_TRUST_PROXY_CLIENT_IP = True
    _post_request(
        client,
        "second@example.com",
        remote_addr="192.0.2.10",
        forwarded_for="203.0.113.8, 10.0.0.2",
    )
    forwarded_key = PasswordResetAttempt.objects.get().ip_key

    assert direct_key == PasswordRecoveryService._fingerprint("ip", "192.0.2.10")
    assert forwarded_key == PasswordRecoveryService._fingerprint("ip", "203.0.113.8")
    assert forwarded_key != direct_key


@pytest.mark.django_db
def test_eligible_delivery_rejection_is_an_explicit_failure(
    client: Client,
    user,
    settings,
):
    settings.EMAIL_BACKEND = (
        "course_flow.tests.test_email_service.RejectingEmailBackend"
    )

    response = _post_request(client, user.email)

    assert response.status_code == 503
    assert response.json() == {
        "code": "password_reset_email_delivery_failed",
        "params": {},
    }
    assert PasswordResetAttempt.objects.count() == 1


@pytest.mark.django_db
def test_invalid_validate_request_returns_valid_false(client: Client):
    response = client.post(
        "/api/auth/password-reset/validate",
        data={"uid": "invalid", "token": "invalid"},
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json() == {"valid": False}


@pytest.mark.django_db
def test_confirm_updates_password_revokes_every_active_token_and_uses_link_once(
    client: Client,
    user,
    django_capture_on_commit_callbacks,
):
    current_version = user.credential_version
    _, first_token = _issue_token_for(user)
    _, second_token = _issue_token_for(user)
    _, expired_token = _issue_token_for(user, expires_delta=timedelta(seconds=-1))
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    reset_token = default_token_generator.make_token(user)

    with django_capture_on_commit_callbacks(execute=True) as callbacks:
        response = client.post(
            "/api/auth/password-reset/confirm",
            data={
                "uid": uid,
                "token": reset_token,
                "newPassword": "Valid-New-Password-123!",
            },
            content_type="application/json",
        )

    assert response.status_code == 200
    assert response.json() == {"success": True}
    assert len(callbacks) == 1
    user.refresh_from_db()
    first_token.refresh_from_db()
    second_token.refresh_from_db()
    expired_token.refresh_from_db()
    assert user.check_password("Valid-New-Password-123!")
    assert user.credential_version == current_version + 1
    assert first_token.revoked_at is not None
    assert second_token.revoked_at is not None
    assert expired_token.revoked_at is None
    assert Authtoken.objects.filter(user=user).count() == 3
    assert len(mail.outbox) == 1
    assert mail.outbox[0].subject == "Your CourseFlow password was reset"

    validate_response = client.post(
        "/api/auth/password-reset/validate",
        data={"uid": uid, "token": reset_token},
        content_type="application/json",
    )
    assert validate_response.json() == {"valid": False}

    repeated_response = client.post(
        "/api/auth/password-reset/confirm",
        data={
            "uid": uid,
            "token": reset_token,
            "newPassword": "Another-Valid-Password-456!",
        },
        content_type="application/json",
    )
    assert repeated_response.status_code == 400
    assert repeated_response.json() == {
        "code": "password_reset_link_invalid",
        "params": {},
    }


@pytest.mark.django_db
def test_confirm_rejects_weak_password_without_changing_security_state(
    client: Client,
    user,
    django_capture_on_commit_callbacks,
):
    _, active_token = _issue_token_for(user)
    original_version = user.credential_version
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    reset_token = default_token_generator.make_token(user)

    with django_capture_on_commit_callbacks(execute=True) as callbacks:
        response = client.post(
            "/api/auth/password-reset/confirm",
            data={"uid": uid, "token": reset_token, "newPassword": "weak"},
            content_type="application/json",
        )

    assert response.status_code == 400
    assert response.json() == {
        "code": "validation_failed",
        "params": {},
        "fieldErrors": {
            "newPassword": {
                "code": "password_strength_required",
                "params": {},
            }
        },
    }
    user.refresh_from_db()
    active_token.refresh_from_db()
    assert user.check_password("password123")
    assert user.credential_version == original_version
    assert active_token.revoked_at is None
    assert callbacks == []


@pytest.mark.django_db
def test_expired_token_is_invalid_for_validation_and_confirmation(
    client: Client,
    user,
    settings,
    monkeypatch,
):
    settings.PASSWORD_RESET_TIMEOUT = 24 * 60 * 60
    issued_at = datetime.now()
    monkeypatch.setattr(default_token_generator, "_now", lambda: issued_at)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    monkeypatch.setattr(
        default_token_generator,
        "_now",
        lambda: issued_at + timedelta(hours=24, seconds=1),
    )

    validate_response = client.post(
        "/api/auth/password-reset/validate",
        data={"uid": uid, "token": token},
        content_type="application/json",
    )
    confirm_response = client.post(
        "/api/auth/password-reset/confirm",
        data={
            "uid": uid,
            "token": token,
            "newPassword": "Valid-New-Password-123!",
        },
        content_type="application/json",
    )

    assert validate_response.json() == {"valid": False}
    assert confirm_response.status_code == 400
    assert confirm_response.json()["code"] == "password_reset_link_invalid"
    user.refresh_from_db()
    assert user.check_password("password123")


@pytest.mark.django_db
def test_confirmation_email_rejection_does_not_undo_success(
    client: Client,
    user,
    settings,
    django_capture_on_commit_callbacks,
):
    settings.EMAIL_BACKEND = (
        "course_flow.tests.test_email_service.RejectingEmailBackend"
    )
    _, active_token = _issue_token_for(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    reset_token = default_token_generator.make_token(user)

    with django_capture_on_commit_callbacks(execute=True):
        response = client.post(
            "/api/auth/password-reset/confirm",
            data={
                "uid": uid,
                "token": reset_token,
                "newPassword": "Valid-New-Password-123!",
            },
            content_type="application/json",
        )

    assert response.status_code == 200
    user.refresh_from_db()
    active_token.refresh_from_db()
    assert user.check_password("Valid-New-Password-123!")
    assert active_token.revoked_at is not None


@pytest.mark.django_db(transaction=True)
def test_concurrent_confirmation_allows_only_one_use_of_reset_token(user):
    email_service = _RecordingEmailService()
    service = PasswordRecoveryService(email_service)  # type: ignore[arg-type]
    _, active_token = _issue_token_for(user)
    original_version = user.credential_version
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    reset_token = default_token_generator.make_token(user)
    barrier = threading.Barrier(2)
    outcomes: list[str] = []
    failures: list[Exception] = []
    outcome_lock = threading.Lock()

    def confirm(index: int):
        close_old_connections()
        try:
            barrier.wait(timeout=5)
            service.confirm_reset(
                uid=uid,
                token=reset_token,
                new_password=f"Valid-Concurrent-Password-{index}!",
            )
            with outcome_lock:
                outcomes.append("success")
        except PasswordResetTokenInvalidError:
            with outcome_lock:
                outcomes.append("invalid")
        except Exception as exc:
            with outcome_lock:
                failures.append(exc)
        finally:
            close_old_connections()

    threads = [threading.Thread(target=confirm, args=(index,)) for index in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=10)

    assert all(not thread.is_alive() for thread in threads)
    assert failures == []
    assert sorted(outcomes) == ["invalid", "success"]
    user.refresh_from_db()
    active_token.refresh_from_db()
    assert user.credential_version == original_version + 1
    assert active_token.revoked_at is not None
    assert email_service.send_count == 1
