"""Deterministic QA accounts recreated with the disposable staging database."""

from __future__ import annotations

from dataclasses import dataclass

from django.db import transaction

from course_flow.application.services.password_policy import (
    password_meets_strength_requirement,
)
from course_flow.core.enum import AccountRole
from course_flow.core.models import User


@dataclass(frozen=True, slots=True)
class StagingQaUser:
    first_name: str
    last_name: str
    email: str


# Temporary shared staging credential approved for this disposable QA account set.
STAGING_QA_PASSWORD = "saltiseqa2026!"

STAGING_QA_USERS: tuple[StagingQaUser, ...] = (
    StagingQaUser("Beth", "Acton", "beth.acton@johnabbott.qc.ca"),
    StagingQaUser("Chao", "Zhang", "chao.zhang2@mail.mcgill.ca"),
    StagingQaUser("Chris", "Whittaker", "cwhittaker@dawsoncollege.qc.ca"),
    StagingQaUser("Monica", "Lopez", "mlopez@dawsoncollege.qc.ca"),
    StagingQaUser("Sueli", "Bonafim", "sbonafim@dawsoncollege.qc.ca"),
    StagingQaUser("Kurt", "Holfeld", "kholfeld@dawsoncollege.qc.ca"),
    StagingQaUser(
        "Catherine",
        "Henderson",
        "catherine.henderson@johnabbott.qc.ca",
    ),
    StagingQaUser("Esteban", "Moreno", "esteban.moreno@mail.concordia.ca"),
)


def seed_staging_qa_users() -> list[User]:
    """Create or restore the staging QA users as active non-admin teachers."""
    if not password_meets_strength_requirement(STAGING_QA_PASSWORD):
        raise ValueError("The staging QA password does not meet the password policy.")

    seeded_users: list[User] = []
    with transaction.atomic():
        for qa_user in STAGING_QA_USERS:
            user = (
                User.objects.select_for_update()
                .filter(email__iexact=qa_user.email)
                .first()
            )
            if user is None:
                user = User(email=qa_user.email)
                created = True
            else:
                created = False

            user.email = qa_user.email
            user.first_name = qa_user.first_name
            user.last_name = qa_user.last_name
            user.is_active = True
            user.is_staff = False
            user.is_superuser = False

            if created or not user.check_password(STAGING_QA_PASSWORD):
                user.set_password(STAGING_QA_PASSWORD)
                if not created:
                    user.credential_version += 1

            user.save()
            user.set_account_role(AccountRole.TEACHER)
            seeded_users.append(user)

    return seeded_users
