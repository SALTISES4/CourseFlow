"""Tests for the staging-only QA account seed."""

from __future__ import annotations

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from course_flow.application.services.password_policy import (
    password_meets_strength_requirement,
)
from course_flow.core.enum import AccountRole
from course_flow.core.models import User
from course_flow.staging_qa_users import STAGING_QA_PASSWORD, STAGING_QA_USERS


def test_staging_qa_password_meets_application_policy():
    assert password_meets_strength_requirement(STAGING_QA_PASSWORD)


def test_staging_qa_seed_refuses_non_staging_environment(monkeypatch):
    monkeypatch.setenv("ENV", "test")

    with pytest.raises(CommandError, match="ENV=staging"):
        call_command("cf_seed_staging_qa_users")


@pytest.mark.django_db
def test_staging_qa_seed_creates_teacher_accounts(monkeypatch):
    monkeypatch.setenv("ENV", "staging")

    call_command("cf_seed_staging_qa_users", verbosity=0)

    assert User.objects.filter(
        email__in=[qa_user.email for qa_user in STAGING_QA_USERS]
    ).count() == len(STAGING_QA_USERS)

    for qa_user in STAGING_QA_USERS:
        user = User.objects.get(email=qa_user.email)
        assert user.first_name == qa_user.first_name
        assert user.last_name == qa_user.last_name
        assert user.check_password(STAGING_QA_PASSWORD)
        assert user.account_role is AccountRole.TEACHER
        assert user.is_active
        assert not user.is_staff
        assert not user.is_superuser


@pytest.mark.django_db
def test_staging_qa_seed_restores_existing_accounts_idempotently(monkeypatch):
    monkeypatch.setenv("ENV", "staging")
    qa_user = STAGING_QA_USERS[0]
    existing = User.objects.create_superuser(
        email=qa_user.email,
        password="Different-Password-2026!",
        first_name="Wrong",
        last_name="Name",
    )
    original_credential_version = existing.credential_version

    call_command("cf_seed_staging_qa_users", verbosity=0)
    call_command("cf_seed_staging_qa_users", verbosity=0)

    assert User.objects.filter(email__iexact=qa_user.email).count() == 1
    existing.refresh_from_db()
    assert existing.first_name == qa_user.first_name
    assert existing.last_name == qa_user.last_name
    assert existing.check_password(STAGING_QA_PASSWORD)
    assert existing.credential_version == original_credential_version + 1
    assert existing.account_role is AccountRole.TEACHER
    assert not existing.is_staff
    assert not existing.is_superuser
    assert User.objects.filter(
        email__in=[entry.email for entry in STAGING_QA_USERS]
    ).count() == len(STAGING_QA_USERS)
