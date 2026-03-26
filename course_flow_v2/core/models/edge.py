from django.db import models

from course_flow_v2.core.models.node import Node


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
    line_type = models.CharField(max_length=64, blank=True)
    source_port = models.CharField(max_length=64, blank=True)
    target_port = models.CharField(max_length=64, blank=True)

    class Meta:
        db_table = "cf2_edge"
