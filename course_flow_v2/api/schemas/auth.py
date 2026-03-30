from __future__ import annotations

from datetime import datetime
from uuid import UUID

from ninja import Schema


class LoginIn(Schema):
    email: str
    password: str
    label: str = ""


class RegisterIn(Schema):
    email: str
    password: str
    first_name: str
    last_name: str
    label: str = ""


class UserSummaryOut(Schema):
    id: int
    uuid: UUID
    email: str
    first_name: str
    last_name: str


class LoginOut(Schema):
    access_token: str
    token_type: str
    expires_at: datetime
    user: UserSummaryOut


class LogoutOut(Schema):
    success: bool
