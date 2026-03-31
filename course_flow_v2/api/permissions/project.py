"""Placeholder project permission checks for API transport.

Real authorization rules will plug in here later; routes should not embed
ad hoc ownership checks against DTO fields.
"""

from __future__ import annotations

from course_flow_v2.application.dto import ProjectDTO
from course_flow_v2.core.models import User


def can_view_project(*, current_user: User, project: ProjectDTO | None) -> bool:
    """Whether ``current_user`` may read the given project.

    Currently always allows any authenticated caller. Intended to become
    membership / policy logic without changing route handler structure.
    """
    return True
