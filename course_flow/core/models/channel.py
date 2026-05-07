from django.db import models

from course_flow.core.models.base import TimeStampedUUIDModel
from course_flow.core.models.graph import Graph
from course_flow.core.models.thread import Thread


class Channel(TimeStampedUUIDModel):
    graph = models.ForeignKey(
        Graph,
        on_delete=models.CASCADE,
        related_name="channels",
    )
    title = models.CharField(max_length=200)
    position = models.IntegerField(default=0)
    thread = models.OneToOneField(
        Thread,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="channel",
    )

    class Meta:
        db_table = "cf_channel"
