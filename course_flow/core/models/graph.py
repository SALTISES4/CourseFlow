from django.db import models

from course_flow.core.models.base import TimeStampedUUIDModel


class Graph(TimeStampedUUIDModel):
    revision_id = models.PositiveIntegerField(
        default=0,
        help_text="Monotonic graph revision; incremented on graph-affecting mutations only.",
    )

    class Meta:
        db_table = "cf_graph"
