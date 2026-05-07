from django.db import models

from course_flow.core.models.base import UUIDModel


class Horizontaloutcome(UUIDModel):
    outcomes = models.ManyToManyField(
        "Outcome",
        through="HorizontaloutcomeOutcome",
        related_name="horizontal_groups", # not sure about this name
        blank=True,
    )

    class Meta:
        db_table = "cf_horizontaloutcome"
