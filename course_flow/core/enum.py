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


class ContextClassification(StrEnum):
    """Stable API/database values for activity and course-node context."""

    NONE = "none"
    INDIVIDUAL_WORK = "individual_work"
    WORK_IN_GROUPS = "work_in_groups"
    IN_THE_CLASSROOM = "in_the_classroom"
    FORMATIVE = "formative"
    SUMMATIVE = "summative"
    COMPREHENSIVE = "comprehensive"


class TaskClassification(StrEnum):
    """Stable API/database values for activity and legacy strategy classifications."""

    NONE = "none"
    GATHER_INFORMATION = "gather_information"
    DISCUSS = "discuss"
    PROBLEM_SOLVE = "problem_solve"
    ANALYZE = "analyze"
    ASSESS_REVIEW_PEERS = "assess_review_peers"
    DEBATE = "debate"
    GAME_ROLEPLAY = "game_roleplay"
    CREATE_DESIGN = "create_design"
    REVISE_IMPROVE = "revise_improve"
    READ = "read"
    WRITE = "write"
    PRESENT = "present"
    EXPERIMENT_INQUIRY = "experiment_inquiry"
    QUIZ_TEST = "quiz_test"
    INSTRUCTOR_RESOURCE_CURATION = "instructor_resource_curation"
    INSTRUCTOR_ORCHESTRATION = "instructor_orchestration"
    INSTRUCTOR_EVALUATION = "instructor_evaluation"
    OTHER = "other"
    JIGSAW = "jigsaw"
    PEER_INSTRUCTION = "peer_instruction"
    CASE_STUDIES = "case_studies"
    GALLERY_WALK = "gallery_walk"
    REFLECTIVE_WRITING = "reflective_writing"
    TWO_STAGE_EXAM = "two_stage_exam"
    TOOLKIT = "toolkit"
    ONE_MINUTE_PAPER = "one_minute_paper"
    DISTRIBUTED_PROBLEM_SOLVING = "distributed_problem_solving"
    PEER_ASSESSMENT = "peer_assessment"


class TimeUnit(StrEnum):
    """Stable API/database values for legacy duration-unit fields."""

    SECONDS = "seconds"
    MINUTES = "minutes"
    HOURS = "hours"
    DAYS = "days"
    SECTIONS = "sections"
    MONTHS = "months"
    YEARS = "years"
    CREDITS = "credits"
