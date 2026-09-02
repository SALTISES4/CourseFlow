from datetime import datetime
from typing import Any
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema


class NotificationItemOut(CamelSchema):
    uuid: UUID
    message_code: str | None
    message_params: dict[str, Any]
    legacy_message: str | None
    is_read: bool
    date_created: datetime


class NotificationItemOutResp(CamelSchema):
    item: NotificationItemOut


class NotificationListMetaOut(CamelSchema):
    """
    List metadata for a paginated inbox (``page`` and ``current_page`` are 1-based).
    """

    total: int
    unread_count: int
    total_pages: int
    current_page: int
    page_size: int


class NotificationListOut(CamelSchema):
    items: list[NotificationItemOut]
    meta: NotificationListMetaOut


class NotificationsMarkAllAsReadMetaOut(CamelSchema):
    updated_count: int
    unread_count: int


class NotificationsMarkAllAsReadOut(CamelSchema):
    meta: NotificationsMarkAllAsReadMetaOut
