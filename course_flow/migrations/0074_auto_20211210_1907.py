# Generated by Django 2.2.20 on 2021-12-10 19:07

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("course_flow", "0073_nodelink_deleted"),
    ]

    operations = [
        migrations.AlterField(
            model_name="comment",
            name="text",
            field=models.CharField(max_length=2000),
        ),
        migrations.AlterField(
            model_name="node",
            name="description",
            field=models.TextField(blank=True, max_length=2000, null=True),
        ),
        migrations.AlterField(
            model_name="outcome",
            name="description",
            field=models.TextField(blank=True, max_length=2000, null=True),
        ),
        migrations.AlterField(
            model_name="outcome",
            name="title",
            field=models.CharField(blank=True, max_length=2000, null=True),
        ),
        migrations.AlterField(
            model_name="project",
            name="description",
            field=models.CharField(blank=True, max_length=2000, null=True),
        ),
        migrations.AlterField(
            model_name="week",
            name="description",
            field=models.TextField(blank=True, max_length=2000, null=True),
        ),
        migrations.AlterField(
            model_name="workflow",
            name="description",
            field=models.TextField(blank=True, max_length=2000, null=True),
        ),
    ]
