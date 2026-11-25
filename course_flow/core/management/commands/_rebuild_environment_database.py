"""Shared guarded rebuild lifecycle for disposable non-production databases."""

from __future__ import annotations

import os
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

_APPLICATION_SCHEMA = "public"
_LOCAL_DATABASE_HOSTS = {"", "127.0.0.1", "localhost", "postgres"}
_PERSISTENT_PROJECT_SNAPSHOT = (
    Path(settings.BASE_DIR)
    / "course_flow"
    / "project_snapshots"
    / "project_for_templates.v2.json"
)
_PERSISTENT_PROJECT_OWNER_EMAIL = "teacher@courseflow.com"


def _drop_application_tables() -> list[str]:
    """Drop every table in the application schema as one PostgreSQL transaction."""
    quote_name = connection.ops.quote_name
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("SET LOCAL lock_timeout = '30s'")
            cursor.execute(
                """
                SELECT tablename
                FROM pg_catalog.pg_tables
                WHERE schemaname = %s
                ORDER BY tablename
                """,
                [_APPLICATION_SCHEMA],
            )
            table_names = [row[0] for row in cursor.fetchall()]
            if table_names:
                qualified_tables = ", ".join(
                    f"{quote_name(_APPLICATION_SCHEMA)}.{quote_name(table_name)}"
                    for table_name in table_names
                )
                cursor.execute(f"DROP TABLE {qualified_tables} CASCADE")
    return table_names


class EnvironmentDatabaseRebuildCommand(BaseCommand):
    """Base command with explicit environment, authorization, and target guards."""

    environment: str
    environment_label: str
    allow_reset_variable: str
    expected_host_variable: str
    expected_name_variable: str
    confirmation_flag: str
    confirmation_destination: str

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            self.confirmation_flag,
            action="store_true",
            help=f"Confirm the destructive {self.environment_label}-only database rebuild.",
        )

    def handle(self, *args, **options) -> None:
        if os.environ.get("ENV") != self.environment:
            raise CommandError(
                f"Refusing database rebuild unless ENV={self.environment}."
            )
        if os.environ.get(self.allow_reset_variable) != "true":
            raise CommandError(
                "Refusing database rebuild unless "
                f"{self.allow_reset_variable}=true."
            )
        if not options[self.confirmation_destination]:
            raise CommandError(
                f"Pass {self.confirmation_flag} to rebuild the "
                f"{self.environment_label} database."
            )
        if connection.vendor != "postgresql":
            raise CommandError(
                f"The {self.environment_label} database rebuild supports "
                "PostgreSQL only."
            )

        database_host = (
            str(connection.settings_dict.get("HOST", "")).lower().rstrip(".")
        )
        if database_host in _LOCAL_DATABASE_HOSTS:
            raise CommandError(
                f"Refusing {self.environment_label} database rebuild against a "
                "local or Compose PostgreSQL host "
                f"({database_host or 'empty host'})."
            )

        database_name = str(connection.settings_dict.get("NAME", ""))
        expected_host = (
            os.environ.get(self.expected_host_variable, "").lower().rstrip(".")
        )
        expected_name = os.environ.get(self.expected_name_variable, "")
        if not expected_host or not expected_name:
            raise CommandError(
                f"{self.expected_host_variable} and {self.expected_name_variable} "
                "are required."
            )
        if (database_host, database_name) != (expected_host, expected_name):
            raise CommandError(
                f"Refusing {self.environment_label} database rebuild because the "
                "configured database does not match the reset target fingerprint."
            )

        table_names = _drop_application_tables()
        self.stdout.write(
            f"Dropped {len(table_names)} table(s) from the "
            f"{self.environment_label} public schema."
        )

        call_command("migrate", interactive=False, verbosity=options["verbosity"])
        call_command(
            "cf_seed_e2e_data",
            clear_and_seed=True,
            verbosity=options["verbosity"],
        )
        call_command(
            "cf_import_project_snapshot",
            str(_PERSISTENT_PROJECT_SNAPSHOT),
            owner_email=_PERSISTENT_PROJECT_OWNER_EMAIL,
            verbosity=options["verbosity"],
        )
        self.stdout.write(
            self.style.SUCCESS(
                "Rebuilt, seeded, and imported persistent "
                f"{self.environment_label} project snapshots."
            )
        )
