from __future__ import annotations

from django.db.models import Q

from course_flow.core.enum import LanguagePreference
from course_flow.core.models import User

_CANONICAL_LANG = {
    "en": LanguagePreference.EN.value,
    "fr": LanguagePreference.FR.value,
    LanguagePreference.EN.value: LanguagePreference.EN.value,
    LanguagePreference.FR.value: LanguagePreference.FR.value,
}


class UserService:
    ALLOWED_LANGUAGE_PREFERENCES = set(_CANONICAL_LANG.keys())

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

        if first_name is not None:
            value = first_name.strip()
            if not value:
                raise ValueError("first_name must be non-empty")
            user.first_name = value

        if last_name is not None:
            value = last_name.strip()
            if not value:
                raise ValueError("last_name must be non-empty")
            user.last_name = value

        if language_preference is not None:
            value = language_preference.strip().lower()
            if value not in self.ALLOWED_LANGUAGE_PREFERENCES:
                raise ValueError("language_preference is invalid")
            user.language_preference = _CANONICAL_LANG[value]

        user.save(update_fields=["first_name", "last_name", "language_preference"])
        return user

    # TODO: add more robust password validation rules to match the frontend
    # length, alphanumerics, etc
    def reset_password(
        self,
        *,
        user_id: int,
        password: str | None = None,
        new_password: str | None = None,
    ) -> User | None:
        user = User.objects.filter(pk=user_id).first()
        if user is None or password is None or new_password is None:
            return None

        if not user.check_password(password):
            return None

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
