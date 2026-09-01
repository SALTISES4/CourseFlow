"""Code-owned, read-only option catalogues exposed by the REST API."""

from __future__ import annotations

from course_flow.core.enum import (
    ContextClassification,
    TaskClassification,
    TimeUnit,
)

ACTIVITY_CONTEXT_OPTIONS = (
    (ContextClassification.NONE, "None"),
    (ContextClassification.INDIVIDUAL_WORK, "Individual Work"),
    (ContextClassification.WORK_IN_GROUPS, "Work in Groups"),
    (ContextClassification.IN_THE_CLASSROOM, "Whole Class"),
)

COURSE_CONTEXT_OPTIONS = (
    (ContextClassification.NONE, "None"),
    (ContextClassification.FORMATIVE, "Formative"),
    (ContextClassification.SUMMATIVE, "Summative"),
    (ContextClassification.COMPREHENSIVE, "Comprehensive"),
)

ACTIVITY_TASK_OPTIONS = (
    (TaskClassification.NONE, "None"),
    (TaskClassification.GATHER_INFORMATION, "Gather Information"),
    (TaskClassification.DISCUSS, "Discuss"),
    (TaskClassification.PROBLEM_SOLVE, "Problem Solve"),
    (TaskClassification.ANALYZE, "Analyze"),
    (TaskClassification.ASSESS_REVIEW_PEERS, "Assess/Review Peers"),
    (TaskClassification.DEBATE, "Debate"),
    (TaskClassification.GAME_ROLEPLAY, "Game/Roleplay"),
    (TaskClassification.CREATE_DESIGN, "Create/Design"),
    (TaskClassification.REVISE_IMPROVE, "Revise/Improve"),
    (TaskClassification.READ, "Read"),
    (TaskClassification.WRITE, "Write"),
    (TaskClassification.PRESENT, "Present"),
    (TaskClassification.EXPERIMENT_INQUIRY, "Experiment/Inquiry"),
    (TaskClassification.QUIZ_TEST, "Quiz/Test"),
    (
        TaskClassification.INSTRUCTOR_RESOURCE_CURATION,
        "Instructor Resource Curation",
    ),
    (TaskClassification.INSTRUCTOR_ORCHESTRATION, "Instructor Orchestration"),
    (TaskClassification.INSTRUCTOR_EVALUATION, "Instructor Evaluation"),
    (TaskClassification.OTHER, "Other"),
)

TIME_UNIT_OPTIONS = tuple((unit, unit.value.title()) for unit in TimeUnit)
