"""Canonical resource roles, states, actions, and permission matrices."""

from __future__ import annotations

from enum import StrEnum


class ResourceRole(StrEnum):
    OWNER = "owner"
    EDITOR = "editor"
    COMMENTER = "commenter"
    VIEWER = "viewer"
    PUBLIC = "public"


class ProjectState(StrEnum):
    PRIVATE = "private"
    PUBLIC = "public"
    ARCHIVED = "archived"


class WorkflowState(StrEnum):
    PRIVATE = "private"
    PUBLIC = "public"
    ARCHIVED = "archived"


class ProjectPermission(StrEnum):
    VIEW = "view"
    EDIT_PROJECT = "edit_project"
    MANAGE_MEMBERS = "manage_members"
    CREATE_WORKFLOW = "create_workflow"
    ARCHIVE_PROJECT = "archive_project"
    RESTORE_PROJECT = "restore_project"
    DELETE_PROJECT = "delete_project"
    PUBLISH_PROJECT = "publish_project"


class WorkflowPermission(StrEnum):
    VIEW = "view"
    EDIT_ATTRIBUTES = "edit_attributes"
    ARCHIVE = "archive"
    RESTORE = "restore"
    DELETE_PERMANENTLY = "delete_permanently"
    EXPORT = "export"
    COPY = "copy"
    IMPORT_NODES = "import_nodes"
    IMPORT_OUTCOMES = "import_outcomes"
    NODE_MANAGEMENT = "node_management"
    PART_MANAGEMENT = "part_management"
    NODE_CATEGORY_MANAGEMENT = "node_category_management"
    NODE_LINK_MANAGEMENT = "node_link_management"
    OUTCOME_MANAGEMENT = "outcome_management"
    COMMENT = "comment"
    DELETE_OWN_COMMENT = "delete_own_comment"
    ASSIGN_OUTCOMES = "assign_outcomes"


_PROJECT_OWNER_ACTIVE = frozenset(
    {
        ProjectPermission.VIEW,
        ProjectPermission.EDIT_PROJECT,
        ProjectPermission.MANAGE_MEMBERS,
        ProjectPermission.CREATE_WORKFLOW,
        ProjectPermission.ARCHIVE_PROJECT,
        ProjectPermission.PUBLISH_PROJECT,
    }
)
_PROJECT_EDITOR_ACTIVE = frozenset(
    {
        ProjectPermission.VIEW,
        ProjectPermission.EDIT_PROJECT,
        ProjectPermission.MANAGE_MEMBERS,
        ProjectPermission.CREATE_WORKFLOW,
        ProjectPermission.PUBLISH_PROJECT,
    }
)
_PROJECT_READ_ONLY = frozenset({ProjectPermission.VIEW})

PROJECT_PERMISSION_MATRIX: dict[
    ProjectState, dict[ResourceRole, frozenset[ProjectPermission]]
] = {
    ProjectState.PRIVATE: {
        ResourceRole.OWNER: _PROJECT_OWNER_ACTIVE,
        ResourceRole.EDITOR: _PROJECT_EDITOR_ACTIVE,
        ResourceRole.COMMENTER: _PROJECT_READ_ONLY,
        ResourceRole.VIEWER: _PROJECT_READ_ONLY,
        ResourceRole.PUBLIC: frozenset(),
    },
    ProjectState.PUBLIC: {
        ResourceRole.OWNER: _PROJECT_OWNER_ACTIVE,
        ResourceRole.EDITOR: _PROJECT_EDITOR_ACTIVE,
        ResourceRole.COMMENTER: _PROJECT_READ_ONLY,
        ResourceRole.VIEWER: _PROJECT_READ_ONLY,
        ResourceRole.PUBLIC: _PROJECT_READ_ONLY,
    },
    ProjectState.ARCHIVED: {
        ResourceRole.OWNER: frozenset(
            {
                ProjectPermission.RESTORE_PROJECT,
                ProjectPermission.DELETE_PROJECT,
            }
        ),
        ResourceRole.EDITOR: frozenset(),
        ResourceRole.COMMENTER: frozenset(),
        ResourceRole.VIEWER: frozenset(),
        ResourceRole.PUBLIC: frozenset(),
    },
}


_WORKFLOW_EDITOR_ACTIVE = frozenset(
    {
        WorkflowPermission.VIEW,
        WorkflowPermission.EDIT_ATTRIBUTES,
        WorkflowPermission.EXPORT,
        WorkflowPermission.COPY,
        WorkflowPermission.IMPORT_NODES,
        WorkflowPermission.IMPORT_OUTCOMES,
        WorkflowPermission.NODE_MANAGEMENT,
        WorkflowPermission.PART_MANAGEMENT,
        WorkflowPermission.NODE_CATEGORY_MANAGEMENT,
        WorkflowPermission.NODE_LINK_MANAGEMENT,
        WorkflowPermission.OUTCOME_MANAGEMENT,
        WorkflowPermission.COMMENT,
        WorkflowPermission.DELETE_OWN_COMMENT,
        WorkflowPermission.ASSIGN_OUTCOMES,
    }
)
_WORKFLOW_OWNER_ACTIVE = _WORKFLOW_EDITOR_ACTIVE | frozenset(
    {WorkflowPermission.ARCHIVE}
)
_WORKFLOW_COMMENTER_ACTIVE = frozenset(
    {
        WorkflowPermission.VIEW,
        WorkflowPermission.EXPORT,
        WorkflowPermission.COPY,
        WorkflowPermission.COMMENT,
        WorkflowPermission.DELETE_OWN_COMMENT,
    }
)
_WORKFLOW_VIEWER_ACTIVE = frozenset(
    {
        WorkflowPermission.VIEW,
        WorkflowPermission.EXPORT,
        WorkflowPermission.COPY,
    }
)

_WORKFLOW_ACTIVE_BY_ROLE = {
    ResourceRole.OWNER: _WORKFLOW_OWNER_ACTIVE,
    ResourceRole.EDITOR: _WORKFLOW_EDITOR_ACTIVE,
    ResourceRole.COMMENTER: _WORKFLOW_COMMENTER_ACTIVE,
    ResourceRole.VIEWER: _WORKFLOW_VIEWER_ACTIVE,
    ResourceRole.PUBLIC: frozenset({WorkflowPermission.VIEW}),
}

WORKFLOW_PERMISSION_MATRIX: dict[
    WorkflowState, dict[ResourceRole, frozenset[WorkflowPermission]]
] = {
    WorkflowState.PRIVATE: {
        **_WORKFLOW_ACTIVE_BY_ROLE,
        ResourceRole.PUBLIC: frozenset(),
    },
    WorkflowState.PUBLIC: _WORKFLOW_ACTIVE_BY_ROLE,
    WorkflowState.ARCHIVED: {
        ResourceRole.OWNER: frozenset(
            {
                WorkflowPermission.RESTORE,
                WorkflowPermission.DELETE_PERMANENTLY,
            }
        ),
        ResourceRole.EDITOR: frozenset(),
        ResourceRole.COMMENTER: frozenset(),
        ResourceRole.VIEWER: frozenset(),
        ResourceRole.PUBLIC: frozenset(),
    },
}
