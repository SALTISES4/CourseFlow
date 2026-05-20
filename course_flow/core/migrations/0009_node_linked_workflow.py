import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0008_channel_colour"),
    ]

    operations = [
        migrations.AddField(
            model_name="node",
            name="linked_workflow",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="nodes_linked_from",
                to="cf_core.workflow",
            ),
        ),
    ]
