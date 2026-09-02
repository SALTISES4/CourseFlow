"""Ensure migrated discipline reference data is present for E2E fixtures."""

from course_flow.core.discipline_catalogue import DISCIPLINE_CATALOGUE
from course_flow.core.models import Discipline

E2E_DISCIPLINE_CATALOGUE = DISCIPLINE_CATALOGUE


def ensure_e2e_disciplines() -> None:
    """Synchronize the code-owned catalogue without exposing database PKs."""
    for code in E2E_DISCIPLINE_CATALOGUE:
        Discipline.objects.get_or_create(code=code)
