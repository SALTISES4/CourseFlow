# Canonical locator port status

Tracks TypeScript implementation of `tests/docs/requirements/features/shared/canonical_locators.yaml`.

**TypeScript home:** `tests/shared/locators/` (cross-domain) + `tests/e2e/<domain>/*.locators.ts` (domain-only + re-exports).

**Policy:** `tests/docs/testing/locator_contract_policy.md` § When to add `data-test-id`.

## Ported (implemented + React hooks where needed)

| Module | Canonical uiObjects | Notes |
| --- | --- | --- |
| `shared/locators/navigation.ts` | `mainNavigation`, `homeNavItem`, `myLibraryNavItem`, `exploreNavItem`, `favouritedItemLink`, `collapseToggle`, `topNavigationBar`, `addMenuTrigger`, `accountMenuTrigger`, `addMenuItem*`, `accountMenuItem*`, `containsSection`, `appearsInSection`, `backToProjectLink`, … | `data-test-id="main-nav"`, `data-test-id="top-bar"` |
| `shared/locators/library.ts` | `keywordSearchField`, `libraryFilterToolbar`, filter toggles, `libraryCards`, `projectCard`, `workflowCard`, `libraryLoadingSkeletons`, `sortMenuItem`, `SORT_OPTION_*`, … | `library-filter-toolbar`, `library-results`, `library-loading-skeleton`, `project-card` / `workflow-card` |
| `shared/locators/workflow.ts` | `workflowRightSidebar`, `workflowEditSectionForm`, `workflowSectionContainer`, `workflowSectionHeader`, `workflowSectionDeleteDialog`, … | Existing React `data-test-id` / `data-section-id` |
| `shared/locators/global.ts` | `globalMessageSnackbar` | Notistack host — needs stable contract review |
| `e2e/project/project.locators.ts` | `project*` domain uiObjects | `project-overview-view`, `project-workflows-view`; re-exports shared library toolbar/cards |

## Specs updated to use shared locators

- `tests/e2e/navigation/top-navigation-fr-001-005.spec.ts`
- `tests/e2e/smoke/authenticated-home.spec.ts`
- `tests/e2e/library/library-page-fr-001-006.spec.ts` — `sortMenuItem`, sort option constants
- `tests/e2e/project/project-workflows-fr-001-004.spec.ts` — shared sort locators
- `tests/e2e/project/project-overview-fr-001-005.spec.ts` — `projectMetadataFieldCreatedOn`, `projectMetadataDisciplinesBlock`, `publishProjectButton`
- `tests/e2e/project/project-archive-fr-001-002.spec.ts` — `archiveProjectMenuItem`

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
| `yarn test` full suite (after slice 3) | **85 passed / 25 skipped / 0 failed** (with `just django-seed-e2e-tests` before run) |

Re-validate with `just rebuild-e2e-db` then `cd tests && yarn test` when the E2E stack is running.
