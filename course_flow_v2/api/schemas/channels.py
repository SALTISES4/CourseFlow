from datetime import datetime
from uuid import UUID

from ninja import Schema


class ChannelCreateIn(Schema):
    workflow_uuid: UUID
    title: str
    position: int = 0
    thread_uuid: UUID | None = None


class WorkflowChannelCreateIn(Schema):
    title: str
    position: int = 0
    thread_uuid: UUID | None = None


class ChannelPatchIn(Schema):
    title: str | None = None
    position: int | None = None
    thread_uuid: UUID | None = None


class ChannelOut(Schema):
    uuid: UUID
    workflow_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None
    date_created: datetime
    modified_on: datetime


class ChannelOutResp(Schema):
    item: ChannelOut


class ChannelListMetaOut(Schema):
    total: int


class ChannelListOut(Schema):
    items: list[ChannelOut]
    meta: ChannelListMetaOut
