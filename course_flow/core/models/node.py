from django.db import models

from course_flow.core.enum import NodeType
from course_flow.core.models.base import UUIDModel
from course_flow.core.models.channel import Channel
from course_flow.core.models.outcome import Outcome
from course_flow.core.models.section import Section
from course_flow.core.models.thread import Thread
from course_flow.core.models.workflow import Workflow

NODE_TYPE_CHOICES = [(e.value, e.name.title()) for e in NodeType]


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
        on_delete=models.CASCADE,
        related_name="node",
    )
    section_row = models.PositiveIntegerField(
        help_text="Row index within the section grid (column is channel).",
    )
    node_type = models.CharField(
        max_length=8,
        choices=NODE_TYPE_CHOICES,
        help_text=(
            "Semantic layer for this grid cell; set at creation from the "
            "parent graph workflow type and not user-editable."
        ),
    )
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    context_classification = models.IntegerField(null=True, blank=True)
    task_classification = models.IntegerField(null=True, blank=True)
    time_required = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    time_units = models.PositiveSmallIntegerField(null=True, blank=True)
    represents_workflow = models.BooleanField(default=False)
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
