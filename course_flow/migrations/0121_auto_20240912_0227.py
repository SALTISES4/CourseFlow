# Generated by Django 3.2.23 on 2024-09-12 02:27

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("course_flow", "0120_auto_20240320_1440"),
    ]

    operations = [
        migrations.AddField(
            model_name="column",
            name="description",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="outcome",
            name="title",
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
    ]