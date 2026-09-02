from django.db import models

from course_flow.core.models.base import UUIDModel
from course_flow.core.models.user import User


class Notification(UUIDModel):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    # New system notifications carry semantic data for client-side localization.
    # ``legacy_message`` exists only for rows created before this contract.
    message_code = models.CharField(max_length=128, null=True, blank=True)
    message_params = models.JSONField(default=dict, blank=True)
    legacy_message = models.CharField(max_length=1024, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cf_notification"
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(message_code__isnull=False, legacy_message__isnull=True)
                    | models.Q(message_code__isnull=True, legacy_message__isnull=False)
                ),
                name="cf_notification_message_code_xor_legacy",
            )
        ]
