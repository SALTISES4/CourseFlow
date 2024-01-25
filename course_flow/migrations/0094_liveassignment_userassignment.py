# Generated by Django 3.2.15 on 2022-11-01 17:37

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models

import course_flow


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("course_flow", "0093_liveprojectuser"),
    ]

    operations = [
        migrations.CreateModel(
            name="LiveAssignment",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("self_reporting", models.BooleanField(default=True)),
                ("single_completion", models.BooleanField(default=False)),
                (
                    "start_date",
                    models.DateTimeField(
                        default=course_flow.models.liveprojectmodels.liveAssignment.default_start_date
                    ),
                ),
                (
                    "end_date",
                    models.DateTimeField(
                        default=course_flow.models.liveprojectmodels.liveAssignment.default_due_date
                    ),
                ),
                (
                    "created_on",
                    models.DateTimeField(default=django.utils.timezone.now),
                ),
                (
                    "author",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "liveproject",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.liveproject",
                    ),
                ),
                (
                    "task",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="course_flow.node",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="UserAssignment",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("completed", models.BooleanField(default=False)),
                (
                    "assignment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.liveassignment",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
