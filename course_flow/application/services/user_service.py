from __future__ import annotations

import re

from django.db.models import Q

from course_flow.api.schemas.auth import UserMeta, UserSummaryOut
from course_flow.core.enum import LanguagePreference
from course_flow.core.models import Project, User

_CANONICAL_LANG = {
    "en": LanguagePreference.EN.value,
    "fr": LanguagePreference.FR.value,
    LanguagePreference.EN.value: LanguagePreference.EN.value,
    LanguagePreference.FR.value: LanguagePreference.FR.value,
}


class UserService:
    ALLOWED_LANGUAGE_PREFERENCES = set(_CANONICAL_LANG.keys())

    def get_user_summary(self, user: User) -> UserSummaryOut:
        owns_any_project = Project.objects.filter(owner_id=user.id).exists()

        return UserSummaryOut(
            uuid=user.uuid,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            account_role=user.account_role,
            meta=UserMeta(
                owns_any_project=owns_any_project,
            ),
        )

    def get_profile_settings(self, user_id: int) -> User | None:
        return User.objects.filter(pk=user_id).first()

    def update_profile_settings(
        self,
        *,
        user_id: int,
        first_name: str | None = None,
        last_name: str | None = None,
        language_preference: str | None = None,
    ) -> User | None:
        user = User.objects.filter(pk=user_id).first()
        if user is None:
            return None

        errors: dict[str, str] = {}

        if first_name is not None:
            value = first_name.strip()
            if not value:
                errors["firstName"] = "First name is required"
            elif len(value) > 200:
                errors["firstName"] = "First name is limited to 200 characters"
            else:
                user.first_name = value

        if last_name is not None:
            value = last_name.strip()
            if not value:
                errors["lastName"] = "Last name is required"
            elif len(value) > 200:
                errors["lastName"] = "Last name is limited to 200 characters"
            else:
                user.last_name = value

        if language_preference is not None:
            value = language_preference.strip().lower()
            if value not in self.ALLOWED_LANGUAGE_PREFERENCES:
                errors["languagePreference"] = "Language is required"
            else:
                user.language_preference = _CANONICAL_LANG[value]

        if errors:
            raise ValidationError(errors)

        user.save(update_fields=["first_name", "last_name", "language_preference"])
        return user

    def reset_password(
        self,
        *,
        user_id: int,
        password: str | None = None,
        new_password: str | None = None,
    ) -> User | None:
        user = User.objects.filter(pk=user_id).first()
        if user is None:
            return None

        errors: dict[str, str] = {}

        if password is None or not user.check_password(password):
            errors["password"] = "Current password is incorrect"

        if new_password is None:
            errors["newPassword"] = "New password is required"
        elif password is not None and new_password == password:
            errors["newPassword"] = (
                "New password must be different from your current password"
            )

        if new_password is not None and "newPassword" not in errors:
            is_new_pass_valid = (
                len(new_password) >= 12
                and re.search(r"[a-zA-Z]", new_password)
                and re.search(r"\d", new_password)  # at least one digit
                and re.search(
                    r"[^a-zA-Z0-9]", new_password
                )  # at least one symbol
            )
            if not is_new_pass_valid:
                errors["newPassword"] = (
                    "Your password must contain at least 12 characters and include "
                    "a mix of numbers, letters and symbols"
                )

        if errors:
            raise ValidationError(errors)

        assert new_password is not None
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return user

    def get_notification_settings(self, user_id: int) -> User | None:
        return User.objects.filter(pk=user_id).first()

    def update_notification_settings(
        self, *, user_id: int, notifications_active: bool | None = None
    ) -> User | None:
        user = User.objects.filter(pk=user_id).first()
        if user is None:
            return None
        if notifications_active is not None:
            user.notifications_active = notifications_active
            user.save(update_fields=["notifications_active"])
        return user

    def list_users(self, filter_term: str | None = None) -> list[User]:
        """Return all users ordered by name, optionally restricted by a case-insensitive
        substring match on ``first_name``, ``last_name``, or ``email``.

        ``filter_term`` absent or blank (after strip) returns the full list.
        """
        qs = User.objects.all()
        if filter_term is not None:
            term = filter_term.strip()
            if term:
                qs = qs.filter(
                    Q(first_name__icontains=term)
                    | Q(last_name__icontains=term)
                    | Q(email__icontains=term)
                )
        return list(qs.order_by("first_name", "last_name", "id"))

class ValidationError(Exception):
    def __init__(self, errors: dict[str, str]):
        super().__init__("Validation failed")
        self.errors = errors
