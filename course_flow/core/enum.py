from enum import StrEnum


class WorkflowType(StrEnum):
    """Root graph workflow semantic layer (``task`` is not a valid root type)."""

    PROGRAM = "program"
    COURSE = "course"
    ACTIVITY = "activity"
    TASK = "task"


class NodeType(StrEnum):
    """Grid node semantic layer (``program`` exists only on workflows, not nodes)."""

    COURSE = "course"
    ACTIVITY = "activity"
    TASK = "task"


class TeamRole(StrEnum):
    """A user's role within one project team."""

    EDITOR = "editor"
    COMMENTER = "commenter"
    VIEWER = "viewer"


class AccountRole(StrEnum):
    """Canonical Django ``auth.Group`` names for account-level roles."""

    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


# Compatibility aliases for existing imports and historical migrations. New code
# should use the names that make the role scope explicit.
Role = TeamRole
UserGroup = AccountRole


class LanguagePreference(StrEnum):
    EN = "en-ca"
    FR = "fr-ca"
