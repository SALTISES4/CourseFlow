from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from course_flow.models.common import workflow_choices

from .workflow import Workflow

User = get_user_model()

content_choices = {"model__in": ["project", "workflow"]}


class Favourite(models.Model):
    object_id = models.PositiveIntegerField()

    #########################################################
    # RELATIONS
    #########################################################
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, limit_choices_to=content_choices
    )

    content_object = GenericForeignKey("content_type", "object_id")

    #########################################################
    # MODEL METHODS / GETTERS
    #########################################################

    def save(self, *args, **kwargs):
        if self.content_object.type in workflow_choices:
            self.content_type = ContentType.objects.get_for_model(Workflow)
        super().save(*args, **kwargs)
