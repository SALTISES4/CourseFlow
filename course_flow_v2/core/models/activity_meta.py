from django.db import models

from course_flow_v2.core.models.workflow import Workflow


class ActivityMeta(models.Model):
    workflow = models.OneToOneField(
        Workflow,
        on_delete=models.CASCADE,
        related_name="activity_meta",
    )
    context = models.CharField(max_length=1024, blank=True)
    classification = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cf2_activity_meta"
