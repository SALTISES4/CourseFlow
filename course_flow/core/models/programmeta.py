from django.db import models

from course_flow.core.models.workflow import Workflow


class Programmeta(models.Model):
    workflow = models.OneToOneField(
        Workflow,
        on_delete=models.CASCADE,
        related_name="programmeta",
    )
    calculate_time = models.TextField(blank=True)
    calculate_credits = models.TextField(blank=True)
    calculate_ponderation = models.TextField(blank=True)
    calculate_classification = models.TextField(blank=True)
    classification_general_time = models.DurationField(null=True, blank=True)
    classification_specific_time = models.DurationField(null=True, blank=True)

    class Meta:
        db_table = "cf_programmeta"
