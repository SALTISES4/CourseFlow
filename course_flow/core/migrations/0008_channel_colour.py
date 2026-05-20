from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0007_edge_required_ports"),
    ]

    operations = [
        migrations.AddField(
            model_name="channel",
            name="colour",
            field=models.CharField(blank=True, default="", max_length=7),
        ),
    ]
