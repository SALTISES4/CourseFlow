"""Workflow/graph authorization adapters for Django Ninja controllers."""

from course_flow.application.dto import WorkflowDTO
from course_flow.application.services.authorization_service import (
    AuthorizationService,
)
from course_flow.core.models import Graph, User, Workflow
from course_flow.core.permissions import WorkflowPermission

_authorization_service = AuthorizationService()


def has_workflow_permission(
    *,
    current_user: User,
    workflow: Workflow | WorkflowDTO | Graph,
    action: WorkflowPermission,
) -> bool:
    context = _authorization_service.permissions_for_workflow(
        user=current_user,
        workflow=workflow,
    )
    return context.allows(action)


def can_view_graph(
    *,
    current_user: User,
    graph: WorkflowDTO | Graph | None,
) -> bool:
    """Compatibility seam for routes not yet migrated to action-based guards."""
    return graph is not None and has_workflow_permission(
        current_user=current_user,
        workflow=graph,
        action=WorkflowPermission.VIEW,
    )
