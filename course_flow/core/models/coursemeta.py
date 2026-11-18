from typing import TYPE_CHECKING

from django.db import models

from course_flow.core.models.node import Node
from course_flow.core.models.workflow import Workflow


class Coursemeta(models.Model):
    if TYPE_CHECKING:
        id: int
        workflow_id: int | None
        node_id: int | None

    calculate_time = models.BooleanField(default=False)
    time_required_minutes = models.PositiveBigIntegerField(null=True, blank=True)
    ponderation_theory_minutes = models.PositiveBigIntegerField(null=True, blank=True)
    ponderation_practice_minutes = models.PositiveBigIntegerField(null=True, blank=True)
    ponderation_individual_minutes = models.PositiveBigIntegerField(
        null=True, blank=True
    )
    credits = models.PositiveIntegerField(null=True, blank=True)
    specific_education = models.BooleanField(default=False)
    workflow = models.OneToOneField(
        Workflow,
        on_delete=models.CASCADE,
        related_name="coursemeta",
        null=True,
        blank=True,
    )
    node = models.OneToOneField(
        Node,
        on_delete=models.CASCADE,
        related_name="coursemeta",
        null=True,
        blank=True,
    )
    classification = models.CharField(max_length=255, blank=True)
    code = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cf_coursemeta"
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(workflow__isnull=False, node__isnull=True)
                    | models.Q(workflow__isnull=True, node__isnull=False)
                ),
                name="cf_coursemeta_workflow_xor_node",
            ),
        ]
