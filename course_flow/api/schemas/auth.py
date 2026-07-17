from __future__ import annotations

from datetime import datetime
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema
from course_flow.core.enum import AccountRole


class LoginIn(CamelSchema):
    email: str
    password: str
    label: str = ""


class RegisterIn(CamelSchema):
    email: str
    password: str
    first_name: str
    last_name: str
    label: str = ""


class UserSummaryOut(CamelSchema):
    uuid: UUID
    email: str
    first_name: str
    last_name: str
    account_role: AccountRole | None


class LoginOut(CamelSchema):
    access_token: str
    token_type: str
    expires_at: datetime
    user: UserSummaryOut


class LogoutOut(CamelSchema):
    success: bool
