"""Clear E2E fixture projects without touching dev seed or unrelated rows."""

from __future__ import annotations

from typing import Any

from course_flow.dev_seed.clear import clear_dev_seed_projects
from course_flow.e2e_seed.constants import E2E_FIXTURE_PROJECT_TITLE_PREFIX


def clear_e2e_fixtures() -> dict[str, Any]:
    """Remove projects whose titles start with ``E2E_FIXTURE_PROJECT_TITLE_PREFIX``."""
    return clear_dev_seed_projects(title_prefix=E2E_FIXTURE_PROJECT_TITLE_PREFIX)
