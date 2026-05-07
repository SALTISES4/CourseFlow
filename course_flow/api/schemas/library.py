from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema


class LibraryPaginationIn(CamelSchema):
    page: int = 0
    results_per_page: int = 10


class LibrarySortDirectionIn(str, Enum):
    ASC = "ASC"
    DESC = "DESC"


class LibrarySortValueIn(str, Enum):
    DATE_CREATED = "DATE_CREATED"
    DATE_MODIFIED = "DATE_MODIFIED"
    A_Z = "A_Z"


class LibrarySortIn(CamelSchema):
    value: LibrarySortValueIn = LibrarySortValueIn.DATE_CREATED
    direction: LibrarySortDirectionIn = LibrarySortDirectionIn.DESC


class LibraryFilterIn(CamelSchema):
    name: str
    value: Any


class LibrarySearchIn(CamelSchema):
    pagination: LibraryPaginationIn | None = None
    sort: LibrarySortIn | None = None
    filters: list[LibraryFilterIn] | None = None


class LibraryFavoriteIn(CamelSchema):
    uuid: UUID | None = None


# TODO: this is temporary, should actually be LibraryItemOut
# so that the rsponse is the workflow item that was favorited
class LibraryFavoriteOut(CamelSchema):
    user_id: int
    uuid: UUID
    message: str


class LibraryItemOut(CamelSchema):
    object_type: str
    uuid: UUID | None = None
    graph_uuid: UUID | None = None
    project_uuid: UUID | None = None
    workflow_uuid: UUID | None = None
    title: str
    description: str
    date_created: datetime
    modified_on: datetime
    is_template: bool
    is_favorite: bool


class LibraryMetaOut(CamelSchema):
    total_results: int
    page_count: int
    current_page: int
    results_per_page: int


class LibrarySearchOut(CamelSchema):
    items: list[LibraryItemOut]
    meta: LibraryMetaOut
