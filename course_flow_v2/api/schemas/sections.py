from datetime import datetime
from uuid import UUID

from ninja import Schema


class SectionCreateIn(Schema):
    workflow_uuid: UUID
    title: str
    position: int = 0
    thread_uuid: UUID | None = None


class WorkflowSectionCreateIn(Schema):
    title: str
    position: int = 0
    thread_uuid: UUID | None = None


class SectionPatchIn(Schema):
    title: str | None = None
    position: int | None = None
    thread_uuid: UUID | None = None


class SectionOut(Schema):
    uuid: UUID
    workflow_uuid: UUID
    title: str
    position: int
    thread_uuid: UUID | None
    date_created: datetime
    modified_on: datetime


class SectionOutResp(Schema):
    item: SectionOut


class SectionListMetaOut(Schema):
    total: int


class SectionListOut(Schema):
    items: list[SectionOut]
    meta: SectionListMetaOut
