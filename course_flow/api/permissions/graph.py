"""Placeholder graph permission checks for API transport."""

from __future__ import annotations

from course_flow.application.dto import WorkflowDTO
from course_flow.core.models import Graph, User


def can_view_graph(
    *, current_user: User, graph: WorkflowDTO | Graph | None
) -> bool:
    """Whether ``current_user`` may read/mutate the given graph context.

    Currently always allows any authenticated caller. Intended to become
    membership / policy logic without changing route handler structure.
    """
    return True
