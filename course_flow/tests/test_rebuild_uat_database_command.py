"""Safety and orchestration tests for destructive environment database rebuilds."""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from types import SimpleNamespace

import pytest
from django.core.management import call_command as django_call_command
from django.core.management.base import CommandError

from course_flow.core.management.commands import _rebuild_environment_database


@dataclass(frozen=True)
class RebuildTarget:
    command_name: str
    environment: str
    allow_variable: str
    host_variable: str
    name_variable: str
    confirmation_destination: str
    confirmation_flag: str


_REBUILD_TARGETS = (
    pytest.param(
        RebuildTarget(
            command_name="cf_rebuild_uat_database",
            environment="uat",
            allow_variable="ALLOW_UAT_DATABASE_RESET",
            host_variable="UAT_DATABASE_RESET_HOST",
            name_variable="UAT_DATABASE_RESET_NAME",
            confirmation_destination="confirm_uat_reset",
            confirmation_flag="--confirm-uat-reset",
        ),
        id="uat",
    ),
    pytest.param(
        RebuildTarget(
            command_name="cf_rebuild_staging_database",
            environment="staging",
            allow_variable="ALLOW_STAGING_DATABASE_RESET",
            host_variable="STAGING_DATABASE_RESET_HOST",
            name_variable="STAGING_DATABASE_RESET_NAME",
            confirmation_destination="confirm_staging_reset",
            confirmation_flag="--confirm-staging-reset",
        ),
        id="staging",
    ),
)


@pytest.mark.parametrize("target", _REBUILD_TARGETS)
def test_rebuild_database_refuses_wrong_environment(monkeypatch, target):
    monkeypatch.setenv("ENV", "test")
    monkeypatch.setenv(target.allow_variable, "true")

    with pytest.raises(CommandError, match=f"ENV={target.environment}"):
        django_call_command(
            target.command_name,
            **{target.confirmation_destination: True},
        )


@pytest.mark.parametrize("target", _REBUILD_TARGETS)
def test_rebuild_database_requires_explicit_allow_flag(monkeypatch, target):
    monkeypatch.setenv("ENV", target.environment)
    monkeypatch.delenv(target.allow_variable, raising=False)

    with pytest.raises(CommandError, match=f"{target.allow_variable}=true"):
        django_call_command(
            target.command_name,
            **{target.confirmation_destination: True},
        )


@pytest.mark.parametrize("target", _REBUILD_TARGETS)
def test_rebuild_database_requires_confirmation(monkeypatch, target):
    monkeypatch.setenv("ENV", target.environment)
    monkeypatch.setenv(target.allow_variable, "true")

    with pytest.raises(CommandError, match=target.confirmation_flag):
        django_call_command(target.command_name)


@pytest.mark.parametrize("target", _REBUILD_TARGETS)
def test_rebuild_database_refuses_compose_postgres(monkeypatch, target):
    monkeypatch.setenv("ENV", target.environment)
    monkeypatch.setenv(target.allow_variable, "true")
    monkeypatch.setattr(
        _rebuild_environment_database,
        "connection",
        SimpleNamespace(vendor="postgresql", settings_dict={"HOST": "postgres"}),
    )

    with pytest.raises(CommandError, match="local or Compose"):
        django_call_command(
            target.command_name,
            **{target.confirmation_destination: True},
        )


@pytest.mark.parametrize("target", _REBUILD_TARGETS)
def test_rebuild_database_requires_matching_target_fingerprint(monkeypatch, target):
    monkeypatch.setenv("ENV", target.environment)
    monkeypatch.setenv(target.allow_variable, "true")
    monkeypatch.setenv(
        target.host_variable,
        f"expected-{target.environment}-postgres.example",
    )
    monkeypatch.setenv(target.name_variable, f"courseflow_{target.environment}")
    monkeypatch.setattr(
        _rebuild_environment_database,
        "connection",
        SimpleNamespace(
            vendor="postgresql",
            settings_dict={
                "HOST": "different-postgres.example",
                "NAME": f"courseflow_{target.environment}",
            },
        ),
    )

    with pytest.raises(CommandError, match="reset target fingerprint"):
        django_call_command(
            target.command_name,
            **{target.confirmation_destination: True},
        )


@pytest.mark.parametrize("target", _REBUILD_TARGETS)
def test_rebuild_database_drops_migrates_seeds_and_imports(monkeypatch, target):
    statements: list[tuple[str, object | None]] = []
    nested_commands: list[tuple[str, tuple, dict]] = []
    database_host = f"private-{target.environment}-postgres.example"
    database_name = f"courseflow_{target.environment}"

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
            "HOST": database_host,
            "NAME": database_name,
        },
        ops=SimpleNamespace(quote_name=lambda name: f'"{name}"'),
        cursor=FakeCursor,
    )

    @contextmanager
    def fake_atomic():
        yield

    def fake_call_command(name, *args, **options):
        nested_commands.append((name, args, options))

    monkeypatch.setenv("ENV", target.environment)
    monkeypatch.setenv(target.allow_variable, "true")
    monkeypatch.setenv(target.host_variable, database_host)
    monkeypatch.setenv(target.name_variable, database_name)
    monkeypatch.setattr(_rebuild_environment_database, "connection", fake_connection)
    monkeypatch.setattr(
        _rebuild_environment_database.transaction,
        "atomic",
        fake_atomic,
    )
    monkeypatch.setattr(
        _rebuild_environment_database,
        "call_command",
        fake_call_command,
    )

    django_call_command(
        target.command_name,
        **{target.confirmation_destination: True},
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
        ("migrate", (), {"interactive": False, "verbosity": 0}),
        ("cf_seed_e2e_data", (), {"clear_and_seed": True, "verbosity": 0}),
        (
            "cf_import_project_snapshot",
            (str(_rebuild_environment_database._PERSISTENT_PROJECT_SNAPSHOT),),
            {
                "owner_email": "teacher@courseflow.com",
                "verbosity": 0,
            },
        ),
    ]
