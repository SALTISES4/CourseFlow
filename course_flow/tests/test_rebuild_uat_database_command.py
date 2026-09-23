"""Safety and orchestration tests for the destructive UAT database rebuild."""

from __future__ import annotations

from contextlib import contextmanager
from types import SimpleNamespace

import pytest
from django.core.management import call_command as django_call_command
from django.core.management.base import CommandError

from course_flow.core.management.commands import cf_rebuild_uat_database


def test_rebuild_uat_database_refuses_non_uat_environment(monkeypatch):
    monkeypatch.setenv("ENV", "test")
    monkeypatch.setenv("ALLOW_UAT_DATABASE_RESET", "true")

    with pytest.raises(CommandError, match="ENV=uat"):
        django_call_command(
            "cf_rebuild_uat_database",
            confirm_uat_reset=True,
        )


def test_rebuild_uat_database_requires_explicit_allow_flag(monkeypatch):
    monkeypatch.setenv("ENV", "uat")
    monkeypatch.delenv("ALLOW_UAT_DATABASE_RESET", raising=False)

    with pytest.raises(CommandError, match="ALLOW_UAT_DATABASE_RESET=true"):
        django_call_command(
            "cf_rebuild_uat_database",
            confirm_uat_reset=True,
        )


def test_rebuild_uat_database_requires_confirmation(monkeypatch):
    monkeypatch.setenv("ENV", "uat")
    monkeypatch.setenv("ALLOW_UAT_DATABASE_RESET", "true")

    with pytest.raises(CommandError, match="--confirm-uat-reset"):
        django_call_command("cf_rebuild_uat_database")


def test_rebuild_uat_database_refuses_compose_postgres(monkeypatch):
    monkeypatch.setenv("ENV", "uat")
    monkeypatch.setenv("ALLOW_UAT_DATABASE_RESET", "true")
    monkeypatch.setattr(
        cf_rebuild_uat_database,
        "connection",
        SimpleNamespace(vendor="postgresql", settings_dict={"HOST": "postgres"}),
    )

    with pytest.raises(CommandError, match="local or Compose"):
        django_call_command(
            "cf_rebuild_uat_database",
            confirm_uat_reset=True,
        )


def test_rebuild_uat_database_requires_matching_target_fingerprint(monkeypatch):
    monkeypatch.setenv("ENV", "uat")
    monkeypatch.setenv("ALLOW_UAT_DATABASE_RESET", "true")
    monkeypatch.setenv("UAT_DATABASE_RESET_HOST", "expected-uat-postgres.example")
    monkeypatch.setenv("UAT_DATABASE_RESET_NAME", "courseflow_uat")
    monkeypatch.setattr(
        cf_rebuild_uat_database,
        "connection",
        SimpleNamespace(
            vendor="postgresql",
            settings_dict={
                "HOST": "different-postgres.example",
                "NAME": "courseflow_uat",
            },
        ),
    )

    with pytest.raises(CommandError, match="reset target fingerprint"):
        django_call_command(
            "cf_rebuild_uat_database",
            confirm_uat_reset=True,
        )


def test_rebuild_uat_database_drops_migrates_and_seeds(monkeypatch):
    statements: list[tuple[str, object | None]] = []
    nested_commands: list[tuple[str, dict]] = []

    class FakeCursor:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def execute(self, sql, params=None):
            statements.append((" ".join(sql.split()), params))

        def fetchall(self):
            return [("auth_group",), ("django_migrations",)]

    fake_connection = SimpleNamespace(
        vendor="postgresql",
        settings_dict={
            "HOST": "private-uat-postgres.example",
            "NAME": "courseflow_uat",
        },
        ops=SimpleNamespace(quote_name=lambda name: f'"{name}"'),
        cursor=FakeCursor,
    )

    @contextmanager
    def fake_atomic():
        yield

    def fake_call_command(name, **options):
        nested_commands.append((name, options))

    monkeypatch.setenv("ENV", "uat")
    monkeypatch.setenv("ALLOW_UAT_DATABASE_RESET", "true")
    monkeypatch.setenv("UAT_DATABASE_RESET_HOST", "private-uat-postgres.example")
    monkeypatch.setenv("UAT_DATABASE_RESET_NAME", "courseflow_uat")
    monkeypatch.setattr(cf_rebuild_uat_database, "connection", fake_connection)
    monkeypatch.setattr(cf_rebuild_uat_database.transaction, "atomic", fake_atomic)
    monkeypatch.setattr(cf_rebuild_uat_database, "call_command", fake_call_command)

    django_call_command(
        "cf_rebuild_uat_database",
        confirm_uat_reset=True,
        verbosity=0,
    )

    assert statements == [
        ("SET LOCAL lock_timeout = '30s'", None),
        (
            "SELECT tablename FROM pg_catalog.pg_tables "
            "WHERE schemaname = %s ORDER BY tablename",
            ["public"],
        ),
        (
            'DROP TABLE "public"."auth_group", "public"."django_migrations" CASCADE',
            None,
        ),
    ]
    assert nested_commands == [
        ("migrate", {"interactive": False, "verbosity": 0}),
        ("cf_seed_e2e_data", {"clear_and_seed": True, "verbosity": 0}),
    ]
