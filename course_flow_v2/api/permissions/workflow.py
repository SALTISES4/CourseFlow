"""Placeholder workflow permission checks for API transport."""

from __future__ import annotations

from course_flow_v2.application.dto import WorkflowDTO
from course_flow_v2.core.models import User, Workflow


def can_view_workflow(
    *, current_user: User, workflow: WorkflowDTO | Workflow | None
) -> bool:
    """Whether ``current_user`` may read/mutate the given workflow context.

    Currently always allows any authenticated caller. Intended to become
    membership / policy logic without changing route handler structure.
    """
    return True
