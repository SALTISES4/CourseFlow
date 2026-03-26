from django.db import models

from course_flow_v2.core.models.base import TimeStampedUUIDModel
from course_flow_v2.core.models.project import Project


class ProjectTeam(TimeStampedUUIDModel):
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="team",
    )

    class Meta:
        db_table = "cf2_project_team"
