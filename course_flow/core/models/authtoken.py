from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class Authtoken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="authtokens",
    )
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    label = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_used_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "cf_authtoken"
        indexes = [
            models.Index(fields=["user", "revoked_at", "expires_at"]),
        ]

    @property
    def is_expired(self) -> bool:
        return self.expires_at <= timezone.now()

    @property
    def is_revoked(self) -> bool:
        return self.revoked_at is not None
