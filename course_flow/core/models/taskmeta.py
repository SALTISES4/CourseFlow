from typing import TYPE_CHECKING

from django.db import models

from course_flow.core.models.meta_fields import NodeTaskMetaFields
from course_flow.core.models.node import Node


class Taskmeta(NodeTaskMetaFields):
    """
    Task-layer metadata for grid nodes only (not attached to workflows).
    """

    if TYPE_CHECKING:
        node_id: int

    node = models.OneToOneField(
        Node,
        on_delete=models.CASCADE,
        related_name="taskmeta",
    )
    context = models.CharField(max_length=1024, blank=True)

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        db_table = "cf_taskmeta"
