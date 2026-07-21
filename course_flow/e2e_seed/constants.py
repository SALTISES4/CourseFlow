"""Naming and content contracts for Playwright E2E fixtures.

Distinct from ``course_flow.dev_seed`` (Faker-driven synthetic dev data).
"""

E2E_FIXTURE_PROJECT_TITLE_PREFIX = "E2E FIXTURE -"

# Primary workflow graph used by edit-section calibration and related specs.
E2E_FIXTURE_PROJECT_TITLE = f"{E2E_FIXTURE_PROJECT_TITLE_PREFIX} Edit Section"
E2E_FIXTURE_WORKFLOW_TITLE = "E2E Activity Workflow"
E2E_FIXTURE_COURSE_WORKFLOW_TITLE = "E2E Course Workflow"
E2E_FIXTURE_PROGRAM_WORKFLOW_TITLE = "E2E Program Workflow"

# Private workflow owned by another fixture actor. The primary teacher is not a
# contributor, providing a deterministic FR-WS-ACCESS-002 hard-load target.
E2E_FIXTURE_RESTRICTED_PROJECT_TITLE = (
    f"{E2E_FIXTURE_PROJECT_TITLE_PREFIX} Restricted Workflow"
)
E2E_FIXTURE_RESTRICTED_WORKFLOW_TITLE = "E2E Restricted Workflow"

# Template project + workflow templates for cardTemplateChip e2e (FR-CARD-001/002).
E2E_FIXTURE_TEMPLATE_PROJECT_TITLE = (
    f"{E2E_FIXTURE_PROJECT_TITLE_PREFIX} Workflow Templates"
)
E2E_FIXTURE_TEMPLATE_ACTIVITY_TITLE = "E2E Activity Template"
E2E_FIXTURE_TEMPLATE_COURSE_TITLE = "E2E Course Template"
E2E_FIXTURE_TEMPLATE_PROGRAM_TITLE = "E2E Program Template"

# Primary E2E actor and project-team contributors. The primary teacher owns the
# canonical fixture projects; admin is intentionally excluded from ordinary
# fixture teams so permission tests do not exercise the superuser override path.
E2E_FIXTURE_EDITOR_EMAIL = "editor@courseflow.com"
E2E_FIXTURE_COMMENTER_EMAIL = "commenter@courseflow.com"

# Ordered most-recent-first. Five non-archived projects are required to prove
# FR-HOME-003's four-card cap rather than merely render four available cards.
E2E_FIXTURE_HOME_PROJECT_TITLES: tuple[str, ...] = tuple(
    f"{E2E_FIXTURE_PROJECT_TITLE_PREFIX} Recent Project {index}"
    for index in range(1, 6)
)
E2E_FIXTURE_ARCHIVED_HOME_PROJECT_TITLE = (
    f"{E2E_FIXTURE_PROJECT_TITLE_PREFIX} Archived Recent Project"
)

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
