from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0002_node_type_and_meta"),
    ]

    operations = [
        migrations.AddField(
            model_name="node",
            name="title",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="node",
            name="description",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="node",
            name="context_classification",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="node",
            name="task_classification",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="node",
            name="time_required",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AddField(
            model_name="node",
            name="time_units",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="node",
            name="represents_workflow",
            field=models.BooleanField(default=False),
        ),
    ]
