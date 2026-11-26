"""Destructively rebuild the disposable AWS staging application database."""

from __future__ import annotations

from course_flow.core.management.commands._rebuild_environment_database import (
    EnvironmentDatabaseRebuildCommand,
)


class Command(EnvironmentDatabaseRebuildCommand):
    help = (
        "Delete every table in the staging public schema, rerun migrations, and "
        "seed the canonical E2E fixtures and QA users before importing persistent "
        "projects."
    )
    environment = "staging"
    environment_label = "staging"
    allow_reset_variable = "ALLOW_STAGING_DATABASE_RESET"
    expected_host_variable = "STAGING_DATABASE_RESET_HOST"
    expected_name_variable = "STAGING_DATABASE_RESET_NAME"
    confirmation_flag = "--confirm-staging-reset"
    confirmation_destination = "confirm_staging_reset"
    additional_seed_commands = ("cf_seed_staging_qa_users",)
