from typing import TYPE_CHECKING

from django.db import models

from course_flow.core.models.workflow import Workflow


class Programmeta(models.Model):
    if TYPE_CHECKING:
        id: int
        workflow_id: int

    code = models.CharField(max_length=255, blank=True)
    workflow = models.OneToOneField(
        Workflow,
        on_delete=models.CASCADE,
        related_name="programmeta",
    )
    calculate_time = models.TextField(blank=True)
    calculate_credits = models.TextField(blank=True)
    calculate_ponderation = models.TextField(blank=True)
    calculate_classification = models.TextField(blank=True)
    time_required_minutes = models.PositiveBigIntegerField(null=True, blank=True)
    ponderation_theory_minutes = models.PositiveBigIntegerField(null=True, blank=True)
    ponderation_practice_minutes = models.PositiveBigIntegerField(null=True, blank=True)
    ponderation_individual_minutes = models.PositiveBigIntegerField(
        null=True, blank=True
    )
    credits = models.PositiveIntegerField(null=True, blank=True)
    classification_general_minutes = models.PositiveBigIntegerField(
        null=True, blank=True
    )
    classification_specific_minutes = models.PositiveBigIntegerField(
        null=True, blank=True
    )

    class Meta:
        db_table = "cf_programmeta"
