# Generated by Django 2.2.20 on 2021-11-11 19:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("course_flow", "0070_auto_20210920_2129"),
    ]

    operations = [
        migrations.AddField(
            model_name="workflow",
            name="edit_count",
            field=models.PositiveIntegerField(default=0),
        ),
    ]