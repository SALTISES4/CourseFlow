"""Contextual authorization for account roles and project-team roles."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from course_flow.application.dto import ProjectDTO, WorkflowDTO
from course_flow.core.enum import AccountRole
from course_flow.core.models import Graph, Project, TeamUser, User, Workflow
from course_flow.core.permissions import (
    PROJECT_PERMISSION_MATRIX,
    WORKFLOW_PERMISSION_MATRIX,
    ProjectPermission,
    ProjectState,
    ResourceRole,
    WorkflowPermission,
    WorkflowState,
)


class AuthorizationDenied(PermissionError):
    """The actor does not hold the requested contextual permission."""


@dataclass(frozen=True, slots=True)
class PermissionContext:
    account_role: AccountRole | None
    resource_role: ResourceRole | None
    state: ProjectState | WorkflowState
    actions: frozenset[str]
    admin_override: bool = False

    def allows(self, action: StrEnum | str) -> bool:
        return str(action) in self.actions


class AuthorizationService:
    """Resolve all effective actions for a user in one resource context."""

    def permissions_for_project(
        self,
        *,
        user: User,
        project: Project | ProjectDTO,
    ) -> PermissionContext:
        state = (
            ProjectState.ARCHIVED
            if project.is_archived
            else ProjectState.PUBLIC
            if project.is_published
            else ProjectState.PRIVATE
        )
        role = self._resource_role(
            user=user,
            project_id=project.id,
            project_owner_id=project.owner_id,
            resource_owner_id=None,
            is_public=project.is_published,
        )
        return self._project_context(user=user, role=role, state=state)

    def permissions_for_workflow(
        self,
        *,
        user: User,
        workflow: Workflow | WorkflowDTO | Graph,
    ) -> PermissionContext:
        if isinstance(workflow, WorkflowDTO):
            project_id = workflow.project_id
            project_owner_id = workflow.project_owner_id
            project_is_published = workflow.project_is_published
            project_is_archived = workflow.project_is_archived
            resource_owner_id = workflow.author_id
            workflow_is_archived = workflow.is_archived
        else:
            row = workflow.workflow if isinstance(workflow, Graph) else workflow
            project = row.project if row.project_id is not None else None
            project_id = row.project_id
            project_owner_id = project.owner_id if project is not None else None
            project_is_published = (
                project.is_published if project is not None else False
            )
            project_is_archived = (
                project.is_archived if project is not None else False
            )
            resource_owner_id = row.author_id
            workflow_is_archived = row.is_archived

        state = (
            WorkflowState.ARCHIVED
            if workflow_is_archived or project_is_archived
            else WorkflowState.PUBLIC
            if project_is_published
            else WorkflowState.PRIVATE
        )
        role = self._resource_role(
            user=user,
            project_id=project_id,
            project_owner_id=project_owner_id,
            resource_owner_id=resource_owner_id,
            is_public=project_is_published,
        )
        return self._workflow_context(user=user, role=role, state=state)

    def permissions_for_workflow_project(
        self,
        *,
        user: User,
        workflow: Workflow | WorkflowDTO | Graph,
    ) -> PermissionContext | None:
        """Resolve the parent-project context exposed with a workflow response."""
        if isinstance(workflow, WorkflowDTO):
            project_id = workflow.project_id
            project_owner_id = workflow.project_owner_id
            is_published = workflow.project_is_published
            is_archived = workflow.project_is_archived
        else:
            row = workflow.workflow if isinstance(workflow, Graph) else workflow
            project = row.project if row.project_id is not None else None
            if project is None:
                return None
            project_id = project.id
            project_owner_id = project.owner_id
            is_published = project.is_published
            is_archived = project.is_archived

        if project_id is None or project_owner_id is None:
            return None
        state = (
            ProjectState.ARCHIVED
            if is_archived
            else ProjectState.PUBLIC
            if is_published
            else ProjectState.PRIVATE
        )
        role = self._resource_role(
            user=user,
            project_id=project_id,
            project_owner_id=project_owner_id,
            resource_owner_id=None,
            is_public=is_published,
        )
        return self._project_context(user=user, role=role, state=state)

    def require_project(
        self,
        *,
        user: User,
        project: Project | ProjectDTO,
        action: ProjectPermission,
    ) -> PermissionContext:
        context = self.permissions_for_project(user=user, project=project)
        if not context.allows(action):
            raise AuthorizationDenied(action.value)
        return context

    def require_workflow(
        self,
        *,
        user: User,
        workflow: Workflow | WorkflowDTO | Graph,
        action: WorkflowPermission,
    ) -> PermissionContext:
        context = self.permissions_for_workflow(user=user, workflow=workflow)
        if not context.allows(action):
            raise AuthorizationDenied(action.value)
        return context

    def _resource_role(
        self,
        *,
        user: User,
        project_id: int | None,
        project_owner_id: int | None,
        resource_owner_id: int | None,
        is_public: bool,
    ) -> ResourceRole | None:
        if user.id is not None and user.id in {project_owner_id, resource_owner_id}:
            return ResourceRole.OWNER

        if project_id is not None:
            team_role = (
                TeamUser.objects.filter(
                    team__project_id=project_id,
                    user_id=user.id,
                )
                .values_list("role", flat=True)
                .first()
            )
            if team_role is not None:
                try:
                    return ResourceRole(team_role)
                except ValueError:
                    # Treat corrupt or legacy membership roles as no explicit
                    # membership; published resources may still grant public access.
                    pass

        if is_public:
            return ResourceRole.PUBLIC
        return None

    def _project_context(
        self,
        *,
        user: User,
        role: ResourceRole | None,
        state: ProjectState,
    ) -> PermissionContext:
        account_role = user.account_role
        if account_role is AccountRole.ADMIN:
            return PermissionContext(
                account_role=account_role,
                resource_role=role,
                state=state,
                actions=frozenset(action.value for action in ProjectPermission),
                admin_override=True,
            )
        actions = PROJECT_PERMISSION_MATRIX[state].get(role, frozenset())
        return PermissionContext(
            account_role=account_role,
            resource_role=role,
            state=state,
            actions=(
                frozenset(action.value for action in actions)
                if account_role is not None
                else frozenset()
            ),
        )

    def _workflow_context(
        self,
        *,
        user: User,
        role: ResourceRole | None,
        state: WorkflowState,
    ) -> PermissionContext:
        account_role = user.account_role
        if account_role is AccountRole.ADMIN:
            return PermissionContext(
                account_role=account_role,
                resource_role=role,
                state=state,
                actions=frozenset(action.value for action in WorkflowPermission),
                admin_override=True,
            )
        actions = WORKFLOW_PERMISSION_MATRIX[state].get(role, frozenset())
        return PermissionContext(
            account_role=account_role,
            resource_role=role,
            state=state,
            actions=(
                frozenset(action.value for action in actions)
                if account_role is not None
                else frozenset()
            ),
        )
