from django.db import models

from course_flow_v2.core.models.base import UUIDModel
from course_flow_v2.core.models.channel import Channel
from course_flow_v2.core.models.outcome import Outcome
from course_flow_v2.core.models.section import Section
from course_flow_v2.core.models.thread import Thread
from course_flow_v2.core.models.unit import Unit


class Node(UUIDModel):
    section = models.ForeignKey(
        Section,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="nodes",
    )
    channel = models.ForeignKey(
        Channel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="nodes",
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="nodes",
    )
    thread = models.OneToOneField(
        Thread,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="node",
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
        db_table = "cf2_node"
