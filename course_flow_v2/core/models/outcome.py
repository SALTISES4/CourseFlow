from django.db import models

from course_flow_v2.core.models.base import UUIDModel
from course_flow_v2.core.models.thread import Thread
from course_flow_v2.core.models.workflow import Workflow


class Outcome(UUIDModel):
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="outcomes",
    )
    thread = models.OneToOneField(
        Thread,
        on_delete=models.PROTECT,
        related_name="outcome",
    )
    parent_outcomes = models.ManyToManyField(
        "self",
        through="OutcomeOutcome",
        symmetrical=False,
        related_name="child_outcomes",
        through_fields=("from_outcome", "to_outcome"),
    )
    tags = models.ManyToManyField(
        "Tag",
        through="OutcomeTag",
        related_name="outcomes",
        blank=True,
    )

    class Meta:
        db_table = "cf2_outcome"
