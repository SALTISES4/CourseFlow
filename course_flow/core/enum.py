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

class Role(StrEnum):
    EDITOR = "editor"
    COMMENTER = "commenter"
    VIEWER = "viewer"

class LanguagePreference(StrEnum):
    EN = "en-ca"
    FR = "fr-ca"
