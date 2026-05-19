# Generated manually for node layering (type + typed meta on nodes).

from __future__ import annotations

import django.db.models.deletion
from django.db import migrations, models

WORKFLOW_TO_NODE_TYPE = {
    "program": "course",
    "course": "activity",
    "activity": "task",
    "task": "task",
}


def backfill_node_types(apps, schema_editor) -> None:
    Node = apps.get_model("cf_core", "Node")
    Graph = apps.get_model("cf_core", "Graph")
    for node in Node.objects.select_related("section").iterator():
        graph = Graph.objects.select_related("workflow").get(pk=node.section.graph_id)
        node.node_type = WORKFLOW_TO_NODE_TYPE.get(
            graph.workflow.workflow_type, "course"
        )
        node.save(update_fields=["node_type"])


def noop_reverse(apps, schema_editor) -> None:
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="node",
            name="node_type",
            field=models.CharField(
                choices=[
                    ("course", "Course"),
                    ("activity", "Activity"),
                    ("task", "Task"),
                ],
                default="course",
                help_text=(
                    "Semantic layer for this grid cell; set at creation from the "
                    "parent graph workflow type and not user-editable."
                ),
                max_length=8,
            ),
            preserve_default=False,
        ),
        migrations.RunPython(backfill_node_types, noop_reverse),
        migrations.AlterField(
            model_name="activitymeta",
            name="workflow",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="activitymeta",
                to="cf_core.workflow",
            ),
        ),
        migrations.AddField(
            model_name="activitymeta",
            name="node",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="activitymeta",
                to="cf_core.node",
            ),
        ),
        migrations.AddConstraint(
            model_name="activitymeta",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    ("workflow__isnull", False),
                    ("node__isnull", True),
                )
                | models.Q(
                    ("workflow__isnull", True),
                    ("node__isnull", False),
                ),
                name="cf_activitymeta_workflow_xor_node",
            ),
        ),
        migrations.AlterField(
            model_name="coursemeta",
            name="workflow",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="coursemeta",
                to="cf_core.workflow",
            ),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="node",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="coursemeta",
                to="cf_core.node",
            ),
        ),
        migrations.AddConstraint(
            model_name="coursemeta",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    ("workflow__isnull", False),
                    ("node__isnull", True),
                )
                | models.Q(
                    ("workflow__isnull", True),
                    ("node__isnull", False),
                ),
                name="cf_coursemeta_workflow_xor_node",
            ),
        ),
        migrations.AlterField(
            model_name="taskmeta",
            name="workflow",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="taskmeta",
                to="cf_core.workflow",
            ),
        ),
        migrations.AddField(
            model_name="taskmeta",
            name="node",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="taskmeta",
                to="cf_core.node",
            ),
        ),
        migrations.AddConstraint(
            model_name="taskmeta",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    ("workflow__isnull", False),
                    ("node__isnull", True),
                )
                | models.Q(
                    ("workflow__isnull", True),
                    ("node__isnull", False),
                ),
                name="cf_taskmeta_workflow_xor_node",
            ),
        ),
    ]
