"""Delete one Playwright-owned disposable user and its dependent data."""

from __future__ import annotations

import re

from django.core.management.base import BaseCommand, CommandError

from course_flow.core.models import User

_DISPOSABLE_EMAIL = re.compile(
    r"^e2e-disposable-[a-z0-9-]+@courseflow\.test$",
    re.IGNORECASE,
)


class Command(BaseCommand):
    help = "Delete one guarded e2e-disposable-*@courseflow.test account."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--email", required=True)

    def handle(self, *args, **options) -> None:
        email = options["email"].strip()
        if not _DISPOSABLE_EMAIL.fullmatch(email):
            raise CommandError(
                "Refusing to delete a user outside the "
                "e2e-disposable-*@courseflow.test namespace."
            )

        deleted, _details = User.objects.filter(email__iexact=email).delete()
        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted disposable E2E user {email} ({deleted} objects removed)."
            )
        )
