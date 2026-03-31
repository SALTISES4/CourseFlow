from uuid import UUID

from course_flow_v2.core.models import Notification


class NotificationService:
    def list_for_user(self, user_id: int) -> list[Notification]:
        return list(
            Notification.objects.filter(user_id=user_id).order_by("-date_created", "-id")
        )

    def unread_count_for_user(self, user_id: int) -> int:
        return Notification.objects.filter(user_id=user_id, is_read=False).count()

    def mark_as_read(self, *, user_id: int, notification_uuid: UUID) -> Notification | None:
        notif = Notification.objects.filter(
            user_id=user_id, uuid=notification_uuid
        ).first()
        if notif is None:
            return None
        if not notif.is_read:
            notif.is_read = True
            notif.save(update_fields=["is_read"])
        return notif

    def mark_all_as_read(self, *, user_id: int) -> int:
        return Notification.objects.filter(user_id=user_id, is_read=False).update(is_read=True)

    def delete_for_user(self, *, user_id: int, notification_uuid: UUID) -> bool:
        deleted_count, _ = Notification.objects.filter(
            user_id=user_id, uuid=notification_uuid
        ).delete()
        return deleted_count > 0
