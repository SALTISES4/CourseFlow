from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0014_workflow_overview_metadata"),
    ]

    operations = [
        migrations.AddField(
            model_name="coursemeta",
            name="specific_education",
            field=models.BooleanField(default=False),
        ),
    ]
