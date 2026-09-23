from datetime import datetime
from uuid import UUID

from course_flow.api.common.schemas import CamelSchema
from course_flow.application.services.workspace_edit_lock_service import (
    WorkspaceEditLockState,
)
from course_flow.core.enum import WorkspaceResourceType


class WorkspaceEditLockHolderOut(CamelSchema):
    uuid: UUID
    display_name: str


class WorkspaceEditLockOut(CamelSchema):
    resource_type: WorkspaceResourceType
    resource_uuid: UUID
    state: WorkspaceEditLockState
    holder: WorkspaceEditLockHolderOut | None = None
    version: UUID | None = None
    expires_at: datetime | None = None


class WorkspaceEditLockTakeoverIn(CamelSchema):
    expected_version: UUID
