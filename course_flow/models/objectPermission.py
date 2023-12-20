from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models._common import User, workflow_choices

from .workflow import Workflow


class ObjectPermission(models.Model):
    content_choices = {"model__in": ["project", "workflow"]}
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, limit_choices_to=content_choices
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    PERMISSION_NONE = 0
    PERMISSION_VIEW = 1
    PERMISSION_EDIT = 2
    PERMISSION_COMMENT = 3
    PERMISSION_STUDENT = 4
    PERMISSION_CHOICES = (
        (PERMISSION_NONE, _("None")),
        (PERMISSION_VIEW, _("View")),
        (PERMISSION_EDIT, _("Edit")),
        (PERMISSION_COMMENT, _("Comment")),
        (PERMISSION_STUDENT, _("Student")),
    )
    permission_type = models.PositiveIntegerField(
        choices=PERMISSION_CHOICES, default=PERMISSION_NONE
    )

    last_viewed = models.DateTimeField(default=timezone.now)

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
