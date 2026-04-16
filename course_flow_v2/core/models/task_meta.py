from django.db import models

from course_flow_v2.core.models.workflow import Workflow


class TaskMeta(models.Model):
    workflow = models.OneToOneField(
        Workflow,
        on_delete=models.CASCADE,
        related_name="task_meta",
    )
    context = models.CharField(max_length=1024, blank=True)

    class Meta:
        db_table = "cf2_task_meta"
