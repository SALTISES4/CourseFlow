from django.db import models

from course_flow_v2.core.models.unit import Unit


class ActivityMeta(models.Model):
    unit = models.OneToOneField(
        Unit,
        on_delete=models.CASCADE,
        related_name="activity_meta",
    )
    context = models.CharField(max_length=1024, blank=True)
    classification = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cf2_activity_meta"
