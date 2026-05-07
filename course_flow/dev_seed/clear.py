"""Clear seed-owned projects and dependent rows without wiping global reference data."""

from __future__ import annotations

from typing import Any

from django.db import transaction

from course_flow.core.models import Outcome, Project, Tag, Thread
from course_flow.dev_seed.constants import DEV_SEED_PROJECT_TITLE_PREFIX


def clear_dev_seed_projects(
    *,
    title_prefix: str = DEV_SEED_PROJECT_TITLE_PREFIX,
    clear_all_projects: bool = False,
) -> dict[str, Any]:
    """
    Delete projects (and cascaded descendants) owned by the dev seed.

    - Discipline rows are global and are never deleted.
    - Tags that belong to matching projects are deleted explicitly first so we
      do not leave large numbers of ``project_id=NULL`` tag rows behind.
    - Outcome threads are removed after project cascade (outcomes reference
      threads with PROTECT; deleting the outcome row leaves threads unless we
      clean them up).
    """
    if clear_all_projects:
        qs = Project.objects.all()
    else:
        qs = Project.objects.filter(title__startswith=title_prefix)

    outcome_thread_ids = list(
        Outcome.objects.filter(graph__project__in=qs).values_list(
            "thread_id",
            flat=True,
        )
    )

    with transaction.atomic():
        Tag.objects.filter(project__in=qs).delete()
        deleted = qs.delete()

    # After cascades, outcome rows are gone; remove their dedicated threads.
    oids = [tid for tid in outcome_thread_ids if tid]
    if oids:
        Thread.objects.filter(pk__in=oids).delete()

    return {
        "deleted_by_model": deleted[1],
        "total_objects": deleted[0],
    }
