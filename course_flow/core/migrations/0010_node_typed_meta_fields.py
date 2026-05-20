# Move grid-node metadata off cf_node onto typed meta tables.

from __future__ import annotations

import django.db.models.deletion
from django.db import migrations, models


def migrate_node_inline_meta_to_typed_tables(apps, schema_editor) -> None:
    Node = apps.get_model("cf_core", "Node")
    Activitymeta = apps.get_model("cf_core", "Activitymeta")
    Taskmeta = apps.get_model("cf_core", "Taskmeta")

    for node in Node.objects.iterator():
        if node.node_type == "activity":
            Activitymeta.objects.update_or_create(
                node_id=node.id,
                defaults={
                    "context_classification": node.context_classification,
                    "task_classification": node.task_classification,
                    "time_required": node.time_required,
                    "time_units": node.time_units,
                    "represents_workflow": node.represents_workflow,
                },
            )
        elif node.node_type == "task":
            Taskmeta.objects.update_or_create(
                node_id=node.id,
                defaults={
                    "context_classification": node.context_classification,
                    "time_required": node.time_required,
                    "time_units": node.time_units,
                    "represents_workflow": node.represents_workflow,
                },
            )


def noop_reverse(apps, schema_editor) -> None:
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0009_node_linked_workflow"),
    ]

    operations = [
        migrations.AddField(
            model_name="activitymeta",
            name="context_classification",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="activitymeta",
            name="task_classification",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="activitymeta",
            name="time_required",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AddField(
            model_name="activitymeta",
            name="time_units",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="activitymeta",
            name="represents_workflow",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="taskmeta",
            name="context_classification",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="taskmeta",
            name="time_required",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AddField(
            model_name="taskmeta",
            name="time_units",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="taskmeta",
            name="represents_workflow",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(migrate_node_inline_meta_to_typed_tables, noop_reverse),
        migrations.RunPython(
            lambda apps, schema_editor: apps.get_model("cf_core", "Taskmeta")
            .objects.filter(node__isnull=True)
            .delete(),
            noop_reverse,
        ),
        migrations.RemoveField(model_name="node", name="context_classification"),
        migrations.RemoveField(model_name="node", name="task_classification"),
        migrations.RemoveField(model_name="node", name="time_required"),
        migrations.RemoveField(model_name="node", name="time_units"),
        migrations.RemoveField(model_name="node", name="represents_workflow"),
        migrations.RemoveConstraint(
            model_name="taskmeta",
            name="cf_taskmeta_workflow_xor_node",
        ),
        migrations.RemoveField(
            model_name="taskmeta",
            name="workflow",
        ),
        migrations.AlterField(
            model_name="taskmeta",
            name="node",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="taskmeta",
                to="cf_core.node",
            ),
        ),
    ]
