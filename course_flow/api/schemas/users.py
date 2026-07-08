from uuid import UUID

from course_flow.api.common.schemas import CamelSchema


class UserListItemOut(CamelSchema):
    uuid: UUID
    email: str
    first_name: str
    last_name: str


class UserListMetaOut(CamelSchema):
    total: int


class UserListOut(CamelSchema):
    items: list[UserListItemOut]
    meta: UserListMetaOut


class UserProfileSettingsOut(CamelSchema):
    uuid: UUID
    email: str
    first_name: str
    last_name: str
    language_preference: str


class UserProfileSettingsOutResp(CamelSchema):
    item: UserProfileSettingsOut


class UserProfileSettingsPatchIn(CamelSchema):
    first_name: str | None = None
    last_name: str | None = None
    language_preference: str | None = None
    email: str | None = None


class UserProfilePasswordPatchIn(CamelSchema):
    password: str | None = None
    new_password: str | None = None


class UserProfilePasswordPatchResp(CamelSchema):
    uuid: UUID


class UserNotificationSettingsOut(CamelSchema):
    notifications_active: bool


class UserNotificationSettingsOutResp(CamelSchema):
    item: UserNotificationSettingsOut


class UserNotificationSettingsPatchIn(CamelSchema):
    notifications_active: bool | None = None
