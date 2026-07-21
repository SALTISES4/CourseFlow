from django.db import models

from course_flow.core.models.base import TimeStampedUUIDModel
from course_flow.core.models.user import User


class Project(TimeStampedUUIDModel):
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owned_projects",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_template = models.BooleanField(default=False)
    disciplines = models.ManyToManyField(
        "Discipline",
        through="ProjectDiscipline",
        related_name="projects",
        blank=True,
    )

    class Meta:
        db_table = "cf_project"
