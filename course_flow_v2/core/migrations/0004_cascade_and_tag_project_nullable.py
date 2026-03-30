# Generated manually for delete-semantics alignment (Part A).

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf2_core", "0003_node_section_row"),
    ]

    operations = [
        migrations.AlterField(
            model_name="tag",
            name="project",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="tags",
                to="cf2_core.project",
            ),
        ),
        migrations.AlterField(
            model_name="node",
            name="section",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="nodes",
                to="cf2_core.section",
            ),
        ),
        migrations.AlterField(
            model_name="node",
            name="channel",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="nodes",
                to="cf2_core.channel",
            ),
        ),
        migrations.AlterField(
            model_name="node",
            name="unit",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="nodes",
                to="cf2_core.unit",
            ),
        ),
    ]
