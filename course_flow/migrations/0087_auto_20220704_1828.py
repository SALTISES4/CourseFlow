# Generated by Django 2.2.25 on 2022-07-04 18:28

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("course_flow", "0086_workflow_static_view"),
    ]

    operations = [
        migrations.RenameField(
            model_name="workflow",
            old_name="static_view",
            new_name="public_view",
        ),
    ]
