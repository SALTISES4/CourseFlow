from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0015_coursemeta_specific_education"),
    ]

    operations = [
        migrations.AddField(
            model_name="taskmeta",
            name="task_classification",
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
