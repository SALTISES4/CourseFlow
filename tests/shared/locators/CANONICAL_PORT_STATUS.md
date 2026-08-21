# Canonical locator port status

Tracks TypeScript implementation of `tests/docs/requirements/features/shared/canonical_locators.yaml`.

**TypeScript home:** `tests/shared/locators/` (cross-domain) + `tests/e2e/<domain>/*.locators.ts` (domain-only + re-exports).

**Policy:** `tests/docs/testing/locator_contract_policy.md` § When to add `data-test-id`.

## Ported (implemented + React hooks where needed)

| Module | Canonical uiObjects | Notes |
| --- | --- | --- |
| `shared/locators/navigation.ts` | `mainNavigation`, `homeNavItem`, `myLibraryNavItem`, `exploreNavItem`, `favouritedItemLink`, `collapseToggle`, `topNavigationBar`, `addMenuTrigger`, `accountMenuTrigger`, `addMenuItem*`, `accountMenuItem*`, `containsSection`, `appearsInSection`, `backToProjectLink`, … | `data-test-id="main-nav"`, `data-test-id="top-bar"` |
| `shared/locators/library.ts` | `keywordSearchField`, `libraryFilterToolbar`, filter toggles, `libraryCards`, `projectCard`, `workflowCard`, `libraryLoadingSkeletons`, `sortMenuItem`, `SORT_OPTION_*`, … | `library-filter-toolbar`, `library-results`, `library-loading-skeleton`, `project-card` / `workflow-card` |
| `shared/locators/workflow.ts` | `workflowRightSidebar`, … `workflowCommentsTabListItem*`, … | sidebar tabs via `aria-label='{tab} tab'` |
| `e2e/workflow/workflow-graph.locators.ts` | `workflowNode`, `workflowNodeHoverActionsMenuCommentsItem`, `workflowChannelHeader`, `workflowChannelHoverActionsMenuCommentsItem`, `workflowEditNodeForm`, `workflowEditChannelForm`, … | node `#node-{uuid}`; channel `[data-column-id]` |
| `e2e/workflow/workflow-outcome.locators.ts` | `workflowOutcomeHeader`, `workflowOutcomeHoverActionsMenuCommentsItem`, `workflowEditOutcomeForm` | outcome title text on `/outcomedit` |
| `e2e/workflow/workflow-add-tab.locators.ts` | `workflowAddTabTitle`, `workflowAddTabInsertMode*`, `workflowAddTabNodeCategoryItem` | Add tab content in sidebar panel |
| `shared/locators/global.ts` | `globalMessageSnackbar` | Notistack host — needs stable contract review |
| `e2e/project/project.locators.ts` | `project*` domain uiObjects | `project-overview-view`, `project-workflows-view`; re-exports shared library toolbar/cards |

## Specs updated to use shared locators

- `tests/e2e/navigation/top-navigation-fr-001-005.spec.ts`
- `tests/e2e/smoke/authenticated-home.spec.ts`
- `tests/e2e/library/library-page-fr-001-006.spec.ts` — `sortMenuItem`, sort option constants
- `tests/e2e/project/project-workflows-fr-001-004.spec.ts` — shared sort locators
- `tests/e2e/project/project-overview-fr-001-005.spec.ts` — `projectMetadataFieldCreatedOn`, `projectMetadataDisciplinesBlock`, `publishProjectButton`
- `tests/e2e/project/project-archive-fr-001-002.spec.ts` — `archiveProjectMenuItem`

- `tests/e2e/workflow/edit-section-fr-001-012.spec.ts` — FR-SEC-001–012 (parent `edit-section-fr-001-012`)
- `tests/e2e/workflow/delete-section-fr-006.spec.ts` — FR-SEC-006 hover path
- `tests/e2e/workflow/duplicate-section-fr-005.spec.ts` — FR-SEC-005 hover/sidebar/content fidelity; course and program linked-node duplicate
- `tests/e2e/workflow/workflow-header-fr-001-002.spec.ts` — FR-WF-HEADER-001/002
- `tests/e2e/workflow/comments-tab/` — FR-WF-COMMENTS-001–008 (`comments-tab-*.spec.ts`, `comments-presence-fr-008.spec.ts`; helpers remain `comments-tab.helpers.ts`)
- `tests/e2e/workflow/right-sidebar-fr-001-004.spec.ts` — FR-WF-RS-001–004 (partial)
- `tests/e2e/workflow/workflow-overview.locators.ts` — workflowOverviewView, workflowMetadata* (partial)
- `tests/e2e/workflow/workflow-overview-fr-001-007.spec.ts` — FR-WF-OV-001–007 (parent `workflow-overview-fr-001-007`)
- `tests/e2e/workflow/edit-node-fr-001-007.spec.ts` — FR-WF-EN-001–011 (+ FR-WF-EN-012 description; link dialog, tags catalog, commenter/viewer)
- `tests/e2e/workflow/edit-channel-fr-001-009.spec.ts` — FR-CHAN-001–007, FR-CHAN-009 (per-test disposable workflow)
- `tests/e2e/workflow/node-visual-fr-001-005.spec.ts` — FR-WF-NODE-001–005, FR-WF-DUP-002/003 (001: title/border/meta icons/duration/linked indicator; 003 via assign-tab highlight; hover insert/duplicate)
- `tests/e2e/workflow/edit-outcome-fr-001-006.spec.ts` — FR-WF-EO-001–006 (empty state, create, open form, fields/auto-save, commenter/viewer read-only)
- `tests/e2e/workflow/add-tab-fr-001-006.spec.ts` — FR-WF-ADD-001–006 (per-test disposable workflow)
- `tests/e2e/workflow/delete-node-fr-001.spec.ts` — FR-WF-DEL-001 (per-test disposable workflow)
- `tests/e2e/workflow/move-node-fr-001-005.spec.ts` — FR-WF-MV-003/004/005 (per-test disposable workflow)
- `tests/e2e/workflow/move-node.helpers.ts` — node move drag helpers and edge preservation assertions
- `tests/e2e/workflow/duplicate-node-fr-001.spec.ts` — FR-WF-DUP-001 (per-test disposable workflow)
- `tests/e2e/workflow/outcome-insert-ordinals-depth-fr-003-007-008-014.spec.ts` — FR-WF-EO-003/007/008 insert, ordinals, depth cap (per-test disposable workflow)
- `tests/e2e/workflow/outcome-duplicate-delete-fr-009-014.spec.ts` — FR-WF-EO-009–014 duplicate/delete tree effects (per-test disposable workflow; FR-WF-EO-011 `(copy)` suffix)
- `tests/e2e/workflow/outcome-drag-reorder-fr-015-017.spec.ts` — FR-WF-EO-015–017 (+ EO-007 ordinals; per-test disposable workflow)
- `tests/e2e/workflow/edge-fr-001-004.spec.ts` — FR-WF-EDGE-001–004 (per-test disposable workflow; commenter/viewer role blocks)
- `tests/e2e/workflow/workflow-assign-outcome-fr-001-010.spec.ts` — FR-WF-AO-001–010 (per-test disposable workflow; commenter role blocks)
- `tests/e2e/workflow/workflow-graph.locators.ts` — workflowNode*, workflowChannel*, edit form headings
- `tests/e2e/workflow/edge.locators.ts` — workflowEdge*, workflowEditEdgeForm*, workflowNodeEdgeHandle*
- `tests/e2e/workflow/workflow-assign-outcome.locators.ts` — workflowOutcomesAssignTab*, workflowNodeLinkedOutcomes*
- `tests/e2e/workflow/workflow-graph.helpers.ts` — shared graph view API helpers
- `tests/e2e/workflow/edge.helpers.ts` — edge drag/click helpers
- `tests/e2e/workflow/workflow-assign-outcome.helpers.ts` — outcomes tab open, drag assign, drop-target border, highlight, unlink helpers
- `tests/e2e/workflow/workflow.locators.ts` — workflow header/tab shell uiObjects

## Workflow E2E fixture hygiene

- Canonical seed workflows are immutable sources selected by stable asset ID.
- Mutating tests receive and delete a production-path workflow copy per test.
- Read-only tests fail teardown when the selected graph revision changes.
- FR-SEC-003 viewer readOnly remains a product `fixme` until EditSection enforces project team roles.

## Not yet ported (YAML entries remain semantic-only)

- Auth/register pages (`loginPage`, `registerForm`, …) — no e2e specs yet
- Workflow graph/node/outcome bulk (`workflowNode*`, `workflowOutcome*`, …) — partial via `workflow.ts`
- Explore page discipline filter buttons — `explore-page-fr-001-006.spec.ts` still uses inline role/label selectors
- User profile validation copy — `profile-settings-fr-001-005.spec.ts`
- Legacy `feature-name.spec.ts` — skipped calibration file; superseded by `edit-section-fr-001-012` (delete when ready)

## Validation status

| Method | Status |
| --- | --- |
| Playwright report (localhost:9323) | 81 passed / 4 failed before slice 3 (historical `edit-section-fr-phase2`) |
| `yarn test` full suite (after slice 3) | **92 passed / 39 skipped / 3 failed** (edit-section parallel pollution; reseed before run) |
| Slice 4 workflow specs (after reseed) | **13 passed / 1 skipped** — node-hover, channel-insert-border, outcome-dup-del, delete-node |
| `edit-section-fr-001-012.spec.ts` | FR-SEC-001–012 under parent `edit-section-fr-001-012` |

Re-validate with `just e2e-prepare` then `cd tests && yarn test` when the E2E stack is running.
