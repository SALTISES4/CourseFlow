from uuid import UUID

from ninja import Schema


class UserListItemOut(Schema):
    uuid: UUID
    email: str
    first_name: str
    last_name: str


class UserListMetaOut(Schema):
    total: int


class UserListOut(Schema):
    items: list[UserListItemOut]
    meta: UserListMetaOut


class UserProfileSettingsOut(Schema):
    uuid: UUID
    email: str
    first_name: str
    last_name: str
    language_preference: str


class UserProfileSettingsOutResp(Schema):
    item: UserProfileSettingsOut


class UserProfileSettingsPatchIn(Schema):
    first_name: str | None = None
    last_name: str | None = None
    language_preference: str | None = None
    email: str | None = None


class UserNotificationSettingsOut(Schema):
    notifications_active: bool


class UserNotificationSettingsOutResp(Schema):
    item: UserNotificationSettingsOut


class UserNotificationSettingsPatchIn(Schema):
    notifications_active: bool | None = None
