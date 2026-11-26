# Jira regression coverage audit — 2026-11-25

## Purpose

Track recent Jira defects whose specific failure modes are not adequately preserved in the canonical functional requirements and/or automated tests.

This document is an audit backlog, not a functional source of truth. Product behavior must be recorded in `tests/docs/requirements/` before an item is considered resolved, in accordance with `docs/architecture/adr_functional_requirements_source_of_truth.md`.

## Scope and evidence

- Source: Jira CSV export supplied on 2026-11-25 (`Jira (1).csv`; SHA-256 `c270be8b02302698880c15b0fffda9211f6abe76caddecd5a055b0553252ae1c`).
- Review window: issues updated from 2026-09-30 through 2026-11-25, inclusive.
- Reviewed: 57 of 74 exported issues.
- Repository evidence: current `tests/docs/requirements/`, current Playwright specifications and helpers, and relevant Git history.
- Audit type: initial static review followed by focused remediation runs; verification details are recorded below.
- Excluded from gap findings: operational/setup work, epics without implemented behavior, `Parking lot`, `Won't do`, and issues whose defect-specific behavior is already materially represented in both requirements and tests.

A fixing commit without a test or requirement change was treated only as a warning signal. Each finding was checked against the current semantic coverage; Jira keys are not normally embedded in the requirement and test files.

## Resolution rule

An item can be marked resolved only when all applicable work is complete:

1. Product intent is explicit in the appropriate file under `tests/docs/requirements/`.
2. A focused regression test reproduces the reported failure mode and fails against the defective behavior.
3. The test uses the cheapest stable layer that protects the behavior. Exact styling may belong in a component or visual-regression test rather than a brittle end-to-end test.
4. Any existing requirement or test that encodes conflicting behavior is corrected only after product intent is confirmed.
5. The relevant focused test and an appropriate surrounding suite pass.

Coverage-state meanings:

- **Missing** — the defect-specific behavior is absent.
- **Partial** — the general feature is covered, but the reported failure mode is not.
- **Recorded** — the requirement contains the behavior, but focused test coverage is missing.
- **Conflicting** — current requirement/test truth disagrees with the implemented or Jira-stated behavior and needs explicit reconciliation.

## Behavioral and correctness findings

| Tracking | Jira issue | Requirement state | Test state | Defect-specific gap / required regression |
| --- | --- | --- | --- | --- |
| Resolved — FR-WF-OT-012; `outcome-table-summary-fr.spec.ts` | COURSEFLOW-700 — Competency Matrix Grand total | Recorded | Covered | Requires the final `Grand total` row, empty outcome cells, decimal-hour totals for every applicable course/program summary column, blank Credits, and totals independent of presentation grouping. The focused and surrounding Outcome Table suites pass. |
| Resolved — FR-CAB-008/009; `outcome-table-header-presentation-fr.spec.ts`, `outcome-table-layout-grouping-fr.spec.ts` | COURSEFLOW-698 — Sort/View Settings post-action dismissal | Recorded | Covered | Requires completed Expand/Collapse and Sort menu-row actions to apply their state and dismiss their menu without an outside click or Escape, while embedded tag toggles remain open for successive filtering. Focused and surrounding Outcome Table presentation suites pass. |
| Resolved — FR-SEC-009; `edit-section-fr-001-012.spec.ts` | COURSEFLOW-701 — Section reordering marker | Recorded | Covered | Requires the section reorder drop indicator only while a valid destination is targeted and requires complete cleanup after both finalized and aborted drags. The full FR-SEC-009 Playwright slice passes. |
| Resolved — FR-CARD-001; `card-content-fr-001-006.spec.ts` | COURSEFLOW-706 — Project-card workflow count | Recorded | Covered | Defines the count as non-archived workflows only and independently creates a project with one active and one archived workflow before asserting the card displays `1 workflow`. The focused Playwright regression passes. |
| Coverage added — failing known defect; FR-PROJ-OV-005; `project-overview-fr-001-005.spec.ts` | COURSEFLOW-707 — Project tag cache propagation | Recorded | Covered — failing | Requires a newly created project tag to be available immediately in child-workflow tag controls without page refresh. The focused regression primes the child-workflow project-tag cache, creates a tag, returns through in-app navigation, and fails because the cached autocomplete omits the new tag. Jira remains `Selected for Development`; production code was not changed. |
| Coverage added — failing identity defect; FR-WS-LOCK-003; `workspace-edit-lock-fr-001-005.spec.ts` | COURSEFLOW-713 — Current user's edit tag | Recorded | Covered — failing | Requires the current holder's own card to omit the tag, while a different user's card shows it even when both users have the same display name. The self-held assertion passes; the distinct same-name assertion fails because commit `5c8b9828` compares display names rather than user identity. Production code was not changed. |
| Resolved — FR-WF-AO-001/002; `workflow-assign-outcome-fr-001-010.spec.ts` | COURSEFLOW-715 — Outcomes sidebar help text | Recorded | Covered | Prohibits the legacy help subtitle in the populated Outcomes sidebar and retains the workflow-type-specific plain explanatory message only in the zero-outcome state. Focused populated- and empty-state Playwright regressions pass. |
| Coverage added — failing stale-response defect; FR-SEC-003 and FR-CHAN-003; `edit-section-fr-001-012.spec.ts`, `edit-channel-fr-001-009.spec.ts` | COURSEFLOW-681 — Section/node-category autosave clobbering | Recorded | Covered — failing | Delays the first completed save response while a newer title is entered. Both fields retain the latest text, but the older response then reverts the section/node-category canvas header to the stale prefix. The newer request did succeed; client state lacks response-order protection. Production code was not changed. |
| Resolved — FR-WF-EO-006; `edit-outcome-fr-001-006.spec.ts` | COURSEFLOW-692 — Outcome Title/Code disappearing | Recorded | Covered | Requires Title and Code to remain continuously stable while an older auto-save response completes. The regression deliberately delivers an older response after the newer one, verifies both fields remain intact, reloads, and confirms the combined Code/Title header persisted. Focused Playwright coverage passes. |
| Coverage added — failing known defect; FR-WF-EN-012; `edit-node-fr-001-007.spec.ts` | COURSEFLOW-680 — Rich-text paste sanitization | Recorded | Covered — failing | Uses the browser's rich clipboard to paste external headings, spans, inline font/colour/background styles, blockquotes, tables, and an image alongside supported formatting. The persisted editor content still contains unsupported `h1`, `span`, `blockquote`, and `img` elements plus external attributes, proving that the eight-control toolbar does not restrict clipboard formats. Production code was not changed. |
| Resolved — FR-WF-AO-009; `workflow-assign-outcome-fr-001-010.spec.ts` | COURSEFLOW-703 — Linked-outcomes popover order | Recorded | Covered | Creates two root outcomes and two nested siblings, assigns them to a node in deliberately reversed order, expands the popover hierarchy, and verifies both top-level and nested rows follow outcome-tree ordinals. The focused Playwright regression passes. |
| Resolved — FR-WF-EDGE-003; `edge-fr-001-004.spec.ts` | COURSEFLOW-668 — Edge source reconnection | Recorded | Covered | Adds source-end regressions for changing only the departure handle on the existing source node and moving the source endpoint to a different valid node. Both assert edge identity, untouched target endpoint, and canonical persisted source port; the focused Playwright slice passes. |

## UI and presentation findings

| Tracking | Jira issue | Requirement state | Test state | Defect-specific gap / required regression |
| --- | --- | --- | --- | --- |
| Resolved — FR-WF-ADD-004; `add-tab-fr-001-006.spec.ts` | COURSEFLOW-660 — Row-mode add affordance | Recorded | Covered | Holds a category drag over an occupied Row-mode row whose matching channel cell is empty, verifies exactly one single-channel insertion line and no filled cell-hover state, then cancels the drag and verifies no node was created. Focused Playwright coverage passes. |
| Resolved — FR-CARD-004; `card-content-fr-001-006.spec.ts` | COURSEFLOW-705 — Initial workflow loaders | Recorded | Covered | Reconciled to the Jira clarification: authenticated initial workflow loading shows the one global network-activity loader and omits the legacy centered workflow loader; moving the global loader to the centre remains a separate change. The request-held Playwright regression passes. |
| Resolved — FR-NAV-001; `main-navigation-fr-001-013.spec.ts` | COURSEFLOW-714 — Main-menu loader | Recorded | Covered | Holds both the favourites and workflow-context related-workflow requests, verifies the main navigation remains usable and contains no local `.load-screen`, then releases both requests. Focused Playwright coverage passes. |
| Resolved — FR-WF-OT-004 and FR-WF-NODE-001; `outcome-table-sticky-fr.spec.ts` | COURSEFLOW-704 — Outcome Table/sidebar overlap | Recorded | Covered | Verifies the actual inner `.workflow-scrollable` viewport in both Outcome Table and Graph: overflowing content moves, while global navigation, workflow tabs, and the Graph sidebar retain their viewport positions and the scroll viewport remains to the right of global navigation. The older sticky test was reconciled to scroll this post-refactor container. Focused Playwright coverage passes. |
| Resolved — FR-CHAN-002; `outcome-table-sticky-fr.spec.ts` | COURSEFLOW-688 — Sticky Node category header | Recorded | Covered | Builds vertically overflowing Workflow content, scrolls the actual `.workflow-scrollable` viewport, and verifies the Node category header retains its viewport position immediately below the workflow tabs while section content moves beneath it. Focused Playwright coverage passes. |
| Resolved — FR-WF-NODE-004/006 and FR-WF-AO-007; `node-visual-fr-001-005.spec.ts` | COURSEFLOW-686 — Node action-menu placement | Recorded | Covered | Verifies non-overlapping menu/top-handle/badge geometry, the specified `#E9EEF0` hover backgrounds, a normal badge click opening its popover, and a top-handle gesture producing a link-preview path while the menu is initially visible. Focused Playwright coverage passes. |
| Resolved — FR-WF-OT-001; `outcome-table-layout-grouping-fr.spec.ts` | COURSEFLOW-697 — Outcome Table bottom border | Recorded | Covered | Requires every Normal-layout tag group, including the first and final groups, to close with a continuous one-pixel solid divider across the assignment region. The regression creates three groups and verifies the computed border and non-zero rendered span for each group. |
| Resolved — FR-WF-OT-001/002; `outcome-table-layout-grouping-fr.spec.ts` | COURSEFLOW-694 — Outcome Table header height | Recorded | Covered | Records the intended approximately 200 px angled-header region as a tolerant 200–240 px rendered contract and verifies it in the Normal layout without an exact-pixel snapshot. |
| Resolved — FR-WF-OT-001/002; `outcome-table-layout-grouping-fr.spec.ts` | COURSEFLOW-693 — Outcome Table alignment | Recorded | Covered | Requires angled headers and their assignment cells to share a horizontal column anchor. The regression compares transform-independent layout offsets for a named node header and its named assignment cell. |
| Resolved — FR-TOP-005; `top-navigation-fr-001-005.spec.ts` | COURSEFLOW-716 — Return-to-project link style | Recorded | Covered | Requires typography parity with the small workflow `View settings` and `Jump to` controls and a compact leading `ChevronLeft` glyph no larger than 20 px. The existing navigation regression now verifies the computed typography, icon identity/geometry, and destination together. |
| Resolved — FR-WF-EN-012; `workflow-description-rich-text.ts`, node/outcome editor helpers | COURSEFLOW-690 — Rich-text control glyphs | Recorded | Covered | Reconciled with the later replacement of the custom editor by React Quill: every shared-editor assertion now verifies Quill's italic control has two horizontal caps plus a slanted stem and its underline control has a U-shaped path plus a distinct lower stroke. Workflow, node, and outcome editor regressions all consume the shared glyph assertion while retaining the original eight-control restriction. |
| Resolved — FR-WF-OV-002; `workflow-overview-fr-001-007.spec.ts` | COURSEFLOW-691 — Rich-text rendering in Overview | Recorded | Covered | Requires supported persisted HTML to render as elements rather than literal source and requires the read-only rich-text content to inherit the application's Open Sans font stack. The regression patches representative supported HTML, verifies the resulting element structure, rejects visible raw tags, and compares computed font families. |
| Resolved — FR-WF-OV-001 and FR-PROJ-OV-001; workflow/project Overview specs | COURSEFLOW-653 — Overview spacing | Recorded | Covered | Requires 16 px between information-block labels and content and between content children. Regressions measure Description and Permissions/Contributors label gaps in both Overview surfaces and the project contributor-list-to-visibility-warning gap that motivated the shared content wrapper fix. |
| Resolved — FR-WF-EDGE-004; `edge-fr-001-004.spec.ts` | COURSEFLOW-657 — Edge-title canvas presentation | Recorded | Covered | Extends the existing persistence regression to require and verify centered black 12 px SVG text, middle anchoring/baseline, and a white rounded background that contains the title and shares its visual centre. The canonical edge/title locators were reconciled to the current `data-edge-id` SVG structure. |
| Resolved — FR-SEC-001; `edit-section-fr-001-012.spec.ts` | COURSEFLOW-682 — Section title field label | Recorded | Covered | The Edit section form regression now directly asserts the title input's accessible name is exactly `Title` and that no field labeled exactly `Section` exists, in addition to its value and edit-form assertions. |

## Reconciled product decision

| Tracking | Jira issue | Current recorded truth | Decision needed |
| --- | --- | --- | --- |
| Resolved — FR-CAB-006/008; `view-settings-fr-cab-006.spec.ts` | COURSEFLOW-659 — View Settings controls | Commit `0fd62e07` explicitly replaces the visual Checkbox with MUI Switch for tag visibility; MUI Switch intentionally retains a native checkbox input and role. | Requirements now distinguish switch presentation from checkbox accessibility semantics. The regression verifies `.MuiSwitch-root`, the checkbox input/checked contract, and absence of `.MuiCheckbox-root`; existing interaction tests continue to use the semantic role. |

## Verification blockers discovered during remediation

These are implementation regressions already protected by canonical requirements and Playwright coverage. They are not missing-coverage findings, but they currently prevent affected audit items from satisfying the surrounding-suite rule.

| Discovered | Area | Existing truth | Current failure |
| --- | --- | --- | --- |
| 2026-11-26 — Resolved | Outcome Table assignment-cell semantics and permissions | FR-WF-OT-005 and FR-WF-OT-007; `outcome-table-fr-001-011.spec.ts` and `outcome-table-header-presentation-fr.spec.ts` | Restored named checkbox semantics, checked/mixed state, keyboard focus presentation, and permission/edit-lock-derived disabled state. |
| 2026-11-26 — Resolved | Outcome Table sort, grouping, and presentation lifecycle | FR-CAB-008, FR-CAB-009, FR-WF-OT-001, FR-WF-OT-002, FR-WF-OT-008, and FR-WF-OT-011; `outcome-table-header-presentation-fr.spec.ts` and `outcome-table-layout-grouping-fr.spec.ts` | Restored workflow-type-specific options, active selection, section-scoped stable ordering across both layouts, state lifecycle, named tag bands/filtering, and truncated-header tooltips. Final four-spec run: 19 passed. |

## Focused remediation verification — 2026-11-26

- 15 focused application-test invocations passed for the UI/presentation batch: COURSEFLOW-697, 694, 693, 716, 690, 691, 653, 657, 682, and the reconciled COURSEFLOW-659 switch contract.
- Both Normal and Competency Matrix Outcome Table geometry assertions passed; the three-tag bottom-border regression passed.
- Shared React Quill glyph assertions passed on workflow, node, and outcome editor hosts.
- The first edge-title run failed because the new test used an SVG XPath sibling locator that did not resolve; changing only the test locator to scope the sibling `rect` through the title's parent made the same presentation assertion pass. No production code was changed for this remediation batch.
- Requirement YAML files changed in this UI/presentation batch parse successfully. Repository-wide requirement parsing is not a valid gate yet because unrelated baseline files, including `library_page_requirements_v1.yaml` and `workflow_add_tab_requirements_v1.yaml`, already contain YAML syntax errors in `HEAD`.

## Issues checked and not currently flagged

The audit found materially relevant requirement and regression coverage for, among others:

- COURSEFLOW-643 — home-page welcome banner ownership rule
- COURSEFLOW-661 — linked-outcome hierarchy colour pattern
- COURSEFLOW-675 — contributor selector no-input/no-results distinction
- COURSEFLOW-678 — forgot-password email delivery
- COURSEFLOW-679 — Outcome Table eligibility
- COURSEFLOW-685 — unset node time with other metadata present
- COURSEFLOW-687 — blank Node category field versus `Untitled node category` canvas fallback
- COURSEFLOW-695 — mixed tagged/untagged Outcome Table grouping
- COURSEFLOW-699 — course Competency Matrix total-hours calculations
- COURSEFLOW-708 and COURSEFLOW-709 — template availability in create and Explore flows
- COURSEFLOW-710 — Outcome Table tag labels
- COURSEFLOW-712 and related duration issues — Hours/Minutes editing and exact-minute display rules

These are not proof of complete feature coverage; they were excluded because the Jira-reported defect itself is represented in both current requirements and tests.

## Maintenance

- Update the `Tracking` cell to `Resolved` only after the resolution rule above is satisfied.
- Add the requirement ID and test file beside the finding when resolving it.
- If product rejects a Jira-stated behavior, use `Closed — product decision` and link the authoritative decision; do not silently change the test to match implementation.
- Append later audit dates rather than overwriting the original source window and evidence.
