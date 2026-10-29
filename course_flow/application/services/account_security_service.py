from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from course_flow.application.services.email_service import (
    PASSWORD_CHANGED_CONFIRMATION_EMAIL,
    EmailCategory,
    EmailRecipient,
    EmailService,
    PasswordChangedConfirmationEmailContext,
)
from course_flow.application.services.password_policy import (
    password_meets_strength_requirement,
)
from course_flow.core.models import Authtoken, User


class PasswordChangeValidationError(Exception):
    def __init__(self, errors: dict[str, str]):
        super().__init__("Password change validation failed")
        self.errors = errors


class InvalidCurrentTokenError(Exception):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


class AccountSecurityService:
    def __init__(self, email_service: EmailService):
        self._email_service = email_service

    def change_password(
        self,
        *,
        user_id: int,
        current_token_id: int,
        current_password: str | None,
        new_password: str | None,
    ) -> User | None:
        with transaction.atomic():
            user = User.objects.select_for_update().filter(pk=user_id).first()
            if user is None:
                return None

            current_token = (
                Authtoken.objects.select_for_update()
                .filter(pk=current_token_id, user_id=user_id)
                .first()
            )
            self._validate_current_token(current_token=current_token, user=user)
            self._validate_passwords(
                user=user,
                current_password=current_password,
                new_password=new_password,
            )

            assert current_token is not None
            assert new_password is not None
            now = timezone.now()
            new_credential_version = user.credential_version + 1

            user.set_password(new_password)
            user.credential_version = new_credential_version
            user.save(update_fields=["password", "credential_version"])

            current_token.credential_version = new_credential_version
            current_token.save(update_fields=["credential_version"])

            (
                Authtoken.objects.filter(
                    user_id=user.id,
                    revoked_at__isnull=True,
                    expires_at__gt=now,
                )
                .exclude(pk=current_token.id)
                .update(revoked_at=now)
            )

            recipient = EmailRecipient(
                address=user.email,
                language_preference=user.language_preference,
                optional_product_updates_enabled=user.notifications_active,
            )
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

    @staticmethod
    def _validate_current_token(
        *, current_token: Authtoken | None, user: User
    ) -> None:
        if current_token is None or current_token.revoked_at is not None:
            raise InvalidCurrentTokenError("token_revoked")
        if current_token.expires_at <= timezone.now():
            raise InvalidCurrentTokenError("token_expired")
        if current_token.credential_version != user.credential_version:
            raise InvalidCurrentTokenError("token_revoked")

    @staticmethod
    def _validate_passwords(
        *,
        user: User,
        current_password: str | None,
        new_password: str | None,
    ) -> None:
        errors: dict[str, str] = {}

        if current_password is None or not user.check_password(current_password):
            errors["password"] = "current_password_incorrect"

        if new_password is None:
            errors["newPassword"] = "new_password_required"
        elif current_password is not None and new_password == current_password:
            errors["newPassword"] = "new_password_matches_current"
        elif not password_meets_strength_requirement(new_password):
            errors["newPassword"] = "password_strength_required"

        if errors:
            raise PasswordChangeValidationError(errors)
