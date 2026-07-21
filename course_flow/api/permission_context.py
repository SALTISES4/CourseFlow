from course_flow.api.schemas.permissions import PermissionContextOut
from course_flow.application.services.authorization_service import (
    PermissionContext,
)


def permission_context_out(context: PermissionContext) -> PermissionContextOut:
    return PermissionContextOut(
        account_role=context.account_role,
        resource_role=context.resource_role,
        state=context.state.value,
        actions=sorted(context.actions),
        admin_override=context.admin_override,
    )
