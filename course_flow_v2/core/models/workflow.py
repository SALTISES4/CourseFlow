from django.db import models

from course_flow_v2.core.models.base import TimeStampedUUIDModel
from course_flow_v2.core.models.graph import Graph


class Workflow(TimeStampedUUIDModel):
    class WorkflowType(models.TextChoices):
        PROGRAM = "program", "Program"
        COURSE = "course", "Course"
        ACTIVITY = "activity", "Activity"
        TASK = "task", "Task"

    graph = models.OneToOneField(
        Graph,
        on_delete=models.CASCADE,
        related_name="workflow",
    )
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    workflow_type = models.CharField(max_length=32, choices=WorkflowType.choices)

    class Meta:
        db_table = "cf2_workflow"
