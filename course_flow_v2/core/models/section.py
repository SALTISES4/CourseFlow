from django.db import models

from course_flow_v2.core.models.base import TimeStampedUUIDModel
from course_flow_v2.core.models.graph import Graph
from course_flow_v2.core.models.thread import Thread


class Section(TimeStampedUUIDModel):
    graph = models.ForeignKey(
        Graph,
        on_delete=models.CASCADE,
        related_name="sections",
    )
    title = models.CharField(max_length=200)
    position = models.IntegerField(default=0)
    thread = models.OneToOneField(
        Thread,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="section",
    )

    class Meta:
        db_table = "cf2_section"
