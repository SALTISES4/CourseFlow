# Generated by Django 3.2.23 on 2024-03-20 14:40

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("course_flow", "0119_alter_courseflowuser_language"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="is_template",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="workflow",
            name="is_template",
            field=models.BooleanField(default=False),
        ),
    ]