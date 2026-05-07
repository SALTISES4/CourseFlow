from django.db import models

from course_flow.core.models.workflow import Workflow


class Coursemeta(models.Model):
    workflow = models.OneToOneField(
        Workflow,
        on_delete=models.CASCADE,
        related_name="coursemeta",
    )
    classification = models.CharField(max_length=255, blank=True)
    code = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cf_coursemeta"
