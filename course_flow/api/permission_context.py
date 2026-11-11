from course_flow.api.schemas.permissions import PermissionContextOut
from course_flow.application.services.authorization_service import (
    PermissionContext,
)
from course_flow.core.permissions import (
    ProjectPermission,
    ProjectState,
    WorkflowPermission,
)


def permission_context_out(context: PermissionContext) -> PermissionContextOut:
    actions: list[ProjectPermission | WorkflowPermission]
    if isinstance(context.state, ProjectState):
        actions = [ProjectPermission(action) for action in sorted(context.actions)]
    else:
        actions = [WorkflowPermission(action) for action in sorted(context.actions)]

    return PermissionContextOut(
        account_role=context.account_role,
        resource_role=context.resource_role,
        state=context.state.value,
        actions=actions,
        admin_override=context.admin_override,
    )
