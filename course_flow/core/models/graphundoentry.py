from django.db import models

from course_flow.core.models.graph import Graph
from course_flow.core.models.user import User


class GraphUndoKind(models.TextChoices):
    DELETE_CREATED_EDGE = "delete_created_edge", "Delete created edge"
    RECREATE_DELETED_EDGE = "recreate_deleted_edge", "Recreate deleted edge"


class GraphUndoEntry(models.Model):
    """The single server-authored compensating action available for a graph."""

    graph = models.OneToOneField(
        Graph,
        on_delete=models.CASCADE,
        related_name="undo_entry",
    )
    actor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="graph_undo_entries",
    )
    kind = models.CharField(max_length=64, choices=GraphUndoKind.choices)
    schema_version = models.PositiveSmallIntegerField(default=1)
    payload = models.JSONField()
    date_created = models.DateTimeField(auto_now_add=True)
    modified_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cf_graph_undo_entry"
