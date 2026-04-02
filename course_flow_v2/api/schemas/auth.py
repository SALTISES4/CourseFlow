from __future__ import annotations

from datetime import datetime
from uuid import UUID

from course_flow_v2.api.common.schemas import CamelSchema


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


class UserSummaryOutResp(CamelSchema):
    item: UserSummaryOut


class LoginOut(CamelSchema):
    access_token: str
    token_type: str
    expires_at: datetime
    user: UserSummaryOut


class LogoutOut(CamelSchema):
    success: bool
