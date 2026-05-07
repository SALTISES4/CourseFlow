from django.db import models

from course_flow.core.models.base import UUIDModel


class Horizontaloutcome(UUIDModel):
    outcomes = models.ManyToManyField(
        "Outcome",
        through="HorizontaloutcomeOutcome",
        related_name="horizontal_groups",
        blank=True,
    )

    class Meta:
        db_table = "cf_horizontaloutcome"
