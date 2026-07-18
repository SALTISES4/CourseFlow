from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0013_resource_archive_state_and_account_roles"),
    ]

    operations = [
        migrations.AddField(
            model_name="activitymeta",
            name="calculate_time",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="calculate_time",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="credits",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="ponderation_individual",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="ponderation_practice",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="ponderation_theory",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="time_required",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="time_units",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="code",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="credits",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="ponderation_individual",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="ponderation_practice",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="ponderation_theory",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="time_required",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="time_units",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
    ]
