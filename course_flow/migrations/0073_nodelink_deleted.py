# Generated by Django 2.2.20 on 2021-11-23 18:59

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("course_flow", "0072_auto_20211115_2237"),
    ]

    operations = [
        migrations.AddField(
            model_name="nodelink",
            name="deleted",
            field=models.BooleanField(default=False),
        ),
    ]
