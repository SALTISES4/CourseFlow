from django.db import models
from django.utils import timezone

from ._common import title_max_length


class UpdateNotification(models.Model):
    title = models.CharField(
        max_length=title_max_length, null=True, blank=True
    )
    created_on = models.DateTimeField(default=timezone.now)

    def __str__(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return "Untitled Update Notification"
