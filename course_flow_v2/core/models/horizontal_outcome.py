from django.db import models

from course_flow_v2.core.models.base import UUIDModel


class HorizontalOutcome(UUIDModel):
    outcomes = models.ManyToManyField(
        "Outcome",
        through="HorizontalOutcomeOutcome",
        related_name="horizontal_groups",
        blank=True,
    )

    class Meta:
        db_table = "cf2_horizontal_outcome"
