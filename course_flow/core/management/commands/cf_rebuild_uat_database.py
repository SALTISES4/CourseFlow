"""Destructively rebuild the disposable UAT application database."""

from __future__ import annotations

from course_flow.core.management.commands._rebuild_environment_database import (
    EnvironmentDatabaseRebuildCommand,
)


class Command(EnvironmentDatabaseRebuildCommand):
    help = (
        "Delete every table in the UAT public schema, rerun migrations, and "
        "seed the canonical E2E fixtures before importing persistent projects."
    )
    environment = "uat"
    environment_label = "UAT"
    allow_reset_variable = "ALLOW_UAT_DATABASE_RESET"
    expected_host_variable = "UAT_DATABASE_RESET_HOST"
    expected_name_variable = "UAT_DATABASE_RESET_NAME"
    confirmation_flag = "--confirm-uat-reset"
    confirmation_destination = "confirm_uat_reset"
