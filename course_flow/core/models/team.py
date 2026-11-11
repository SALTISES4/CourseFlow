from typing import TYPE_CHECKING

from django.db import models

from course_flow.core.models.base import TimeStampedUUIDModel
from course_flow.core.models.project import Project


class Team(TimeStampedUUIDModel):
    if TYPE_CHECKING:
        project_id: int

    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="team",
    )

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        db_table = "cf_team"
