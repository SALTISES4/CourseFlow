"""Create the deterministic QA accounts for the disposable staging runtime."""

from __future__ import annotations

import os

from django.core.management.base import BaseCommand, CommandError

from course_flow.staging_qa_users import seed_staging_qa_users


class Command(BaseCommand):
    help = "Create or restore the staging-only QA teacher accounts."

    def handle(self, *args, **options) -> None:
        if os.environ.get("ENV") != "staging":
            raise CommandError("Refusing to seed QA users unless ENV=staging.")

        users = seed_staging_qa_users()
        self.stdout.write(
            self.style.SUCCESS(f"Created or restored {len(users)} staging QA users.")
        )
