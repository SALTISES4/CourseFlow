# Generated by Django 3.2.15 on 2023-09-11 18:44

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("course_flow", "0114_auto_20230911_1841"),
    ]

    operations = [
        migrations.AddField(
            model_name="notification",
            name="is_unread",
            field=models.BooleanField(default=True),
        ),
    ]
