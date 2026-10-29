"""Add credential generations without preserving legacy rows.

The initial AddField operations intentionally have no default. They succeed on
fresh/reset databases and fail when legacy user or token rows exist. The later
AlterField operations add application defaults for newly created objects only;
there is no data migration or compatibility backfill.
"""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0023_workspace_edit_lock"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="credential_version",
            field=models.PositiveBigIntegerField(),
        ),
        migrations.AddField(
            model_name="authtoken",
            name="credential_version",
            field=models.PositiveBigIntegerField(),
        ),
        migrations.AlterField(
            model_name="user",
            name="credential_version",
            field=models.PositiveBigIntegerField(default=1),
        ),
        migrations.AlterField(
            model_name="authtoken",
            name="credential_version",
            field=models.PositiveBigIntegerField(default=1),
        ),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.CheckConstraint(
                condition=models.Q(("credential_version__gte", 1)),
                name="cf_user_credver_gte_1",
            ),
        ),
        migrations.AddConstraint(
            model_name="authtoken",
            constraint=models.CheckConstraint(
                condition=models.Q(("credential_version__gte", 1)),
                name="cf_token_credver_gte_1",
            ),
        ),
    ]
