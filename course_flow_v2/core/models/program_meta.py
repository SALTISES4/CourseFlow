from django.db import models

from course_flow_v2.core.models.unit import Unit


class ProgramMeta(models.Model):
    unit = models.OneToOneField(
        Unit,
        on_delete=models.CASCADE,
        related_name="program_meta",
    )
    calculate_time = models.TextField(blank=True)
    calculate_credits = models.TextField(blank=True)
    calculate_ponderation = models.TextField(blank=True)
    calculate_classification = models.TextField(blank=True)
    classification_general_time = models.DurationField(null=True, blank=True)
    classification_specific_time = models.DurationField(null=True, blank=True)

    class Meta:
        db_table = "cf2_program_meta"
