# ADR: AI-Assisted Playwright Test Generation

## Status

Accepted.

## Context

CourseFlow generates Playwright E2E tests from normalized functional requirements under `tests/docs/requirements/features/`. A shared locator registry (`tests/docs/requirements/features/shared/canonical_locators.yaml`) groups uiObjects used across routes and domains.

Coding agents and engineers need a single architectural decision record that defines:

- which documents govern generation
- how requirement uiObjects map to TypeScript locator files
- when selectors are acceptable vs must be escalated
- how exploratory tooling (Playwright MCP) relates to committed test code

Without this ADR, generation tends to invent brittle DOM structure selectors block-by-block instead of following project contracts.

## Decision

### 1. Governing document set (mandatory)

Before generating or materially revising locators or specs, the generator **must read**:

1. `tests/docs/requirements/features/<domain>/*_requirements_v1.yaml` (in-scope FRs)
2. `tests/docs/requirements/features/shared/canonical_locators.yaml` (uiObject registry)
3. `tests/docs/testing/locator_contract_policy.md`
4. `tests/docs/testing/test_suite_layout.md`
5. `tests/docs/testing/playwright_authoring_standard.md`
6. `tests/docs/testing/ai_test_generation_workflow.md`
7. `tests/docs/prompts/test_spec_generation.md` (when generating specs)

Exploratory browser tooling is governed by `browser_automation_tooling_guide.md`. MCP validates selectors; it does not override locator policy.

**Agents do not automatically retain ADR context across sessions.** Each generation run must re-load the governing documents listed above. Reviewers should reject output that clearly violates `locator_contract_policy.md` even when requirements are otherwise correct.

### 2. Source-of-truth hierarchy

When sources conflict, use this order:

1. Feature-specific requirement YAML in `tests/docs/requirements/features/`
2. `canonical_locators.yaml` uiObject name and semantic strategy
3. `locator_contract_policy.md` and `playwright_authoring_standard.md`
4. Live DOM observation (Playwright MCP / `playwright-cli` / test execution)
5. Figma and design evidence (intent only — never final selectors)
6. Current implementation convenience

### 3. Locator file organization

Requirement registry and Playwright implementation are related but not identical file-for-file.

| Layer | Location | Role |
| --- | --- | --- |
| Canonical registry | `tests/docs/requirements/features/shared/canonical_locators.yaml` | Names and semantic strategies for uiObjects shared across FRs |
| Cross-domain locators | `tests/shared/locators/` | TypeScript factories for uiObjects used by **two or more** `tests/e2e/<domain>/` folders |
| Domain locators | `tests/e2e/<domain>/*.locators.ts` | Domain-owned uiObjects; **re-export** shared factories instead of duplicating |
| Spec-local locators | Inline in `*.spec.ts` | Allowed only when the selector is used in **one** spec and is **not** a named canonical uiObject |

Rules:

- **Group when shared.** If `canonical_locators.yaml` defines an object used on library and project workflows views (e.g. `keywordSearchField`, `libraryFilterToolbar`), implement once in `tests/e2e/library/library.locators.ts` and re-export from `tests/e2e/project/project.locators.ts` — do not copy selector strings.
- **Colocate when local.** Project-only uiObjects (`projectOverviewView`, `projectMetadataFieldDisciplines`) stay in `tests/e2e/project/project.locators.ts`.
- **Promote when reused.** When a second domain imports the same locator, move it to `tests/shared/locators/` or the owning domain file and re-export.
- **Incremental generation is expected.** Specs and locators may be produced FR-slice by FR-slice; each slice must still respect shared grouping and locator policy.

Function names in `*.locators.ts` should match canonical uiObject names where practical (e.g. `projectTitle`, `keywordSearchField`).

### 4. Locator policy is binding

All committed selectors must comply with `locator_contract_policy.md`.

The following are **not acceptable** in committed locator code unless explicitly escalated with a project-approved `data-test-id` (or equivalent) added to React:

- XPath axes (`ancestor::`, `following-sibling::`, etc.)
- MUI / Emotion generated class fragments (`MuiStack-root`, `MuiToolbar-root`, `MuiInputBase-root`, `MuiSkeleton-root`, …)
- Layout-only wrappers (`.main-block`, `.main-wrapper`) as the primary anchor
- Deep descendant chains through presentational structure
- Selectors invented from Figma or YAML strategy text without live DOM validation

When no stable selector exists, the generator must **not** quietly use forbidden fallbacks. Follow `locator_contract_policy.md` § **When to add `data-test-id`** (check existing contracts → MCP validate → add `data-test-id` or block).

### 5. Generation workflow

Follow `ai_test_generation_workflow.md`:

1. Requirement ingestion
2. Decomposition
3. UI vocabulary mapping (`mapping_fr_ui.md`, `canonical_locators.yaml`)
4. Live DOM validation (Playwright MCP / CLI on `courseflow_e2e`)
5. Write `*.locators.ts` then `*.spec.ts`
6. Execute and refine
7. Human review (`generated_test_review_checklist.md`)
8. Merge or return for clarification

### 6. Committed artifact boundary

Final artifacts are standard Playwright tests:

- `tests/e2e/**/*.spec.ts`
- `tests/e2e/**/*.locators.ts`
- `tests/shared/locators/**`

No MCP, CLI, or agent-runtime code in committed tests.

## Consequences

- Generators have an explicit checklist and cannot claim ambiguity about structural/MUI selectors — they are forbidden.
- Shared canonical objects consolidate in one TypeScript module per owning domain; project/library duplication is a review failure.
- Missing `adr_ai_test_generation.md` was a documentation gap; this file is now the architectural anchor referenced by prompts and README.
- Existing locator files may contain pre-policy violations; new generation must not add more, and refactors should align slices as they are touched.

## Related documents

- `locator_contract_policy.md`
- `test_suite_layout.md`
- `ai_test_generation_workflow.md`
- `browser_automation_tooling_guide.md`
- `tests/docs/prompts/test_spec_generation.md`
- `tests/docs/requirements/features/shared/canonical_locators.yaml`
