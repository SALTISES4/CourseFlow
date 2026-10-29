from __future__ import annotations

import hashlib
import hmac
from dataclasses import dataclass
from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import connection, transaction
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from course_flow.application.services.email_service import (
    PASSWORD_CHANGED_CONFIRMATION_EMAIL,
    PASSWORD_RESET_REQUEST_EMAIL,
    EmailCategory,
    EmailRecipient,
    EmailService,
    PasswordChangedConfirmationEmailContext,
    PasswordResetRequestEmailContext,
)
from course_flow.application.services.password_policy import (
    password_meets_strength_requirement,
)
from course_flow.core.models import Authtoken, PasswordResetAttempt, User


class PasswordResetRequestValidationError(Exception):
    pass


class PasswordResetTokenInvalidError(Exception):
    pass


class PasswordResetConfirmationValidationError(Exception):
    def __init__(self, errors: dict[str, str]):
        super().__init__("Password reset confirmation validation failed")
        self.errors = errors


@dataclass(frozen=True, slots=True)
class PasswordResetRequestResult:
    email_sent: bool
    rate_limited: bool


class PasswordRecoveryService:
    EMAIL_LIMIT = 5
    IP_LIMIT = 20
    RATE_LIMIT_WINDOW = timedelta(hours=1)
    RETENTION_WINDOW = timedelta(days=1)

    def __init__(self, email_service: EmailService):
        self._email_service = email_service

    def request_reset(
        self,
        *,
        email: str,
        client_ip: str,
    ) -> PasswordResetRequestResult:
        normalized_email = self._normalize_and_validate_email(email)
        is_eligible = self._record_and_evaluate_attempt(
            normalized_email=normalized_email,
            client_ip=client_ip,
        )
        if not is_eligible:
            return PasswordResetRequestResult(email_sent=False, rate_limited=True)

        user = (
            User.objects.filter(email__iexact=normalized_email, is_active=True)
            .order_by("pk")
            .first()
        )
        if user is None:
            return PasswordResetRequestResult(email_sent=False, rate_limited=False)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        fragment = urlencode({"uid": uid, "token": token})
        recipient = self._recipient_for(user)
        self._email_service.send(
            template=PASSWORD_RESET_REQUEST_EMAIL,
            recipient=recipient,
            category=EmailCategory.ESSENTIAL_ACTION,
            context=PasswordResetRequestEmailContext(
                reset_path=f"/password-reset/confirm#{fragment}",
            ),
        )
        return PasswordResetRequestResult(email_sent=True, rate_limited=False)

    def token_is_valid(self, *, uid: str, token: str) -> bool:
        user = self._resolve_user(uid)
        return bool(
            user is not None
            and user.is_active
            and default_token_generator.check_token(user, token)
        )

    def confirm_reset(
        self,
        *,
        uid: str,
        token: str,
        new_password: str | None,
    ) -> User:
        user_id = self._decode_user_id(uid)
        if user_id is None:
            raise PasswordResetTokenInvalidError

        with transaction.atomic():
            user = User.objects.select_for_update().filter(pk=user_id).first()
            if (
                user is None
                or not user.is_active
                or not default_token_generator.check_token(user, token)
            ):
                raise PasswordResetTokenInvalidError

            self._validate_new_password(new_password)
            assert new_password is not None

            now = timezone.now()
            user.set_password(new_password)
            user.credential_version += 1
            user.save(update_fields=["password", "credential_version"])

            Authtoken.objects.filter(
                user_id=user.id,
                revoked_at__isnull=True,
                expires_at__gt=now,
            ).update(revoked_at=now)

            recipient = self._recipient_for(user)
            transaction.on_commit(
                lambda: self._email_service.send(
                    template=PASSWORD_CHANGED_CONFIRMATION_EMAIL,
                    recipient=recipient,
                    category=EmailCategory.ADVISORY_CONFIRMATION,
                    context=PasswordChangedConfirmationEmailContext(),
                ),
                robust=True,
            )

        return user

    @classmethod
    def _normalize_and_validate_email(cls, email: str) -> str:
        normalized = email.strip().lower()
        try:
            validate_email(normalized)
        except ValidationError:
            raise PasswordResetRequestValidationError from None
        return normalized

    @classmethod
    def _validate_new_password(cls, new_password: str | None) -> None:
        if new_password is None or not new_password:
            raise PasswordResetConfirmationValidationError(
                {"newPassword": "new_password_required"}
            )
        if not password_meets_strength_requirement(new_password):
            raise PasswordResetConfirmationValidationError(
                {"newPassword": "password_strength_required"}
            )

    def _record_and_evaluate_attempt(
        self,
        *,
        normalized_email: str,
        client_ip: str,
    ) -> bool:
        email_key = self._fingerprint("email", normalized_email)
        ip_key = self._fingerprint("ip", client_ip)
        advisory_keys = sorted(
            {
                self._advisory_lock_key(email_key),
                self._advisory_lock_key(ip_key),
            }
        )
        now = timezone.now()
        window_start = now - self.RATE_LIMIT_WINDOW

        with transaction.atomic():
            with connection.cursor() as cursor:
                for key in advisory_keys:
                    cursor.execute("SELECT pg_advisory_xact_lock(%s)", [key])

            email_attempts = PasswordResetAttempt.objects.filter(
                email_key=email_key,
                created_at__gt=window_start,
            ).count()
            ip_attempts = PasswordResetAttempt.objects.filter(
                ip_key=ip_key,
                created_at__gt=window_start,
            ).count()
            PasswordResetAttempt.objects.create(
                email_key=email_key,
                ip_key=ip_key,
                created_at=now,
            )
            PasswordResetAttempt.objects.filter(
                created_at__lt=now - self.RETENTION_WINDOW
            ).delete()

        return email_attempts < self.EMAIL_LIMIT and ip_attempts < self.IP_LIMIT

    @staticmethod
    def _fingerprint(namespace: str, value: str) -> str:
        secret = settings.PASSWORD_RESET_RATE_LIMIT_SECRET.encode("utf-8")
        payload = f"{namespace}\0{value}".encode()
        return hmac.new(secret, payload, hashlib.sha256).hexdigest()

    @staticmethod
    def _advisory_lock_key(fingerprint: str) -> int:
        return int.from_bytes(bytes.fromhex(fingerprint[:16]), "big", signed=True)

    @classmethod
    def _resolve_user(cls, uid: str) -> User | None:
        user_id = cls._decode_user_id(uid)
        if user_id is None:
            return None
        return User.objects.filter(pk=user_id).first()

    @staticmethod
    def _decode_user_id(uid: str) -> int | None:
        try:
            return int(force_str(urlsafe_base64_decode(uid)))
        except (TypeError, ValueError, OverflowError, UnicodeDecodeError):
            return None

    @staticmethod
    def _recipient_for(user: User) -> EmailRecipient:
        return EmailRecipient(
            address=user.email,
            language_preference=user.language_preference,
            optional_product_updates_enabled=user.notifications_active,
        )
