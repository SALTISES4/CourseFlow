from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.management.commands.create_instances import User
from course_flow.models.comment import Comment


class Notification(models.Model):
    class Meta:
        ordering = ["-created_on"]

    content_choices = {"model__in": ["project", "workflow"]}
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    source_user = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="sent_notifications",
    )
    TYPE_SHARED = 0
    TYPE_COMMENT = 1
    TYPE_CHOICES = (
        (TYPE_SHARED, _("Shared")),
        (TYPE_COMMENT, _("Comment")),
    )
    notification_type = models.PositiveIntegerField(
        choices=TYPE_CHOICES, default=TYPE_SHARED
    )
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, limit_choices_to=content_choices
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    text = models.TextField(
        blank=True,
        null=True,
    )

    created_on = models.DateTimeField(default=timezone.now)
    is_unread = models.BooleanField(default=True)

    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
    )
