# Generated by Django 2.2.9 on 2020-01-29 20:58

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [
        migrations.CreateModel(
            name="Activity",
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
                ("title", models.CharField(max_length=30)),
                ("description", models.TextField(max_length=400)),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("last_modified", models.DateTimeField(auto_now=True)),
                ("is_original", models.BooleanField(default=True)),
                (
                    "hash",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, unique=True
                    ),
                ),
                (
                    "author",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Artifact",
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
                ("title", models.CharField(max_length=30)),
                ("description", models.TextField(max_length=400)),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("last_modified", models.DateTimeField(auto_now=True)),
                ("is_original", models.BooleanField(default=True)),
                (
                    "hash",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, unique=True
                    ),
                ),
                (
                    "author",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Assesment",
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
                ("title", models.CharField(max_length=30)),
                ("description", models.TextField(max_length=400)),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("last_modified", models.DateTimeField(auto_now=True)),
                ("is_original", models.BooleanField(default=True)),
                (
                    "hash",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, unique=True
                    ),
                ),
                (
                    "author",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Component",
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
                ("object_id", models.PositiveIntegerField()),
                (
                    "content_type",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="contenttypes.ContentType",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ComponentProgram",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "component",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Component",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ComponentWeek",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "component",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Component",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Course",
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
                ("title", models.CharField(max_length=30)),
                ("description", models.TextField(max_length=400)),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("last_modified", models.DateTimeField(auto_now=True)),
                ("is_original", models.BooleanField(default=True)),
                (
                    "hash",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, unique=True
                    ),
                ),
                (
                    "author",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Discipline",
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
                (
                    "title",
                    models.CharField(
                        help_text="Enter the name of a new discipline.",
                        max_length=100,
                        unique=True,
                        verbose_name="Discipline name",
                    ),
                ),
            ],
            options={
                "verbose_name": "discipline",
                "verbose_name_plural": "disciplines",
            },
        ),
        migrations.CreateModel(
            name="Node",
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
                ("title", models.CharField(max_length=30)),
                ("description", models.TextField(max_length=400)),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("last_modified", models.DateTimeField(auto_now=True)),
                ("is_original", models.BooleanField(default=True)),
                (
                    "work_classification",
                    models.PositiveIntegerField(
                        choices=[
                            (1, "Individual Work"),
                            (2, "Work in Groups"),
                            (3, "Whole Class"),
                        ],
                        default=2,
                    ),
                ),
                (
                    "activity_classification",
                    models.PositiveIntegerField(
                        choices=[
                            (1, "Gather Information"),
                            (2, "Discuss"),
                            (3, "Solve"),
                            (4, "Analyze"),
                            (5, "Assess/Review Papers"),
                            (6, "Evaluate Peers"),
                            (7, "Debate"),
                            (8, "Game/Roleplay"),
                            (9, "Create/Design"),
                            (10, "Revise/Improve"),
                            (11, "Read"),
                            (12, "Write"),
                            (13, "Present"),
                            (14, "Experiment/Inquiry"),
                            (15, "Quiz/Test"),
                            (16, "Other"),
                        ],
                        default=1,
                    ),
                ),
                (
                    "classification",
                    models.PositiveIntegerField(
                        choices=[
                            (0, "Out of Class"),
                            (1, "In Class (Instructor)"),
                            (2, "In Class (Students)"),
                        ],
                        default=1,
                    ),
                ),
                (
                    "hash",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, unique=True
                    ),
                ),
                (
                    "author",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="NodeStrategy",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "node",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Node",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Outcome",
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
                ("title", models.CharField(max_length=30)),
                ("description", models.TextField(max_length=400)),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("last_modified", models.DateTimeField(auto_now=True)),
                (
                    "hash",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, unique=True
                    ),
                ),
                (
                    "author",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="OutcomePreparation",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "outcome",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Outcome",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="OutcomeProgram",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "outcome",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Outcome",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="OutcomeStrategy",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "outcome",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Outcome",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="OutcomeWeek",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "outcome",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Outcome",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Strategy",
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
                ("title", models.CharField(max_length=30)),
                ("description", models.TextField(max_length=400)),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("last_modified", models.DateTimeField(auto_now=True)),
                ("default", models.BooleanField(default=False)),
                ("is_original", models.BooleanField(default=True)),
                (
                    "hash",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, unique=True
                    ),
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
                    "nodes",
                    models.ManyToManyField(
                        blank=True,
                        through="course_flow.NodeStrategy",
                        to="course_flow.Node",
                    ),
                ),
                (
                    "outcomes",
                    models.ManyToManyField(
                        blank=True,
                        through="course_flow.OutcomeStrategy",
                        to="course_flow.Outcome",
                    ),
                ),
                (
                    "parent_strategy",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="course_flow.Strategy",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Week",
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
                ("title", models.CharField(max_length=30)),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("last_modified", models.DateTimeField(auto_now=True)),
                (
                    "hash",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, unique=True
                    ),
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
                    "components",
                    models.ManyToManyField(
                        blank=True,
                        through="course_flow.ComponentWeek",
                        to="course_flow.Component",
                    ),
                ),
                (
                    "outcomes",
                    models.ManyToManyField(
                        blank=True,
                        through="course_flow.OutcomeWeek",
                        to="course_flow.Outcome",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="WeekCourse",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "course",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Course",
                    ),
                ),
                (
                    "week",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Week",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="StrategyActivity",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "activity",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Activity",
                    ),
                ),
                (
                    "strategy",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Strategy",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Program",
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
                ("title", models.CharField(max_length=30)),
                ("description", models.TextField(max_length=400)),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("last_modified", models.DateTimeField(auto_now=True)),
                (
                    "hash",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, unique=True
                    ),
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
                    "components",
                    models.ManyToManyField(
                        blank=True,
                        through="course_flow.ComponentProgram",
                        to="course_flow.Component",
                    ),
                ),
                (
                    "outcomes",
                    models.ManyToManyField(
                        blank=True,
                        through="course_flow.OutcomeProgram",
                        to="course_flow.Outcome",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Preparation",
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
                ("title", models.CharField(max_length=30)),
                ("description", models.TextField(max_length=400)),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("last_modified", models.DateTimeField(auto_now=True)),
                ("is_original", models.BooleanField(default=True)),
                (
                    "hash",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, unique=True
                    ),
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
                    "outcomes",
                    models.ManyToManyField(
                        blank=True,
                        through="course_flow.OutcomePreparation",
                        to="course_flow.Outcome",
                    ),
                ),
                (
                    "parent_preparation",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="course_flow.Preparation",
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="outcomeweek",
            name="week",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to="course_flow.Week",
            ),
        ),
        migrations.AddField(
            model_name="outcomestrategy",
            name="strategy",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to="course_flow.Strategy",
            ),
        ),
        migrations.AddField(
            model_name="outcomeprogram",
            name="program",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to="course_flow.Program",
            ),
        ),
        migrations.AddField(
            model_name="outcomepreparation",
            name="preparation",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to="course_flow.Preparation",
            ),
        ),
        migrations.CreateModel(
            name="OutcomeNode",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "node",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Node",
                    ),
                ),
                (
                    "outcome",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Outcome",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="OutcomeCourse",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "course",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Course",
                    ),
                ),
                (
                    "outcome",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Outcome",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="OutcomeAssesment",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "assesment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Assesment",
                    ),
                ),
                (
                    "outcome",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Outcome",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="OutcomeArtifact",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "artifact",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Artifact",
                    ),
                ),
                (
                    "outcome",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Outcome",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="OutcomeActivity",
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
                ("added_on", models.DateTimeField(auto_now_add=True)),
                ("rank", models.PositiveIntegerField(default=0)),
                (
                    "activity",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Activity",
                    ),
                ),
                (
                    "outcome",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="course_flow.Outcome",
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="nodestrategy",
            name="strategy",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to="course_flow.Strategy",
            ),
        ),
        migrations.AddField(
            model_name="node",
            name="outcomes",
            field=models.ManyToManyField(
                blank=True,
                through="course_flow.OutcomeNode",
                to="course_flow.Outcome",
            ),
        ),
        migrations.AddField(
            model_name="node",
            name="parent_node",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="course_flow.Node",
            ),
        ),
        migrations.AddField(
            model_name="course",
            name="discipline",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="course_flow.Discipline",
            ),
        ),
        migrations.AddField(
            model_name="course",
            name="outcomes",
            field=models.ManyToManyField(
                blank=True,
                through="course_flow.OutcomeCourse",
                to="course_flow.Outcome",
            ),
        ),
        migrations.AddField(
            model_name="course",
            name="parent_course",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="course_flow.Course",
            ),
        ),
        migrations.AddField(
            model_name="course",
            name="weeks",
            field=models.ManyToManyField(
                blank=True,
                through="course_flow.WeekCourse",
                to="course_flow.Week",
            ),
        ),
        migrations.AddField(
            model_name="componentweek",
            name="week",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to="course_flow.Week",
            ),
        ),
        migrations.AddField(
            model_name="componentprogram",
            name="program",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to="course_flow.Program",
            ),
        ),
        migrations.AddField(
            model_name="assesment",
            name="outcomes",
            field=models.ManyToManyField(
                blank=True,
                through="course_flow.OutcomeAssesment",
                to="course_flow.Outcome",
            ),
        ),
        migrations.AddField(
            model_name="assesment",
            name="parent_assesment",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="course_flow.Assesment",
            ),
        ),
        migrations.AddField(
            model_name="artifact",
            name="outcomes",
            field=models.ManyToManyField(
                blank=True,
                through="course_flow.OutcomeArtifact",
                to="course_flow.Outcome",
            ),
        ),
        migrations.AddField(
            model_name="artifact",
            name="parent_artifact",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="course_flow.Artifact",
            ),
        ),
        migrations.AddField(
            model_name="activity",
            name="outcomes",
            field=models.ManyToManyField(
                blank=True,
                through="course_flow.OutcomeActivity",
                to="course_flow.Outcome",
            ),
        ),
        migrations.AddField(
            model_name="activity",
            name="parent_activity",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="course_flow.Activity",
            ),
        ),
        migrations.AddField(
            model_name="activity",
            name="strategies",
            field=models.ManyToManyField(
                blank=True,
                through="course_flow.StrategyActivity",
                to="course_flow.Strategy",
            ),
        ),
    ]
