from django.db import models

from course_flow_v2.core.models.workflow import Workflow


class CourseMeta(models.Model):
    workflow = models.OneToOneField(
        Workflow,
        on_delete=models.CASCADE,
        related_name="course_meta",
    )
    classification = models.CharField(max_length=255, blank=True)
    code = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cf2_course_meta"
