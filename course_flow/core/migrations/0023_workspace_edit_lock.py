import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0022_system_graph_labels"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkspaceEditLock",
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
                ("version", models.UUIDField(default=uuid.uuid4, editable=False)),
                ("expires_at", models.DateTimeField()),
                ("date_created", models.DateTimeField(auto_now_add=True)),
                ("modified_on", models.DateTimeField(auto_now=True)),
                (
                    "holder",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_edit_locks",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="edit_lock",
                        to="cf_core.project",
                    ),
                ),
                (
                    "workflow",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="edit_lock",
                        to="cf_core.workflow",
                    ),
                ),
            ],
            options={
                "db_table": "cf_workspace_edit_lock",
                "indexes": [
                    models.Index(
                        fields=["expires_at"],
                        name="cf_workspac_expires_001c54_idx",
                    )
                ],
                "constraints": [
                    models.CheckConstraint(
                        condition=(
                            models.Q(project__isnull=False, workflow__isnull=True)
                            | models.Q(project__isnull=True, workflow__isnull=False)
                        ),
                        name="cf_workspace_edit_lock_exactly_one_resource",
                    )
                ],
            },
        ),
    ]
