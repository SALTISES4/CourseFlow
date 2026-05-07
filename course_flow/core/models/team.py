from django.db import models

from course_flow.core.models.base import TimeStampedUUIDModel
from course_flow.core.models.project import Project


class Team(TimeStampedUUIDModel):
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="team",
    )

    class Meta:
        db_table = "cf_project_team"
