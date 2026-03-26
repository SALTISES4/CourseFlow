from django.db import models

from course_flow_v2.core.models.base import TimeStampedUUIDModel
from course_flow_v2.core.models.workflow import Workflow


class Unit(TimeStampedUUIDModel):
    class UnitType(models.TextChoices):
        PROGRAM = "program", "Program"
        COURSE = "course", "Course"
        ACTIVITY = "activity", "Activity"
        TASK = "task", "Task"

    workflow = models.OneToOneField(
        Workflow,
        on_delete=models.CASCADE,
        related_name="unit",
    )
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    unit_type = models.CharField(max_length=32, choices=UnitType.choices)

    class Meta:
        db_table = "cf2_unit"
