from django.db import models

from course_flow.core.models.base import UUIDModel
from course_flow.core.models.graph import Graph
from course_flow.core.models.thread import Thread


class Outcome(UUIDModel):
    graph = models.ForeignKey(
        Graph,
        on_delete=models.CASCADE,
        related_name="outcomes",
    )
    thread = models.OneToOneField(
        Thread,
        on_delete=models.PROTECT,
        related_name="outcome",
    )
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,  # or PROTECT / SET_NULL — product decision
        related_name="children",
    )
    order = models.PositiveIntegerField(default=0)
    tags = models.ManyToManyField(
        "Tag",
        through="OutcomeTag",
        related_name="outcomes",
        blank=True,
    )

    class Meta:
        db_table = "cf_outcome"
        constraints = [
            # i don't think we're properly handling root order uniqueness here
            models.UniqueConstraint(
                fields=["parent", "order"],
                condition=models.Q(parent__isnull=False),
                name="cf_outcome_parent_sibling_order_unique",
            )
        ]
