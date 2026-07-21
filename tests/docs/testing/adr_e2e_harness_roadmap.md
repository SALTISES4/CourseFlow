# ADR: E2E harness roadmap (Playwright + fixtures + FR-driven generation)

## Status

Accepted — Phase 2 in progress

## Date

2026-06-23

## Context

CourseFlow browser E2E tests must be generated from functional requirements under `tests/docs/requirements/`, executed locally in Playwright UI Mode, and eventually run in CI. The stack is a **real** browser against Vite, Django, and Postgres — not mocks.

Infrastructure already in place:

- Requirement YAML specs and `canonical_locators.yaml`
- Test-generation policy (`tests/docs/testing/`)
- Separate logical database `courseflow_e2e` on the single Postgres compose service
- Deterministic E2E fixtures (`course_flow/e2e_seed/`) and manifest (`tests/.playwright-fixtures/workflow.json`)
- Auth setup project (storage state)
- Calibration specs for edit-section (partial FR coverage)

Gaps blocking FR-driven generation at scale:

- Playwright does not load the fixture manifest automatically
- Specs still depend on manual `PLAYWRIGHT_WORKFLOW_PATH` in `tests/.env`
- `test.extend` workflow fixture not implemented
- No single `just` recipe to prepare the E2E database + manifest
- Deferred edit-section FRs need fixture helpers (blank section, roles)
- Legacy specs (`ai-guided.spec.ts`) use pre-rebuild selectors

## Decision

Implement the harness in **five phases**. Each phase has an exit criterion before expanding scope.

Phases 1–3 are required before broad AI generation from requirement YAML. Phases 4–5 scale domains and CI.

---

## Phase 1 — Runnable harness (manifest + fixtures)

**Goal:** After `just e2e-prepare`, `yarn test-ui` runs without manual env copying.

| # | Work item | Status |
|---|-----------|--------|
| 1.1 | `globalSetup` — fail fast if manifest missing | Done |
| 1.2 | `tests/helpers/manifest.ts` — load/validate `workflow.json` | Done |
| 1.3 | `tests/fixtures/workflow.ts` — `test.extend({ workflow })` | Done |
| 1.4 | Migrate `edit-section-fr-001-006.spec.ts` to fixtures | Done |
| 1.5 | `just e2e-prepare` — idempotent E2E DB + seed + manifest | Done |
| 1.6 | Document E2E stack (`django-run-e2e` + `frontend-dev`) in runbook | Done |

**Fixture API (contract):**

```typescript
workflow.path              // /workflow/{uuid}/graph
workflow.graphUuid
workflow.sections          // ordered SectionEntry[]
workflow.sectionByPosition(n)
workflow.sectionByTitle(title)
workflow.blankSection()    // title === ""
workflow.firstSection()
```

**Exit criterion:** `yarn test-ui` → setup + FR-SEC-001/003/006 pass after `just e2e-prepare` with no `PLAYWRIGHT_WORKFLOW_PATH` in `tests/.env`.

---

## Phase 2 — Complete edit-section fixture contract

**Goal:** Deferred FRs in `edit-section-fr-001-006.spec.ts` become generatable and green.

| FR | Fixture / harness need | Spec status |
|----|------------------------|-------------|
| FR-SEC-002 | `workflow.blankSection()` + section numbering assertions | `edit-section-fr-phase2.spec.ts` |
| FR-SEC-004 / 005 | Known section order; count before/after insert/duplicate | `edit-section-fr-phase2.spec.ts` |
| FR-SEC-006 confirm delete | Delete last titled section (`E2E Section 3`) | `edit-section-fr-phase2.spec.ts` |
| FR-SEC-003 viewer/commenter | `manifest.contributors` — teacher editor, student viewer | viewer spec in phase2 |
| FR-SEC-001 branch | Sidebar already open — same graph fixture | `edit-section-fr-phase2.spec.ts` |

**Backend (Phase 2):**

- `course_flow/e2e_seed/team.py` — `teacher@courseflow.com` (owner), dedicated editor/commenter accounts, and `student@courseflow.com` (viewer)
- Manifest `fixture_version: 3` with `primary_user`, `contributors[]`, and FR-HOME-003 recent-project fixtures

**Exit criterion:** Phase 2 specs pass in UI Mode after `just e2e-prepare`. Commenter role variants deferred.

---

## Phase 3 — FR → spec generation loop

**Goal:** Repeatable process for any requirement file.

Per feature slice:

1. Pick FR IDs from `*_requirements_v1.yaml`
2. Verify fixture contract — extend `e2e_seed` if preconditions missing
3. Map `canonical_locators.yaml` → colocated `*.locators.ts`
4. Live DOM validation on `courseflow_e2e` (Playwright MCP per `browser_automation_tooling_guide.md`, or Playwright UI Mode)
5. Generate spec via `tests/docs/prompts/test_spec_generation.md`
6. Review against `generated_test_review_checklist.md`
7. Run `yarn test-ui -g "FR-…"`

**Housekeeping:**

- Remove or quarantine `tests/e2e/workflow/ai-guided.spec.ts` (legacy selectors)
- Keep one reference spec per domain as template

**Exit criterion:** One new FR generated from YAML, reviewed, green in UI Mode, merged — no manual UUID steps.

---

## Phase 4 — Scale to more domains

| Order | Domain | Prerequisite |
|-------|--------|--------------|
| 1 | Edit section (complete) | Current workflow fixture |
| 2 | Delete section (hover menu) | Same fixture |
| 3 | Login / home smoke | Auth only |
| 4 | Library / project create | New E2E fixture project |
| 5 | Workflow node / channel | Richer graph fixture |

Each domain requires: E2E fixture extension, colocated locators, `feature-fr-XXX-YYY.spec.ts`.

Do not generate specs for domains without a documented fixture contract.

---

## Phase 5 — CI

1. CircleCI: Postgres → `e2e-prepare` → Django (`POSTGRES_DB=courseflow_e2e`) + Vite
2. `yarn test` headless
3. Publish Playwright HTML report

---

## Vocabulary (do not conflate)

| Term | Database | Command |
|------|----------|---------|
| Python env | `.venv` (single, shared) | `just create-venv` (once), `uv sync` — **not** per-database |
| Dev seed | `courseflow` | `just django-seed` |
| E2E fixtures | `courseflow_e2e` | `just django-seed-e2e-tests` |
| Rebuild dev | volume wipe | `just rebuild-dev-db` |
| Rebuild E2E | `courseflow_e2e` only | `just rebuild-e2e-db` |
| Prepare E2E (idempotent) | `courseflow_e2e` | `just e2e-prepare` |

Switch runtime database via `POSTGRES_DB` on each `just` recipe (`django-run` vs `django-run-e2e`). Do not recreate `.venv` when changing databases.

## Related documents

- [playwright_execution_guide.md](../runbooks/playwright_execution_guide.md) — local runbook
- [adr_test_generation.md](adr_test_generation.md) — generation policy
- [ai_test_generation_workflow.md](ai_test_generation_workflow.md) — FR → test workflow
- [test_suite_layout.md](test_suite_layout.md) — folder layout

## Consequences

- Specs import `test` from `tests/fixtures/`, not `@playwright/test` directly (when using workflow fixture)
- `PLAYWRIGHT_WORKFLOW_PATH` in `tests/.env` becomes optional override only
- AI agents must check fixture contract before generating workflow-domain tests
