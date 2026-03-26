from django.db import models

from course_flow_v2.core.models.unit import Unit


class CourseMeta(models.Model):
    unit = models.OneToOneField(
        Unit,
        on_delete=models.CASCADE,
        related_name="course_meta",
    )
    classification = models.CharField(max_length=255, blank=True)
    code = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cf2_course_meta"
