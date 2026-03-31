from uuid import UUID

from django.http import HttpResponse
from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.deps import get_notification_service, get_user_service
from course_flow_v2.api.schemas.notifications import (
    NotificationItemOut,
    NotificationItemOutResp,
    NotificationListMetaOut,
    NotificationListOut,
    NotificationsMarkAllAsReadMetaOut,
    NotificationsMarkAllAsReadOut,
)
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

router = Router(tags=["users"])


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


def _notification_item_out(notification) -> NotificationItemOut:
    return NotificationItemOut(
        uuid=notification.uuid,
        message=notification.message,
        is_read=notification.is_read,
        date_created=notification.date_created,
    )


@router.get("/me/profile-settings", response=UserProfileSettingsOutResp, auth=BearerAuth())
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


@router.get("", response=UserListOut, auth=BearerAuth())
def list_users(request):
    _ = get_current_user(request)
    # TODO: add explicit search/filter query parameters for user list consumers.
    rows = get_user_service().list_users()
    items = [_user_list_item_out(u) for u in rows]
    return UserListOut(items=items, meta=UserListMetaOut(total=len(items)))


@router.get("/me/notifications", response=NotificationListOut, auth=BearerAuth())
def list_my_notifications(request):
    current_user = get_current_user(request)
    # TODO: add pagination once notification volume requires it.
    rows = get_notification_service().list_for_user(current_user.id)
    unread_count = sum(1 for row in rows if not row.is_read)
    return NotificationListOut(
        items=[_notification_item_out(row) for row in rows],
        meta=NotificationListMetaOut(total=len(rows), unread_count=unread_count),
    )


@router.post(
    "/me/notifications/mark-all-as-read",
    response=NotificationsMarkAllAsReadOut,
    auth=BearerAuth(),
)
def mark_all_my_notifications_as_read(request):
    current_user = get_current_user(request)
    updated_count = get_notification_service().mark_all_as_read(user_id=current_user.id)
    unread_count = get_notification_service().unread_count_for_user(current_user.id)
    return NotificationsMarkAllAsReadOut(
        meta=NotificationsMarkAllAsReadMetaOut(
            updated_count=updated_count,
            unread_count=unread_count,
        )
    )


@router.post(
    "/me/notifications/{notification_uuid}/mark-as-read",
    response=NotificationItemOutResp,
    auth=BearerAuth(),
)
def mark_one_notification_as_read(request, notification_uuid: UUID):
    current_user = get_current_user(request)
    notif = get_notification_service().mark_as_read(
        user_id=current_user.id,
        notification_uuid=notification_uuid,
    )
    if notif is None:
        raise HttpError(404, "Notification not found")
    return NotificationItemOutResp(item=_notification_item_out(notif))


@router.delete(
    "/me/notifications/{notification_uuid}",
    auth=BearerAuth(),
)
def delete_one_notification(request, notification_uuid: UUID):
    current_user = get_current_user(request)
    deleted = get_notification_service().delete_for_user(
        user_id=current_user.id,
        notification_uuid=notification_uuid,
    )
    if not deleted:
        raise HttpError(404, "Notification not found")
    return HttpResponse(status=204)
