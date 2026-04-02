from __future__ import annotations

from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import (
    BearerAuth,
    get_current_token,
    get_current_user,
)
from course_flow_v2.api.deps import get_auth_service
from course_flow_v2.api.schemas.auth import (
    LoginIn,
    LoginOut,
    LogoutOut,
    RegisterIn,
    UserSummaryOut,
    UserSummaryOutResp,
)
from course_flow_v2.application.services.auth_service import (
    DuplicateEmailError,
    InvalidCredentialsError,
    RegistrationValidationError,
)
from course_flow_v2.core.models import AuthToken, User

router = Router(tags=["auth"])


def _to_user_summary(user: User) -> UserSummaryOut:
    return UserSummaryOut(
        uuid=user.uuid,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
    )


@router.post("/login", response=LoginOut, operation_id="login")
def login(request, payload: LoginIn):
    svc = get_auth_service()
    try:
        user, issued = svc.login(
            email=payload.email,
            password=payload.password,
            label=payload.label,
        )
    except InvalidCredentialsError:
        raise HttpError(401, "Invalid credentials")
    return LoginOut(
        access_token=issued.access_token,
        token_type="Bearer",
        expires_at=issued.expires_at,
        user=_to_user_summary(user),
    )


@router.post("/register", response=LoginOut, operation_id="register")
def register(request, payload: RegisterIn):
    svc = get_auth_service()
    try:
        user, issued = svc.register(
            email=payload.email,
            password=payload.password,
            first_name=payload.first_name,
            last_name=payload.last_name,
            label=payload.label,
        )
    except DuplicateEmailError:
        raise HttpError(409, "Email is already registered")
    except RegistrationValidationError as exc:
        raise HttpError(400, str(exc))

    return LoginOut(
        access_token=issued.access_token,
        token_type="Bearer",
        expires_at=issued.expires_at,
        user=_to_user_summary(user),
    )


@router.post("/logout", response=LogoutOut, auth=BearerAuth(), operation_id="logout")
def logout(request):
    auth_token = get_current_token(request)
    if auth_token.revoked_at is None:
        now = timezone.now()
        AuthToken.objects.filter(id=auth_token.id).update(revoked_at=now)
    return LogoutOut(success=True)


@router.get("/me", response=UserSummaryOutResp, auth=BearerAuth(), operation_id="me")
def me(request):
    return UserSummaryOutResp(item=_to_user_summary(get_current_user(request)))
