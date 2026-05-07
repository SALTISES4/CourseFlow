from django.db import models

from course_flow.core.models.workflow import Workflow


class Taskmeta(models.Model):
    workflow = models.OneToOneField(
        Workflow,
        on_delete=models.CASCADE,
        related_name="taskmeta",
    )
    context = models.CharField(max_length=1024, blank=True)

    class Meta:
        db_table = "cf_taskmeta"
