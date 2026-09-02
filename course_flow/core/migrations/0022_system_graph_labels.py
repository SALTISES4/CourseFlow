from django.db import migrations, models

LEGACY_CHANNEL_LABELS = (
    (
        "activity",
        0,
        "Out of class (instructor)",
        "#0B118A",
        "activity_out_of_class_instructor",
    ),
    (
        "activity",
        1,
        "Out of class (students)",
        "#114BD4",
        "activity_out_of_class_students",
    ),
    ("activity", 2, "In class (instructor)", "#268AE5", "activity_in_class_instructor"),
    ("activity", 3, "In class (students)", "#8BC8FF", "activity_in_class_students"),
    ("course", 0, "Preparation", "#F7B92A", "course_preparation"),
    ("course", 1, "Lesson", "#ED8934", "course_lesson"),
    ("course", 2, "Artifact", "#ED4A28", "course_artifact"),
    ("course", 3, "Assessment", "#AD1D35", "course_assessment"),
    ("program", 0, "Custom node category", "#468884", "custom_node_category"),
    ("program", 1, "Custom node category", "#6FA29F", "custom_node_category"),
    ("program", 2, "Custom node category", "#98BDBB", "custom_node_category"),
)


def mark_known_system_channels(apps, schema_editor):
    Channel = apps.get_model("cf_core", "Channel")
    for workflow_type, position, title, colour, code in LEGACY_CHANNEL_LABELS:
        # Exact generated signature only. Other equal titles are treated as authored.
        Channel.objects.filter(
            graph__workflow__workflow_type=workflow_type,
            position=position,
            title=title,
            colour=colour,
        ).update(title="", system_label_code=code)


def restore_legacy_channel_titles(apps, schema_editor):
    Channel = apps.get_model("cf_core", "Channel")
    for workflow_type, position, title, colour, code in LEGACY_CHANNEL_LABELS:
        Channel.objects.filter(
            graph__workflow__workflow_type=workflow_type,
            position=position,
            title="",
            colour=colour,
            system_label_code=code,
        ).update(title=title, system_label_code=None)


class Migration(migrations.Migration):
    dependencies = [("cf_core", "0021_notification_localization_contract")]

    operations = [
        migrations.AlterField(
            model_name="channel",
            name="title",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="channel",
            name="system_label_code",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name="channel",
            name="title_copy_count",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="section",
            name="title_copy_count",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="node",
            name="title_copy_count",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="outcome",
            name="title_copy_count",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.RunPython(
            mark_known_system_channels,
            restore_legacy_channel_titles,
        ),
    ]
