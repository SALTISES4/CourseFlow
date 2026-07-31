"""Clear E2E fixture projects without touching unrelated rows."""

from __future__ import annotations

from typing import Any

from django.db import transaction

from course_flow.core.models import Outcome, Project, Tag, Thread
from course_flow.e2e_seed.constants import E2E_FIXTURE_PROJECT_TITLE_PREFIX


def clear_e2e_fixtures() -> dict[str, Any]:
    """Remove projects whose titles start with ``E2E_FIXTURE_PROJECT_TITLE_PREFIX``."""
    projects = Project.objects.filter(
        title__startswith=E2E_FIXTURE_PROJECT_TITLE_PREFIX,
    )
    outcome_thread_ids = list(
        Outcome.objects.filter(graph__workflow__project__in=projects).values_list(
            "thread_id",
            flat=True,
        )
    )

    with transaction.atomic():
        Tag.objects.filter(project__in=projects).delete()
        deleted = projects.delete()

    thread_ids = [thread_id for thread_id in outcome_thread_ids if thread_id]
    if thread_ids:
        Thread.objects.filter(pk__in=thread_ids).delete()

    return {
        "deleted_by_model": deleted[1],
        "total_objects": deleted[0],
    }
