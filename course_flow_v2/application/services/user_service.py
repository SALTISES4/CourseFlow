from __future__ import annotations

from course_flow_v2.core.models import User


class UserService:
    ALLOWED_LANGUAGE_PREFERENCES = {"en", "fr"}

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
            user.language_preference = value

        user.save(update_fields=["first_name", "last_name", "language_preference"])
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

    def list_users(self) -> list[User]:
        return list(User.objects.order_by("first_name", "last_name", "id"))
