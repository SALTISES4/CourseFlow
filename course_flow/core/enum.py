from enum import StrEnum


class WorkflowType(StrEnum):
    PROGRAM = "program"
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
