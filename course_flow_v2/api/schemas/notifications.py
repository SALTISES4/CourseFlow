from datetime import datetime
from uuid import UUID

from ninja import Schema


class NotificationItemOut(Schema):
    uuid: UUID
    message: str
    is_read: bool
    date_created: datetime


class NotificationItemOutResp(Schema):
    item: NotificationItemOut


class NotificationListMetaOut(Schema):
    """List metadata for a paginated inbox (``page`` and ``current_page`` are 1-based)."""

    total: int
    unread_count: int
    total_pages: int
    current_page: int
    page_size: int


class NotificationListOut(Schema):
    items: list[NotificationItemOut]
    meta: NotificationListMetaOut


class NotificationsMarkAllAsReadMetaOut(Schema):
    updated_count: int
    unread_count: int


class NotificationsMarkAllAsReadOut(Schema):
    meta: NotificationsMarkAllAsReadMetaOut
