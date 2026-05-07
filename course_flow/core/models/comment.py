from django.db import models

from course_flow.core.models.base import TimeStampedUUIDModel
from course_flow.core.models.thread import Thread
from course_flow.core.models.user import User


class Comment(TimeStampedUUIDModel):
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    thread = models.ForeignKey(
        Thread,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    body = models.TextField()

    class Meta:
        db_table = "cf_comment"
