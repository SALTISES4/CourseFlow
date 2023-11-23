# Generated by Django 2.2.25 on 2022-03-21 18:04

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("course_flow", "0081_auto_20220321_1802"),
    ]

    operations = [
        migrations.RenameField(
            model_name="project",
            old_name="terminology_dict",
            new_name="object_sets",
        ),
        migrations.AddField(
            model_name="node",
            name="sets",
            field=models.ManyToManyField(
                blank=True, to="course_flow.ObjectSet"
            ),
        ),
        migrations.AddField(
            model_name="outcome",
            name="sets",
            field=models.ManyToManyField(
                blank=True, to="course_flow.ObjectSet"
            ),
        ),
    ]
