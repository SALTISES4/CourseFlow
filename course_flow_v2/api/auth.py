from __future__ import annotations

from typing import Any, cast

from django.contrib.auth import get_user_model
from django.http import HttpRequest
from django.utils import timezone
from ninja.errors import HttpError
from ninja.security import HttpBearer

from course_flow_v2.core.auth import hash_token
from course_flow_v2.core.models import AuthToken, User


class BearerAuth(HttpBearer):
    def authenticate(self, request: HttpRequest, token: str) -> User | None:
        token_hash = hash_token(token)
        try:
            auth_token = AuthToken.objects.select_related("user").get(
                token_hash=token_hash
            )
        except AuthToken.DoesNotExist:
            return None

        now = timezone.now()
        if auth_token.revoked_at is not None:
            raise HttpError(401, "Token revoked")
        if auth_token.expires_at <= now:
            raise HttpError(401, "Token expired")

        AuthToken.objects.filter(id=auth_token.id).update(last_used_at=now)
        auth_token.last_used_at = now
        setattr(request, "cf2_auth_token", auth_token)
        return auth_token.user


def get_current_user(request: HttpRequest) -> User:
    user = cast(Any, getattr(request, "auth", None))
    user_model = get_user_model()
    if not isinstance(user, user_model):
        raise HttpError(401, "Authentication required")
    return cast(User, user)


def get_current_token(request: HttpRequest) -> AuthToken:
    auth_token = cast(Any, getattr(request, "cf2_auth_token", None))
    if not isinstance(auth_token, AuthToken):
        raise HttpError(401, "Authentication required")
    return auth_token
