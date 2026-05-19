from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        (
            "cf_core",
            "0004_remove_activitymeta_cf_activitymeta_workflow_xor_node_and_more",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="outcome",
            name="title",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="outcome",
            name="description",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="outcome",
            name="code",
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AddConstraint(
            model_name="outcome",
            constraint=models.UniqueConstraint(
                condition=models.Q(("parent__isnull", True)),
                fields=("graph", "order"),
                name="cf_outcome_root_sibling_order_unique",
            ),
        ),
    ]
