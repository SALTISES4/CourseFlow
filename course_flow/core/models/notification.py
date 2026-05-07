from django.db import models

from course_flow.core.models.base import UUIDModel
from course_flow.core.models.user import User


class Notification(UUIDModel):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    message = models.CharField(max_length=1024)
    is_read = models.BooleanField(default=False)
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cf_notification"
