"""Naming and content contracts for Playwright E2E fixtures.

Distinct from ``course_flow.dev_seed`` (Faker-driven synthetic dev data).
"""

E2E_FIXTURE_PROJECT_TITLE_PREFIX = "E2E FIXTURE -"

# Primary workflow graph used by edit-section calibration and related specs.
E2E_FIXTURE_PROJECT_TITLE = f"{E2E_FIXTURE_PROJECT_TITLE_PREFIX} Edit Section"
E2E_FIXTURE_WORKFLOW_TITLE = "E2E Activity Workflow"
E2E_FIXTURE_COURSE_WORKFLOW_TITLE = "E2E Course Workflow"
E2E_FIXTURE_PROGRAM_WORKFLOW_TITLE = "E2E Program Workflow"

# Template project + workflow templates for cardTemplateChip e2e (FR-CARD-001/002).
E2E_FIXTURE_TEMPLATE_PROJECT_TITLE = f"{E2E_FIXTURE_PROJECT_TITLE_PREFIX} Workflow Templates"
E2E_FIXTURE_TEMPLATE_ACTIVITY_TITLE = "E2E Activity Template"
E2E_FIXTURE_TEMPLATE_COURSE_TITLE = "E2E Course Template"
E2E_FIXTURE_TEMPLATE_PROGRAM_TITLE = "E2E Program Template"

# Fixed section titles — position 1 is intentionally blank (FR-SEC-002 / empty-title FR-SEC-003).
E2E_SECTION_TITLES: tuple[str, ...] = (
    "E2E Section 1",
    "",
    "E2E Section 3",
)

E2E_CHANNEL_TITLES: tuple[str, ...] = (
    "E2E Channel A",
    "E2E Channel B",
    "E2E Channel C",
)

E2E_OUTCOME_TITLE = "E2E Outcome 1"

# Structural graph layout seed — topology only; section/channel copy is fixed above.
E2E_FIXTURE_GRAPH_SEED = 9001
