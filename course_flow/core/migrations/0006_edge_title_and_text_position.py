from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0005_outcome_metadata_and_root_order"),
    ]

    operations = [
        migrations.AddField(
            model_name="edge",
            name="title",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="edge",
            name="text_position",
            field=models.PositiveSmallIntegerField(default=50),
        ),
    ]
