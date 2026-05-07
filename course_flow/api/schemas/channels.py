from datetime import datetime
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema


class ChannelCreateIn(CamelSchema):
    graph_uuid: UUID
    title: str
    position: int = 0
    thread_uuid: UUID | None = None


class GraphChannelCreateIn(CamelSchema):
    title: str
    position: int = 0
    thread_uuid: UUID | None = None


class ChannelPatchIn(CamelSchema):
    title: str | None = None
    position: int | None = None
    thread_uuid: UUID | None = None


class ChannelOut(CamelSchema):
    uuid: UUID
    graph_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None
    date_created: datetime
    modified_on: datetime


class ChannelOutResp(CamelSchema):
    item: ChannelOut


class ChannelListMetaOut(CamelSchema):
    total: int


class ChannelListOut(CamelSchema):
    items: list[ChannelOut]
    meta: ChannelListMetaOut
