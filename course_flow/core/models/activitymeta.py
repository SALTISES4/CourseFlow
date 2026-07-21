from django.db import models

from course_flow.core.models.meta_fields import NodeActivityMetaFields
from course_flow.core.models.node import Node
from course_flow.core.models.workflow import Workflow


class Activitymeta(NodeActivityMetaFields):
    calculate_time = models.BooleanField(default=False)
    workflow = models.OneToOneField(
        Workflow,
        on_delete=models.CASCADE,
        related_name="activitymeta",
        null=True,
        blank=True,
    )
    node = models.OneToOneField(
        Node,
        on_delete=models.CASCADE,
        related_name="activitymeta",
        null=True,
        blank=True,
    )
    context = models.CharField(max_length=1024, blank=True)
    classification = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cf_activitymeta"
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(workflow__isnull=False, node__isnull=True)
                    | models.Q(workflow__isnull=True, node__isnull=False)
                ),
                name="cf_activitymeta_workflow_xor_node",
            ),
        ]
