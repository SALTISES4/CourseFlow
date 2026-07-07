from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import Field, field_validator, model_validator

from course_flow.api.common.schemas import CamelSchema
from course_flow.core.enum import WorkflowType


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


class LibraryContentTypeIn(str, Enum):
    PROJECT = "project"
    WORKFLOW = "workflow"


class LibraryOwnershipIn(str, Enum):
    OWNED = "owned"
    SHARED = "shared"


class LibraryContentTypeOut(str, Enum):
    PROJECT = "project"
    WORKFLOW = "workflow"


class LibraryFiltersIn(CamelSchema):
    keyword: str | None = None
    content_type: LibraryContentTypeIn | None = None
    project_uuid: UUID | None = Field(
        default=None,
        description=(
            "Limit results to workflows whose parent project has this UUID. "
            "The project row itself is not included in library results when set."
        ),
    )
    discipline_ids: list[int] = Field(default_factory=list)
    workflow_types: list[WorkflowType] = Field(default_factory=list)
    ownership: LibraryOwnershipIn | None = None
    is_favorite: bool | None = None
    is_archived: bool | None = None
    is_template: bool | None = None

    @model_validator(mode="after")
    def validate_workflow_types_scope(self):
        if self.content_type == LibraryContentTypeIn.PROJECT and self.workflow_types:
            raise ValueError(
                "workflowTypes may only be used when contentType is workflow or omitted"
            )
        return self


class LibrarySearchIn(CamelSchema):
    pagination: LibraryPaginationIn | None = None
    sort: LibrarySortIn | None = None
    filters: LibraryFiltersIn | None = None

    @field_validator("filters", mode="before")
    @classmethod
    def validate_filters_shape(cls, value):
        if value is None:
            return None
        if isinstance(value, list):
            raise ValueError("filters must be an object")
        return value


class LibraryFavoriteIn(CamelSchema):
    uuid: UUID | None = None


# TODO: this is temporary, should actually be LibraryItemOut
# so that the rsponse is the workflow item that was favorited
class LibraryFavoriteOut(CamelSchema):
    user_id: int
    uuid: UUID
    message: str


class LibraryItemOut(CamelSchema):
    uuid: UUID
    content_type: LibraryContentTypeOut
    label: str
    title: str
    description: str
    date_created: datetime
    modified_on: datetime
    is_archived: bool
    is_template: bool
    is_favorite: bool


class LibraryDisciplineOptionOut(CamelSchema):
    id: int
    label: str
    translation_plural: str


class LibraryAllowedFiltersOut(CamelSchema):
    disciplines: list[LibraryDisciplineOptionOut] = Field(default_factory=list)


class LibraryAppliedFiltersOut(CamelSchema):
    keyword: str | None = None
    content_type: LibraryContentTypeIn | None = None
    project_uuid: UUID | None = None
    discipline_ids: list[int] = Field(default_factory=list)
    workflow_types: list[WorkflowType] = Field(default_factory=list)
    ownership: LibraryOwnershipIn | None = None
    is_favorite: bool | None = None
    is_archived: bool | None = None
    is_template: bool | None = None


class LibraryMetaOut(CamelSchema):
    total_results: int
    page_count: int
    current_page: int
    results_per_page: int
    applied_filters: LibraryAppliedFiltersOut
    allowed: LibraryAllowedFiltersOut


class LibrarySearchOut(CamelSchema):
    items: list[LibraryItemOut]
    meta: LibraryMetaOut
