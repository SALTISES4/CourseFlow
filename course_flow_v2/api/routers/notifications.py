"""
Authenticated notification resource routes (current user's inbox).

Mounted under the same ``/user`` prefix as ``users.router`` so URLs stay
``/api/user/me/notifications`` and match the generated OpenAPI client.

List GET accepts ``page`` and ``page_size`` query parameters (**1-based** ``page``);
see ``NotificationService.list_page_for_user``.
"""

from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.deps import get_notification_service
from course_flow_v2.api.schemas.notifications import (
    NotificationItemOut,
    NotificationItemOutResp,
    NotificationListMetaOut,
    NotificationListOut,
    NotificationsMarkAllAsReadMetaOut,
    NotificationsMarkAllAsReadOut,
)
from course_flow_v2.application.services.notification_service import (
    DEFAULT_NOTIFICATION_PAGE_SIZE,
)
from course_flow_v2.core.models import Notification

router = Router(tags=["notifications"])


def _notification_item_out(notification: Notification) -> NotificationItemOut:
    return NotificationItemOut(
        uuid=notification.uuid,
        message=notification.message,
        is_read=notification.is_read,
        date_created=notification.date_created,
    )


def _ensure_owner(*, notification: Notification, user_id: int) -> None:
    if notification.user_id != user_id:
        raise HttpError(403, "You may not access this notification.")


@router.get(
    "/me/notifications",
    response=NotificationListOut,
    auth=BearerAuth(),
    operation_id="listMyNotifications",
)
def list_my_notifications(
    request,
    page: int = 1,
    page_size: int = DEFAULT_NOTIFICATION_PAGE_SIZE,
):
    current_user = get_current_user(request)
    try:
        result = get_notification_service().list_page_for_user(
            user_id=current_user.id,
            page=page,
            page_size=page_size,
        )
    except ValueError as exc:
        raise HttpError(422, str(exc)) from exc
    return NotificationListOut(
        items=[_notification_item_out(row) for row in result.items],
        meta=NotificationListMetaOut(
            total=result.total,
            unread_count=result.unread_count,
            total_pages=result.total_pages,
            current_page=result.current_page,
            page_size=result.page_size,
        ),
    )


@router.post(
    "/me/notifications/mark-all-as-read",
    response=NotificationsMarkAllAsReadOut,
    auth=BearerAuth(),
    operation_id="markAllMyNotificationsAsRead",
)
def mark_all_my_notifications_as_read(request):
    current_user = get_current_user(request)
    svc = get_notification_service()
    updated_count = svc.mark_all_as_read(user_id=current_user.id)
    unread_count = svc.unread_count_for_user(current_user.id)
    return NotificationsMarkAllAsReadOut(
        meta=NotificationsMarkAllAsReadMetaOut(
            updated_count=updated_count,
            unread_count=unread_count,
        )
    )


@router.post(
    "/me/notifications/{uuid}/mark-as-read",
    response=NotificationItemOutResp,
    auth=BearerAuth(),
    operation_id="markOneNotificationAsRead",
)
def mark_one_notification_as_read(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_notification_service()
    notif = svc.get_by_uuid(uuid)
    if notif is None:
        raise HttpError(404, "Notification not found")
    _ensure_owner(notification=notif, user_id=current_user.id)
    notif = svc.mark_notification_read(notif)
    return NotificationItemOutResp(item=_notification_item_out(notif))


@router.delete(
    "/me/notifications/{uuid}",
    auth=BearerAuth(),
    operation_id="deleteOneNotification",
    response={204: None},
)
def delete_one_notification(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_notification_service()
    notif = svc.get_by_uuid(uuid)
    if notif is None:
        raise HttpError(404, "Notification not found")
    _ensure_owner(notification=notif, user_id=current_user.id)
    svc.delete_notification(notif)
    return 204
