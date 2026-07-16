from course_flow.api.common.schemas import CamelSchema
from course_flow.core.enum import AccountRole
from course_flow.core.permissions import (
    ProjectPermission,
    ResourceRole,
    WorkflowPermission,
)

PermissionAction = ProjectPermission | WorkflowPermission


class PermissionContextOut(CamelSchema):
    account_role: AccountRole | None
    resource_role: ResourceRole | None
    state: str
    actions: list[PermissionAction]
    admin_override: bool
