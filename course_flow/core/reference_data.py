"""Code-owned, read-only option catalogues exposed by the REST API."""

from __future__ import annotations

from course_flow.core.enum import (
    ContextClassification,
    TaskClassification,
    TimeUnit,
)

ACTIVITY_CONTEXT_OPTIONS = (
    ContextClassification.NONE,
    ContextClassification.INDIVIDUAL_WORK,
    ContextClassification.WORK_IN_GROUPS,
    ContextClassification.IN_THE_CLASSROOM,
)

COURSE_CONTEXT_OPTIONS = (
    ContextClassification.NONE,
    ContextClassification.FORMATIVE,
    ContextClassification.SUMMATIVE,
    ContextClassification.COMPREHENSIVE,
)

ACTIVITY_TASK_OPTIONS = (
    TaskClassification.NONE,
    TaskClassification.GATHER_INFORMATION,
    TaskClassification.DISCUSS,
    TaskClassification.PROBLEM_SOLVE,
    TaskClassification.ANALYZE,
    TaskClassification.ASSESS_REVIEW_PEERS,
    TaskClassification.DEBATE,
    TaskClassification.GAME_ROLEPLAY,
    TaskClassification.CREATE_DESIGN,
    TaskClassification.REVISE_IMPROVE,
    TaskClassification.READ,
    TaskClassification.WRITE,
    TaskClassification.PRESENT,
    TaskClassification.EXPERIMENT_INQUIRY,
    TaskClassification.QUIZ_TEST,
    TaskClassification.INSTRUCTOR_RESOURCE_CURATION,
    TaskClassification.INSTRUCTOR_ORCHESTRATION,
    TaskClassification.INSTRUCTOR_EVALUATION,
    TaskClassification.OTHER,
)

TIME_UNIT_OPTIONS = tuple(TimeUnit)
