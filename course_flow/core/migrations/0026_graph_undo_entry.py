import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0025_password_reset_attempt"),
    ]

    operations = [
        migrations.CreateModel(
            name="GraphUndoEntry",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "kind",
                    models.CharField(
                        choices=[
                            ("delete_created_edge", "Delete created edge"),
                            ("recreate_deleted_edge", "Recreate deleted edge"),
                        ],
                        max_length=64,
                    ),
                ),
                ("schema_version", models.PositiveSmallIntegerField(default=1)),
                ("payload", models.JSONField()),
                ("date_created", models.DateTimeField(auto_now_add=True)),
                ("modified_on", models.DateTimeField(auto_now=True)),
                (
                    "actor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="graph_undo_entries",
                        to="cf_core.user",
                    ),
                ),
                (
                    "graph",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="undo_entry",
                        to="cf_core.graph",
                    ),
                ),
            ],
            options={
                "db_table": "cf_graph_undo_entry",
            },
        ),
    ]
