from enum import Enum

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models.common import User, workflow_choices

from .workflow import Workflow


class Permission(Enum):
    PERMISSION_NONE = 0
    PERMISSION_VIEW = 1
    PERMISSION_EDIT = 2
    PERMISSION_COMMENT = 3
    PERMISSION_STUDENT = 4


def permission_choices():
    return (
        (Permission.PERMISSION_NONE.value, _("None")),
        (Permission.PERMISSION_VIEW.value, _("View")),
        (Permission.PERMISSION_EDIT.value, _("Edit")),
        (Permission.PERMISSION_COMMENT.value, _("Comment")),
        (Permission.PERMISSION_STUDENT.value, _("Student")),
    )


class ObjectPermission(models.Model):
    #########################################################
    # FIELDS
    #########################################################
    content_choices = {"model__in": ["project", "workflow"]}

    object_id = models.PositiveIntegerField()

    permission_type = models.PositiveIntegerField(
        choices=permission_choices(), default=0
    )
    last_viewed = models.DateTimeField(default=timezone.now)

    #########################################################
    # RELATIONS
    #########################################################
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    content_object = GenericForeignKey("content_type", "object_id")

    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, limit_choices_to=content_choices
    )

    #########################################################
    # MODEL METHODS / GETTERS
    #########################################################
    def update_last_viewed(user, view_object):
        ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(view_object),
            object_id=view_object.id,
        ).update(last_viewed=timezone.now())

    def save(self, *args, **kwargs):
        if self.content_object.type in workflow_choices:
            self.content_type = ContentType.objects.get_for_model(Workflow)
        super().save(*args, **kwargs)
