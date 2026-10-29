from __future__ import annotations

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

_API_LANG = {
    LanguagePreference.EN.value: "en",
    LanguagePreference.FR.value: "fr",
}


class UserService:
    ALLOWED_LANGUAGE_PREFERENCES = set(_CANONICAL_LANG.keys())

    def get_user_summary(self, user: User) -> UserSummaryOut:
        owns_any_project = Project.objects.filter(owner_id=user.id).exists()

        return UserSummaryOut(
            id=user.id,
            uuid=user.uuid,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            language_preference=_API_LANG.get(user.language_preference, "en"),
            account_role=user.account_role,
            meta=UserMeta(
                owns_any_project=owns_any_project,
            ),
        )

    def update_profile_settings(
        self,
        *,
        user_id: int,
        first_name: str | None = None,
        last_name: str | None = None,
        language_preference: str | None = None,
    ) -> User | None:
        user = self.get_user_by_id(user_id)
        if user is None:
            return None

        errors: dict[str, str] = {}

        if first_name is not None:
            value = first_name.strip()
            if not value:
                errors["firstName"] = "first_name_required"
            elif len(value) > 200:
                errors["firstName"] = "first_name_too_long"
            else:
                user.first_name = value

        if last_name is not None:
            value = last_name.strip()
            if not value:
                errors["lastName"] = "last_name_required"
            elif len(value) > 200:
                errors["lastName"] = "last_name_too_long"
            else:
                user.last_name = value

        if language_preference is not None:
            value = language_preference.strip().lower()
            if value not in self.ALLOWED_LANGUAGE_PREFERENCES:
                errors["languagePreference"] = "language_required"
            else:
                user.language_preference = _CANONICAL_LANG[value]

        if errors:
            raise ValidationError(errors)

        user.save(update_fields=["first_name", "last_name", "language_preference"])
        return user

    def get_notification_settings(self, user_id: int) -> User | None:
        return self.get_user_by_id(user_id)

    def update_notification_settings(
        self, *, user_id: int, notifications_active: bool | None = None
    ) -> User | None:
        user = self.get_user_by_id(user_id)
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

    def get_user_by_id(self, user_id: int) -> User | None:
        return User.objects.filter(pk=user_id).first()

class ValidationError(Exception):
    def __init__(self, errors: dict[str, str]):
        super().__init__("Validation failed")
        self.errors = errors
