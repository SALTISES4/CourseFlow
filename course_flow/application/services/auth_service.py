from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.models import Authtoken, User


class InvalidCredentialsError(Exception):
    pass


class DuplicateEmailError(Exception):
    pass


class RegistrationValidationError(Exception):
    pass


@dataclass(frozen=True, slots=True)
class IssuedAuthToken:
    access_token: str
    expires_at: datetime


class AuthService:
    def _token_ttl_seconds(self) -> int:
        return int(getattr(settings, "CF_AUTH_TOKEN_TTL_SECONDS", 60 * 60 * 24 * 30))

    def issue_token(self, *, user: User, label: str = "") -> IssuedAuthToken:
        now = timezone.now()
        expires_at = now + timedelta(seconds=self._token_ttl_seconds())
        raw_token = generate_raw_token()
        Authtoken.objects.create(
            user=user,
            token_hash=hash_token(raw_token),
            label=label,
            expires_at=expires_at,
            last_used_at=now,
        )
        return IssuedAuthToken(access_token=raw_token, expires_at=expires_at)

    def login(self, *, email: str, password: str, label: str = "") -> tuple[User, IssuedAuthToken]:
        normalized_email = email.strip()
        user = authenticate(username=normalized_email, password=password)
        if user is None or not user.is_active:
            raise InvalidCredentialsError
        return user, self.issue_token(user=user, label=label)

    def register(
        self,
        *,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        label: str = "",
    ) -> tuple[User, IssuedAuthToken]:
        cleaned_email = email.strip()
        cleaned_first_name = first_name.strip()
        cleaned_last_name = last_name.strip()

        if not cleaned_email or not password or not cleaned_first_name or not cleaned_last_name:
            raise RegistrationValidationError("All fields are required")

        user_model = get_user_model()
        normalized_email = user_model.objects.normalize_email(cleaned_email)

        if user_model.objects.filter(email__iexact=normalized_email).exists():
            raise DuplicateEmailError

        try:
            user = user_model.objects.create_user(
                email=normalized_email,
                password=password,
                first_name=cleaned_first_name,
                last_name=cleaned_last_name,
            )
        except ValidationError as exc:
            raise RegistrationValidationError(str(exc)) from exc

        return user, self.issue_token(user=user, label=label)
