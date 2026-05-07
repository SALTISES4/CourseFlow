from django.db import models

from course_flow.core.models.base import UUIDModel
from course_flow.core.models.channel import Channel
from course_flow.core.models.outcome import Outcome
from course_flow.core.models.section import Section
from course_flow.core.models.thread import Thread
from course_flow.core.models.workflow import Workflow


class Node(UUIDModel):
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name="nodes",
    )
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name="nodes",
    )
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="nodes",
    )
    thread = models.OneToOneField(
        Thread,
        on_delete=models.SET_NULL,
        related_name="node",
    )
    section_row = models.PositiveIntegerField(
        help_text="Row index within the section grid (column is channel).",
    )
    outcomes = models.ManyToManyField(
        Outcome,
        through="NodeOutcome",
        related_name="nodes",
        blank=True,
    )
    tags = models.ManyToManyField(
        "Tag",
        through="NodeTag",
        related_name="nodes",
        blank=True,
    )

    class Meta:
        db_table = "cf_node"
