"""Deterministic fixtures for local development and Playwright E2E tests."""

from course_flow.e2e_seed.constants import E2E_FIXTURE_PROJECT_TITLE_PREFIX
from course_flow.e2e_seed.orchestrator import (
    clear_then_seed_e2e_fixtures,
    generate_e2e_fixtures,
)

__all__ = [
    "E2E_FIXTURE_PROJECT_TITLE_PREFIX",
    "clear_then_seed_e2e_fixtures",
    "generate_e2e_fixtures",
]
