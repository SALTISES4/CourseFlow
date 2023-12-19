from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from course_flow.management.commands.create_instances import User
from course_flow.models._common import workflow_choices
from course_flow.models.workflow import Workflow


class Favourite(models.Model):
    content_choices = {"model__in": ["project", "workflow"]}
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, limit_choices_to=content_choices
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    def save(self, *args, **kwargs):
        if self.content_object.type in workflow_choices:
            self.content_type = ContentType.objects.get_for_model(Workflow)
        super().save(*args, **kwargs)
