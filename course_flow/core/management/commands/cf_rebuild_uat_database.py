"""Destructively rebuild the ephemeral UAT application database."""

from __future__ import annotations

import os

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

_APPLICATION_SCHEMA = "public"
_LOCAL_DATABASE_HOSTS = {"", "127.0.0.1", "localhost", "postgres"}


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


class Command(BaseCommand):
    help = (
        "Delete every table in the UAT public schema, rerun migrations, and "
        "seed the canonical E2E fixtures."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--confirm-uat-reset",
            action="store_true",
            help="Confirm the destructive UAT-only database rebuild.",
        )

    def handle(self, *args, **options) -> None:
        if os.environ.get("ENV") != "uat":
            raise CommandError("Refusing database rebuild unless ENV=uat.")
        if os.environ.get("ALLOW_UAT_DATABASE_RESET") != "true":
            raise CommandError(
                "Refusing database rebuild unless ALLOW_UAT_DATABASE_RESET=true."
            )
        if not options["confirm_uat_reset"]:
            raise CommandError("Pass --confirm-uat-reset to rebuild the UAT database.")
        if connection.vendor != "postgresql":
            raise CommandError("The UAT database rebuild supports PostgreSQL only.")

        database_host = (
            str(connection.settings_dict.get("HOST", "")).lower().rstrip(".")
        )
        if database_host in _LOCAL_DATABASE_HOSTS:
            raise CommandError(
                "Refusing UAT database rebuild against a local or Compose "
                f"PostgreSQL host ({database_host or 'empty host'})."
            )

        database_name = str(connection.settings_dict.get("NAME", ""))
        expected_host = (
            os.environ.get("UAT_DATABASE_RESET_HOST", "").lower().rstrip(".")
        )
        expected_name = os.environ.get("UAT_DATABASE_RESET_NAME", "")
        if not expected_host or not expected_name:
            raise CommandError(
                "UAT_DATABASE_RESET_HOST and UAT_DATABASE_RESET_NAME are required."
            )
        if (database_host, database_name) != (expected_host, expected_name):
            raise CommandError(
                "Refusing UAT database rebuild because the configured database "
                "does not match the reset target fingerprint."
            )

        table_names = _drop_application_tables()
        self.stdout.write(
            f"Dropped {len(table_names)} table(s) from the UAT public schema."
        )

        call_command("migrate", interactive=False, verbosity=options["verbosity"])
        call_command(
            "cf_seed_e2e_data",
            clear_and_seed=True,
            verbosity=options["verbosity"],
        )
        self.stdout.write(
            self.style.SUCCESS("Rebuilt and seeded the ephemeral UAT database.")
        )
