from django.db import models
from django.utils import timezone


class PasswordResetAttempt(models.Model):
    email_key = models.CharField(max_length=64)
    ip_key = models.CharField(max_length=64)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        db_table = "cf_password_reset_attempt"
        indexes = [
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
        ]
