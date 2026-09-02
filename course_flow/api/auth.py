from __future__ import annotations

from typing import Any, cast

from django.contrib.auth import get_user_model
from django.http import HttpRequest
from django.utils import timezone
from ninja.security import HttpBearer

from course_flow.api.errors import ExpectedApiError
from course_flow.core.auth import hash_token
from course_flow.core.models import Authtoken, User


class BearerAuth(HttpBearer):
    def authenticate(self, request: HttpRequest, token: str) -> User | None:
        token_hash = hash_token(token)
        try:
            auth_token = Authtoken.objects.select_related("user").get(
                token_hash=token_hash
            )
        except Authtoken.DoesNotExist:
            return None

        now = timezone.now()
        if auth_token.revoked_at is not None:
            raise ExpectedApiError(401, "token_revoked")
        if auth_token.expires_at <= now:
            raise ExpectedApiError(401, "token_expired")

        Authtoken.objects.filter(id=auth_token.id).update(last_used_at=now)
        auth_token.last_used_at = now
        setattr(request, "cf_auth_token", auth_token)
        return auth_token.user


def get_current_user(request: HttpRequest) -> User:
    user = cast(Any, getattr(request, "auth", None))
    user_model = get_user_model()
    if not isinstance(user, user_model):
        raise ExpectedApiError(401, "authentication_required")
    return cast(User, user)


def get_current_token(request: HttpRequest) -> Authtoken:
    auth_token = cast(Any, getattr(request, "cf_auth_token", None))
    if not isinstance(auth_token, Authtoken):
        raise ExpectedApiError(401, "authentication_required")
    return auth_token
