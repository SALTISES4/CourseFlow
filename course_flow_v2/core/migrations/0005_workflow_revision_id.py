# Generated manually for graph revision tracking.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf2_core", "0004_cascade_and_tag_project_nullable"),
    ]

    operations = [
        migrations.AddField(
            model_name="graph",
            name="revision_id",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Monotonic graph revision; incremented on graph-affecting mutations only.",
            ),
        ),
    ]
