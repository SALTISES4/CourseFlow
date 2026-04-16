from datetime import datetime
from uuid import UUID

from course_flow_v2.api.common.schemas import CamelSchema


class SectionCreateIn(CamelSchema):
    graph_uuid: UUID
    title: str
    position: int = 0
    thread_uuid: UUID | None = None


class GraphSectionCreateIn(CamelSchema):
    title: str
    position: int = 0
    thread_uuid: UUID | None = None


class SectionPatchIn(CamelSchema):
    title: str | None = None
    position: int | None = None
    thread_uuid: UUID | None = None


class SectionOut(CamelSchema):
    uuid: UUID
    graph_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None
    date_created: datetime
    modified_on: datetime


class SectionOutResp(CamelSchema):
    item: SectionOut


class SectionListMetaOut(CamelSchema):
    total: int


class SectionListOut(CamelSchema):
    items: list[SectionOut]
    meta: SectionListMetaOut
