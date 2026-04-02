from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.deps import get_user_service
from course_flow_v2.api.schemas.users import (
    UserListItemOut,
    UserListMetaOut,
    UserListOut,
    UserNotificationSettingsOut,
    UserNotificationSettingsOutResp,
    UserNotificationSettingsPatchIn,
    UserProfileSettingsOut,
    UserProfileSettingsOutResp,
    UserProfileSettingsPatchIn,
)
from course_flow_v2.core.models import User

router = Router(tags=["users"], by_alias=True)


def _user_list_item_out(user: User) -> UserListItemOut:
    return UserListItemOut(
        uuid=user.uuid,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
    )


def _profile_out(user: User) -> UserProfileSettingsOut:
    return UserProfileSettingsOut(
        uuid=user.uuid,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        language_preference=user.language_preference,
    )


@router.get(
    "/me/profile-settings",
    response=UserProfileSettingsOutResp,
    auth=BearerAuth(),
    operation_id="getMyProfileSettings",
)
def get_my_profile_settings(request):
    current_user = get_current_user(request)
    user = get_user_service().get_profile_settings(current_user.id)
    if user is None:
        raise HttpError(404, "User not found")
    return UserProfileSettingsOutResp(item=_profile_out(user))


@router.patch(
    "/me/profile-settings",
    response=UserProfileSettingsOutResp,
    auth=BearerAuth(),
    operation_id="patchMyProfileSettings",
)
def patch_my_profile_settings(request, payload: UserProfileSettingsPatchIn):
    current_user = get_current_user(request)
    patch = payload.model_dump(exclude_unset=True)
    if "email" in patch:
        raise HttpError(400, "Email updates are not supported")
    try:
        user = get_user_service().update_profile_settings(user_id=current_user.id, **patch)
    except ValueError as exc:
        raise HttpError(400, str(exc))
    if user is None:
        raise HttpError(404, "User not found")
    return UserProfileSettingsOutResp(item=_profile_out(user))


@router.get(
    "/me/notification-settings",
    response=UserNotificationSettingsOutResp,
    auth=BearerAuth(),
    operation_id="getMyNotificationSettings",
)
def get_my_notification_settings(request):
    current_user = get_current_user(request)
    user = get_user_service().get_notification_settings(current_user.id)
    if user is None:
        raise HttpError(404, "User not found")
    return UserNotificationSettingsOutResp(
        item=UserNotificationSettingsOut(
            notifications_active=user.notifications_active,
        )
    )


@router.patch(
    "/me/notification-settings",
    response=UserNotificationSettingsOutResp,
    auth=BearerAuth(),
    operation_id="patchMyNotificationSettings",
)
def patch_my_notification_settings(request, payload: UserNotificationSettingsPatchIn):
    current_user = get_current_user(request)
    patch = payload.model_dump(exclude_unset=True)
    user = get_user_service().update_notification_settings(user_id=current_user.id, **patch)
    if user is None:
        raise HttpError(404, "User not found")
    return UserNotificationSettingsOutResp(
        item=UserNotificationSettingsOut(
            notifications_active=user.notifications_active,
        )
    )


@router.get("", response=UserListOut, auth=BearerAuth(), operation_id="listUsers")
def list_users(request):
    _ = get_current_user(request)
    # TODO: add explicit search/filter query parameters for user list consumers.
    rows = get_user_service().list_users()
    items = [_user_list_item_out(u) for u in rows]
    return UserListOut(items=items, meta=UserListMetaOut(total=len(items)))
