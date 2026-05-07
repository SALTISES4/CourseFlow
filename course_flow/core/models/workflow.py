from django.db import models

from course_flow.core.enum import WorkflowType
from course_flow.core.models import User
from course_flow.core.models.base import TimeStampedUUIDModel
from course_flow.core.models.graph import Graph

WORKFLOW_TYPE_CHOICES = [(e.value, e.name.title()) for e in WorkflowType]


class Workflow(TimeStampedUUIDModel):
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="created_graphs",
    )
    graph = models.OneToOneField(
        Graph,
        on_delete=models.CASCADE,
        related_name="workflow",
    )
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    workflow_type = models.CharField(
        max_length=8,
        choices=WORKFLOW_TYPE_CHOICES,
    )

    class Meta:
        db_table = "cf_workflow"
