from django.db import models

from course_flow.core.models.workflow import Workflow


class Programmeta(models.Model):
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
    classification_general_time = models.DurationField(null=True, blank=True)
    classification_specific_time = models.DurationField(null=True, blank=True)

    class Meta:
        db_table = "cf_programmeta"
