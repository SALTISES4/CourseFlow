from django.db import migrations, models

CONTEXT_VALUES = {
    0: "none",
    1: "individual_work",
    2: "work_in_groups",
    3: "in_the_classroom",
    101: "formative",
    102: "summative",
    103: "comprehensive",
}

TASK_VALUES = {
    0: "none",
    1: "gather_information",
    2: "discuss",
    3: "problem_solve",
    4: "analyze",
    5: "assess_review_peers",
    6: "debate",
    7: "game_roleplay",
    8: "create_design",
    9: "revise_improve",
    10: "read",
    11: "write",
    12: "present",
    13: "experiment_inquiry",
    14: "quiz_test",
    15: "instructor_resource_curation",
    16: "instructor_orchestration",
    17: "instructor_evaluation",
    18: "other",
    101: "jigsaw",
    102: "peer_instruction",
    103: "case_studies",
    104: "gallery_walk",
    105: "reflective_writing",
    106: "two_stage_exam",
    107: "toolkit",
    108: "one_minute_paper",
    109: "distributed_problem_solving",
    110: "peer_assessment",
}

TIME_UNIT_VALUES = {
    0: None,
    1: "seconds",
    2: "minutes",
    3: "hours",
    4: "days",
    5: "sections",
    6: "months",
    7: "years",
    8: "credits",
}


def _copy_values(model, source, target, mapping):
    for row in model.objects.exclude(**{f"{source}__isnull": True}).iterator():
        legacy_value = getattr(row, source)
        if legacy_value not in mapping:
            raise RuntimeError(
                f"Cannot migrate {model.__name__}.{source} value {legacy_value!r}"
            )
        setattr(row, target, mapping[legacy_value])
        row.save(update_fields=[target])


def migrate_named_values(apps, schema_editor):
    Activitymeta = apps.get_model("cf_core", "Activitymeta")
    Taskmeta = apps.get_model("cf_core", "Taskmeta")
    Coursemeta = apps.get_model("cf_core", "Coursemeta")
    Programmeta = apps.get_model("cf_core", "Programmeta")

    for model in (Activitymeta, Taskmeta):
        _copy_values(
            model, "context_classification", "context_classification_key", CONTEXT_VALUES
        )
        _copy_values(
            model, "task_classification", "task_classification_key", TASK_VALUES
        )
        _copy_values(model, "time_units", "time_unit_key", TIME_UNIT_VALUES)
    for model in (Coursemeta, Programmeta):
        _copy_values(model, "time_units", "time_unit_key", TIME_UNIT_VALUES)


def migrate_numeric_values(apps, schema_editor):
    Activitymeta = apps.get_model("cf_core", "Activitymeta")
    Taskmeta = apps.get_model("cf_core", "Taskmeta")
    Coursemeta = apps.get_model("cf_core", "Coursemeta")
    Programmeta = apps.get_model("cf_core", "Programmeta")
    context_values = {value: key for key, value in CONTEXT_VALUES.items()}
    task_values = {value: key for key, value in TASK_VALUES.items()}
    time_values = {value: key for key, value in TIME_UNIT_VALUES.items() if value is not None}

    for model in (Activitymeta, Taskmeta):
        _copy_values(
            model, "context_classification_key", "context_classification", context_values
        )
        _copy_values(
            model, "task_classification_key", "task_classification", task_values
        )
        _copy_values(model, "time_unit_key", "time_units", time_values)
    for model in (Coursemeta, Programmeta):
        _copy_values(model, "time_unit_key", "time_units", time_values)


class Migration(migrations.Migration):
    dependencies = [("cf_core", "0017_discipline_codes_and_catalogue")]

    operations = [
        migrations.AddField(
            model_name="activitymeta",
            name="context_classification_key",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name="activitymeta",
            name="task_classification_key",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name="activitymeta",
            name="time_unit_key",
            field=models.CharField(blank=True, max_length=16, null=True),
        ),
        migrations.AddField(
            model_name="taskmeta",
            name="context_classification_key",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name="taskmeta",
            name="task_classification_key",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name="taskmeta",
            name="time_unit_key",
            field=models.CharField(blank=True, max_length=16, null=True),
        ),
        migrations.AddField(
            model_name="coursemeta",
            name="time_unit_key",
            field=models.CharField(blank=True, max_length=16, null=True),
        ),
        migrations.AddField(
            model_name="programmeta",
            name="time_unit_key",
            field=models.CharField(blank=True, max_length=16, null=True),
        ),
        migrations.RunPython(migrate_named_values, migrate_numeric_values),
        migrations.RemoveField(model_name="activitymeta", name="context_classification"),
        migrations.RemoveField(model_name="activitymeta", name="task_classification"),
        migrations.RemoveField(model_name="activitymeta", name="time_units"),
        migrations.RemoveField(model_name="taskmeta", name="context_classification"),
        migrations.RemoveField(model_name="taskmeta", name="task_classification"),
        migrations.RemoveField(model_name="taskmeta", name="time_units"),
        migrations.RemoveField(model_name="coursemeta", name="time_units"),
        migrations.RemoveField(model_name="programmeta", name="time_units"),
        migrations.RenameField(
            model_name="activitymeta",
            old_name="context_classification_key",
            new_name="context_classification",
        ),
        migrations.RenameField(
            model_name="activitymeta",
            old_name="task_classification_key",
            new_name="task_classification",
        ),
        migrations.RenameField(
            model_name="activitymeta", old_name="time_unit_key", new_name="time_units"
        ),
        migrations.RenameField(
            model_name="taskmeta",
            old_name="context_classification_key",
            new_name="context_classification",
        ),
        migrations.RenameField(
            model_name="taskmeta",
            old_name="task_classification_key",
            new_name="task_classification",
        ),
        migrations.RenameField(
            model_name="taskmeta", old_name="time_unit_key", new_name="time_units"
        ),
        migrations.RenameField(
            model_name="coursemeta", old_name="time_unit_key", new_name="time_units"
        ),
        migrations.RenameField(
            model_name="programmeta", old_name="time_unit_key", new_name="time_units"
        ),
    ]
