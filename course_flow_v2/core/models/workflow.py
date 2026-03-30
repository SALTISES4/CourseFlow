from django.db import models

from course_flow_v2.core.models.base import TimeStampedUUIDModel
from course_flow_v2.core.models.project import Project
from course_flow_v2.core.models.user import User


class Workflow(TimeStampedUUIDModel):
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owned_workflows",
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="workflows",
    )
    title = models.CharField(max_length=200)
    revision_id = models.PositiveIntegerField(
        default=0,
        help_text="Monotonic graph revision; incremented on graph-affecting mutations only.",
    )

    class Meta:
        db_table = "cf2_workflow"
