from __future__ import annotations

import ipaddress

from django.conf import settings
from django.utils import timezone
from ninja import Router

from course_flow.api.auth import (
    BearerAuth,
    get_current_token,
    get_current_user,
)
from course_flow.api.deps import (
    get_auth_service,
    get_password_recovery_service,
    get_user_service,
)
from course_flow.api.errors import ExpectedApiError, validation_error
from course_flow.api.schemas.auth import (
    LoginIn,
    LoginOut,
    LogoutOut,
    PasswordResetConfirmIn,
    PasswordResetConfirmOut,
    PasswordResetRequestIn,
    PasswordResetRequestOut,
    PasswordResetTokenIn,
    PasswordResetTokenOut,
    RegisterIn,
    UserSummaryOut,
)
from course_flow.application.services.auth_service import (
    DuplicateEmailError,
    InvalidCredentialsError,
    RegistrationValidationError,
)
from course_flow.application.services.email_service import EmailDeliveryError
from course_flow.application.services.password_recovery_service import (
    PasswordResetConfirmationValidationError,
    PasswordResetRequestValidationError,
    PasswordResetTokenInvalidError,
)
from course_flow.core.models import Authtoken

router = Router(tags=["auth"], by_alias=True)


@router.post("/login", response=LoginOut, operation_id="login")
def login(request, payload: LoginIn):
    svc = get_auth_service()
    user_service = get_user_service()

    try:
        user, issued = svc.login(
            email=payload.email,
            password=payload.password,
            label=payload.label,
        )
    except InvalidCredentialsError:
        raise ExpectedApiError(401, "invalid_credentials")
    return LoginOut(
        access_token=issued.access_token,
        token_type="Bearer",
        expires_at=issued.expires_at,
        user=user_service.get_user_summary(user),
    )


@router.post("/register", response=LoginOut, operation_id="register")
def register(request, payload: RegisterIn):
    svc = get_auth_service()
    user_service = get_user_service()
    try:
        user, issued = svc.register(
            email=payload.email,
            password=payload.password,
            first_name=payload.first_name,
            last_name=payload.last_name,
            label=payload.label,
        )
    except DuplicateEmailError:
        raise ExpectedApiError(409, "email_already_registered")
    except RegistrationValidationError:
        raise ExpectedApiError(400, "registration_fields_required")

    return LoginOut(
        access_token=issued.access_token,
        token_type="Bearer",
        expires_at=issued.expires_at,
        user=user_service.get_user_summary(user),
    )


@router.post("/logout", response=LogoutOut, auth=BearerAuth(), operation_id="logout")
def logout(request):
    auth_token = get_current_token(request)
    if auth_token.revoked_at is None:
        now = timezone.now()
        Authtoken.objects.filter(id=auth_token.id).update(revoked_at=now)
    return LogoutOut(success=True)


@router.post(
    "/password-reset/request",
    response=PasswordResetRequestOut,
    operation_id="requestPasswordReset",
)
def request_password_reset(request, payload: PasswordResetRequestIn):
    try:
        get_password_recovery_service().request_reset(
            email=payload.email,
            client_ip=_canonical_client_ip(request),
        )
    except PasswordResetRequestValidationError:
        raise validation_error({"email": "invalid_email_format"})
    except EmailDeliveryError:
        raise ExpectedApiError(503, "password_reset_email_delivery_failed")
    return PasswordResetRequestOut()


@router.post(
    "/password-reset/validate",
    response=PasswordResetTokenOut,
    operation_id="validatePasswordResetToken",
)
def validate_password_reset_token(request, payload: PasswordResetTokenIn):
    valid = get_password_recovery_service().token_is_valid(
        uid=payload.uid,
        token=payload.token,
    )
    return PasswordResetTokenOut(valid=valid)


@router.post(
    "/password-reset/confirm",
    response=PasswordResetConfirmOut,
    operation_id="confirmPasswordReset",
)
def confirm_password_reset(request, payload: PasswordResetConfirmIn):
    try:
        get_password_recovery_service().confirm_reset(
            uid=payload.uid,
            token=payload.token,
            new_password=payload.new_password,
        )
    except PasswordResetTokenInvalidError:
        raise ExpectedApiError(400, "password_reset_link_invalid")
    except PasswordResetConfirmationValidationError as exc:
        raise validation_error(exc.errors)
    return PasswordResetConfirmOut()


@router.get("/me", response=UserSummaryOut, auth=BearerAuth(), operation_id="me")
def me(request):
    user_service = get_user_service()
    return user_service.get_user_summary(get_current_user(request))


def _canonical_client_ip(request) -> str:
    if settings.COURSEFLOW_TRUST_PROXY_CLIENT_IP:
        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
        first_forwarded = forwarded_for.split(",", maxsplit=1)[0].strip()
        parsed = _parse_ip(first_forwarded)
        if parsed is not None:
            return parsed

    remote_addr = request.META.get("REMOTE_ADDR", "")
    return _parse_ip(remote_addr) or "unknown"


def _parse_ip(value: object) -> str | None:
    try:
        return ipaddress.ip_address(str(value).strip()).compressed
    except ValueError:
        return None
