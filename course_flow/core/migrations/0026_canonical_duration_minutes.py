from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Replace legacy value-plus-unit duration storage with canonical integer minutes.

    CourseFlow environments are rebuilt from snapshots, so this is deliberately a
    schema-only migration. Existing values are not converted.
    """

    dependencies = [
        ("cf_core", "0025_password_reset_attempt"),
    ]

    operations = [
        migrations.RemoveField(model_name="activitymeta", name="time_required"),
        migrations.RemoveField(model_name="activitymeta", name="time_units"),
        migrations.RemoveField(model_name="taskmeta", name="time_required"),
        migrations.RemoveField(model_name="taskmeta", name="time_units"),
        migrations.RemoveField(model_name="coursemeta", name="time_required"),
        migrations.RemoveField(model_name="coursemeta", name="time_units"),
        migrations.RemoveField(model_name="coursemeta", name="ponderation_theory"),
        migrations.RemoveField(model_name="coursemeta", name="ponderation_practice"),
        migrations.RemoveField(model_name="coursemeta", name="ponderation_individual"),
        migrations.RemoveField(model_name="programmeta", name="time_required"),
        migrations.RemoveField(model_name="programmeta", name="time_units"),
        migrations.RemoveField(model_name="programmeta", name="ponderation_theory"),
        migrations.RemoveField(model_name="programmeta", name="ponderation_practice"),
        migrations.RemoveField(model_name="programmeta", name="ponderation_individual"),
        migrations.RemoveField(
            model_name="programmeta", name="classification_general_time"
        ),
        migrations.RemoveField(
            model_name="programmeta", name="classification_specific_time"
        ),
        migrations.AddField(
            model_name="activitymeta",
            name="time_required_minutes",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="taskmeta",
            name="time_required_minutes",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="time_required_minutes",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="ponderation_theory_minutes",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="ponderation_practice_minutes",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="ponderation_individual_minutes",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="time_required_minutes",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="ponderation_theory_minutes",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="ponderation_practice_minutes",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="ponderation_individual_minutes",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="classification_general_minutes",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="classification_specific_minutes",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
    ]
