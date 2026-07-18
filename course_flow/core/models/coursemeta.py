from django.db import models

from course_flow.core.models.node import Node
from course_flow.core.models.workflow import Workflow


class Coursemeta(models.Model):
    calculate_time = models.BooleanField(default=False)
    time_required = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    time_units = models.PositiveSmallIntegerField(null=True, blank=True)
    ponderation_theory = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    ponderation_practice = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    ponderation_individual = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    credits = models.PositiveIntegerField(null=True, blank=True)
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
