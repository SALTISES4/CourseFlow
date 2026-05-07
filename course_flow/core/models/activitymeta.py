from django.db import models

from course_flow.core.models.workflow import Workflow


class Activitymeta(models.Model):
    workflow = models.OneToOneField(
        Workflow,
        on_delete=models.CASCADE,
        related_name="activitymeta",
    )
    context = models.CharField(max_length=1024, blank=True)
    classification = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cf_activitymeta"
