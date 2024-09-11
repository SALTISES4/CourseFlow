from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .comment import Comment

User = get_user_model()

content_choices = {"model__in": ["project", "workflow"]}


def type_choices():
    TYPE_SHARED = 0
    TYPE_COMMENT = 1
    return (
        (TYPE_SHARED, _("Shared")),
        (TYPE_COMMENT, _("Comment")),
    )


class Notification(models.Model):
    created_on = models.DateTimeField(default=timezone.now)

    object_id = models.PositiveIntegerField()

    text = models.TextField(
        blank=True,
        null=True,
    )

    is_unread = models.BooleanField(default=True)

    notification_type = models.PositiveIntegerField(
        choices=type_choices(), default=0
    )

    #########################################################
    # RELATIONS
    #########################################################
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

    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, limit_choices_to=content_choices
    )

    content_object = GenericForeignKey("content_type", "object_id")

    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
    )

    #########################################################
    # META
    #########################################################
    class Meta:
        ordering = ["-created_on"]
