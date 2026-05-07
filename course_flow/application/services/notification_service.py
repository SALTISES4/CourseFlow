from dataclasses import dataclass
from uuid import UUID

from course_flow.core.models import Notification

DEFAULT_NOTIFICATION_PAGE_SIZE = 10
MAX_NOTIFICATION_PAGE_SIZE = 100


@dataclass(frozen=True)
class NotificationListPage:
    """One page of notifications plus list-level metadata (server-side pagination)."""

    items: list[Notification]
    total: int
    total_pages: int
    current_page: int
    page_size: int
    unread_count: int


class NotificationService:
    def list_page_for_user(
        self,
        *,
        user_id: int,
        page: int,
        page_size: int,
    ) -> NotificationListPage:
        """
        Paginated inbox for one user. Page numbers are **1-based**.

        If ``page`` is greater than the last page while ``total > 0``, it is
        clamped to ``total_pages`` so callers always receive a valid slice and
        ``meta.current_page`` matches the rows returned.
        """
        if page < 1:
            raise ValueError("page must be >= 1")
        if page_size < 1 or page_size > MAX_NOTIFICATION_PAGE_SIZE:
            raise ValueError(
                f"page_size must be between 1 and {MAX_NOTIFICATION_PAGE_SIZE}"
            )

        base = Notification.objects.filter(user_id=user_id).order_by(
            "-date_created", "-id"
        )
        total = base.count()
        unread_count = Notification.objects.filter(
            user_id=user_id, is_read=False
        ).count()

        if total == 0:
            return NotificationListPage(
                items=[],
                total=0,
                total_pages=0,
                current_page=1,
                page_size=page_size,
                unread_count=unread_count,
            )

        total_pages = (total + page_size - 1) // page_size
        effective_page = min(max(1, page), total_pages)
        offset = (effective_page - 1) * page_size
        items = list(base[offset : offset + page_size])

        return NotificationListPage(
            items=items,
            total=total,
            total_pages=total_pages,
            current_page=effective_page,
            page_size=page_size,
            unread_count=unread_count,
        )

    def unread_count_for_user(self, user_id: int) -> int:
        return Notification.objects.filter(user_id=user_id, is_read=False).count()

    def get_by_uuid(self, uuid: UUID) -> Notification | None:
        return Notification.objects.filter(uuid=uuid).first()

    def mark_notification_read(self, notification: Notification) -> Notification:
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])
        return notification

    def delete_notification(self, notification: Notification) -> None:
        notification.delete()

    def mark_all_as_read(self, *, user_id: int) -> int:
        return Notification.objects.filter(user_id=user_id, is_read=False).update(
            is_read=True
        )
