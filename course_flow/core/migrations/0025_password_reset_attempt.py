import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cf_core", "0024_credential_version"),
    ]

    operations = [
        migrations.CreateModel(
            name="PasswordResetAttempt",
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
                ("email_key", models.CharField(max_length=64)),
                ("ip_key", models.CharField(max_length=64)),
                (
                    "created_at",
                    models.DateTimeField(
                        default=django.utils.timezone.now,
                        editable=False,
                    ),
                ),
            ],
            options={
                "db_table": "cf_password_reset_attempt",
                "indexes": [
                    models.Index(
                        fields=["email_key", "created_at"],
                        name="cf_pwreset_email_time_idx",
                    ),
                    models.Index(
                        fields=["ip_key", "created_at"],
                        name="cf_pwreset_ip_time_idx",
                    ),
                    models.Index(
                        fields=["created_at"],
                        name="cf_pwreset_created_idx",
                    ),
                ],
            },
        ),
    ]
