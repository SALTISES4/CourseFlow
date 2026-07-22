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

- `tests/e2e/workflow/edit-section-fr-007-012.spec.ts` — FR-SEC-007, FR-SEC-010, FR-SEC-011
- `tests/e2e/workflow/delete-section-fr-006.spec.ts` — FR-SEC-006 hover path
- `tests/e2e/workflow/duplicate-section-fr-005.spec.ts` — FR-SEC-005 hover path
- `tests/e2e/workflow/workflow-header-fr-001-002.spec.ts` — FR-WF-HEADER-001/002
- `tests/e2e/workflow/comments-tab-section-fr-002.spec.ts` — FR-WF-COMMENTS-002
- `tests/e2e/workflow/right-sidebar-fr-001-004.spec.ts` — FR-WF-RS-001–004 (partial)
- `tests/e2e/workflow/comments-tab-fr-005.spec.ts` — FR-WF-COMMENTS-005 (section, node, channel, outcome)
- `tests/e2e/workflow/workflow-overview.locators.ts` — workflowOverviewView, workflowMetadata* (partial)
- `tests/e2e/workflow/comments-tab-compose-delete-fr-006-007.spec.ts` — FR-WF-COMMENTS-006/007 (section, partial)
- `tests/e2e/workflow/workflow-overview-fr-001-002.spec.ts` — FR-WF-OV-001/002 (activity, partial)
- `tests/e2e/workflow/comments-tab-node-fr-001.spec.ts` — FR-WF-COMMENTS-001
- `tests/e2e/workflow/comments-tab-channel-fr-003.spec.ts` — FR-WF-COMMENTS-003
- `tests/e2e/workflow/comments-presence-fr-008.spec.ts` — FR-WF-COMMENTS-008 (deferred)
- `tests/e2e/workflow/edit-node-fr-001-007.spec.ts` — FR-WF-EN-001–007 (activity/course/program field sets)
- `tests/e2e/workflow/edit-channel-fr-001.spec.ts` — FR-CHAN-001
- `tests/e2e/workflow/comments-tab-outcome-fr-004.spec.ts` — FR-WF-COMMENTS-004
- `tests/e2e/workflow/workflow-overview-fr-003.spec.ts` — FR-WF-OV-003 (deferred)
- `tests/e2e/workflow/node-visual-fr-001-005.spec.ts` — FR-WF-NODE-001–005 (partial)
- `tests/e2e/workflow/edit-channel-fr-002-007.spec.ts` — FR-CHAN-002/003/007
- `tests/e2e/workflow/edit-outcome-fr-004.spec.ts` — FR-WF-EO-004
- `tests/e2e/workflow/add-tab-fr-001-006.spec.ts` — FR-WF-ADD-001–006 (004–006 pristine)
- `tests/e2e/workflow/comments-tab-compose-delete-hosts.spec.ts` — FR-WF-COMMENTS-006/007 (node, channel, outcome)
- `tests/e2e/workflow/edit-outcome-fr-005-006.spec.ts` — FR-WF-EO-005/006
- `tests/e2e/workflow/delete-node-fr-001.spec.ts` — FR-WF-DEL-001 (serial, pristine)
- `tests/e2e/workflow/duplicate-node-fr-001.spec.ts` — FR-WF-DUP-001 (serial, pristine)
- `tests/e2e/workflow/delete-channel-fr-006.spec.ts` — FR-CHAN-005/006 (serial, pristine)
- `tests/e2e/workflow/node-hover-fr-002-005.spec.ts` — FR-WF-NODE-005, FR-WF-DUP-002/003 (serial, section 3)
- `tests/e2e/workflow/channel-insert-border-fr-004-009.spec.ts` — FR-CHAN-004/009 (serial, pristine)
- `tests/e2e/workflow/outcome-duplicate-delete-fr-009-014.spec.ts` — FR-WF-EO-009–013 (serial)
- `tests/e2e/workflow/workflow-overview-fr-004-007.spec.ts` — FR-WF-OV-004–007 (deferred)
- `tests/e2e/workflow/workflow-graph.locators.ts` — workflowNode*, workflowChannel*, edit form headings
- `tests/e2e/workflow/workflow.locators.ts` — workflow header/tab shell uiObjects

## Workflow E2E fixture hygiene

- `tests/helpers/workflow-pristine.ts` — `skipUnlessPristineWorkflow()` guards display/mutation specs when shared workflow DB state is polluted
- `edit-section-fr-001-006` FR-SEC-003 title mutation uses `E2E Section 3` (preserves `E2E Section 1` for FR-SEC-002)
- `edit-section-fr-phase2` serial mutations track `expectedSectionCount` across insert/duplicate/delete
- FR-SEC-003 viewer readOnly test skipped until workflow EditSection enforces project team roles

## Not yet ported (YAML entries remain semantic-only)

- Auth/register pages (`loginPage`, `registerForm`, …) — no e2e specs yet
- Workflow graph/node/outcome bulk (`workflowNode*`, `workflowOutcome*`, …) — partial via `workflow.ts`
- Explore page discipline filter buttons — `explore-page-fr-001-006.spec.ts` still uses inline role/label selectors
- User profile validation copy — `profile-settings-fr-001-005.spec.ts`
- Legacy `feature-name.spec.ts` — skipped calibration file; inline selectors retained

## Validation status

| Method | Status |
| --- | --- |
| Playwright report (localhost:9323) | 81 passed / 4 failed before slice 3 (all `edit-section-fr-phase2`) |
| `yarn test` full suite (after slice 3) | **92 passed / 39 skipped / 3 failed** (edit-section parallel pollution; reseed before run) |
| Slice 4 workflow specs (after reseed) | **13 passed / 1 skipped** — node-hover, channel-insert-border, outcome-dup-del, delete-node |
| `edit-section-fr-007-012.spec.ts` | **7 passed / 2 skipped** (commenter + viewer role gaps) |

Re-validate with `just rebuild-e2e-db` then `cd tests && yarn test` when the E2E stack is running.
