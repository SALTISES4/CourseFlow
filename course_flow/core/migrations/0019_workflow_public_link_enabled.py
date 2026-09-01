from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0018_named_classification_values"),
    ]

    operations = [
        migrations.AddField(
            model_name="workflow",
            name="public_link_enabled",
            field=models.BooleanField(default=False),
        ),
    ]
