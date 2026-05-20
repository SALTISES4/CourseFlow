from django.db import models

from course_flow.core.models.node import Node


class Edge(models.Model):
    source_node = models.ForeignKey(
        Node,
        on_delete=models.CASCADE,
        related_name="outgoing_edges",
    )
    target_node = models.ForeignKey(
        Node,
        on_delete=models.CASCADE,
        related_name="incoming_edges",
    )
    title = models.CharField(max_length=255, blank=True, default="")
    text_position = models.PositiveSmallIntegerField(default=50)
    line_type = models.CharField(max_length=64, blank=True)
    source_port = models.CharField(max_length=64)
    target_port = models.CharField(max_length=64)

    class Meta:
        db_table = "cf_edge"
