from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from ninja import Schema


class LibraryPaginationIn(Schema):
    page: int = 0
    results_per_page: int = 10


class LibrarySortDirectionIn(str, Enum):
    ASC = "ASC"
    DESC = "DESC"


class LibrarySortValueIn(str, Enum):
    DATE_CREATED = "DATE_CREATED"
    DATE_MODIFIED = "DATE_MODIFIED"
    A_Z = "A_Z"


class LibrarySortIn(Schema):
    value: LibrarySortValueIn = LibrarySortValueIn.DATE_CREATED
    direction: LibrarySortDirectionIn = LibrarySortDirectionIn.DESC


class LibraryFilterIn(Schema):
    name: str
    value: Any


class LibrarySearchIn(Schema):
    pagination: LibraryPaginationIn | None = None
    sort: LibrarySortIn | None = None
    filters: list[LibraryFilterIn] | None = None


class LibraryItemOut(Schema):
    object_type: str
    uuid: UUID | None = None
    workflow_uuid: UUID | None = None
    project_uuid: UUID | None = None
    unit_uuid: UUID | None = None
    title: str
    description: str
    date_created: datetime
    modified_on: datetime
    is_template: bool
    is_favorite: bool


class LibraryMetaOut(Schema):
    total_results: int
    page_count: int
    current_page: int
    results_per_page: int


class LibrarySearchOut(Schema):
    items: list[LibraryItemOut]
    meta: LibraryMetaOut
