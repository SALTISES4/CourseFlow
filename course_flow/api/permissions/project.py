"""Project authorization adapters for Django Ninja controllers."""

from course_flow.application.dto import ProjectDTO
from course_flow.application.services.authorization_service import (
    AuthorizationService,
)
from course_flow.core.models import Project, User
from course_flow.core.permissions import ProjectPermission

_authorization_service = AuthorizationService()


def has_project_permission(
    *,
    current_user: User,
    project: Project | ProjectDTO,
    action: ProjectPermission,
) -> bool:
    context = _authorization_service.permissions_for_project(
        user=current_user,
        project=project,
    )
    return context.allows(action)


def can_view_project(*, current_user: User, project: ProjectDTO | None) -> bool:
    """Compatibility seam for routes not yet migrated to action-based guards."""
    return project is not None and has_project_permission(
        current_user=current_user,
        project=project,
        action=ProjectPermission.VIEW,
    )
