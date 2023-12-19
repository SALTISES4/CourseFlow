from django.db import models
from django.utils import timezone

from course_flow.management.commands.create_instances import User


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    text = models.TextField(
        blank=False,
    )
    created_on = models.DateTimeField(default=timezone.now)
