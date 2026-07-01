# Test suite layout and folder rules

## Purpose

This document defines **where** Playwright tests and supporting code live under `tests/`, and the conventions for naming and dependencies. It complements [playwright_authoring_standard.md](playwright_authoring_standard.md) (how tests are written) and [locator_contract_policy.md](locator_contract_policy.md) (selector rules).

## Goals

- Keep **domain-owned** specs and locators easy to find under `tests/e2e/` (`workflow`, `library`, `user`, etc.).
- Separate **cross-cutting utilities** (auth, navigation, shared shell selectors) from feature tests.
- Avoid a single monolithic locator registry that blocks parallel work.
- Stay aligned with Playwright’s **project + storage state** auth model (see `playwright.config.ts` and `tests/setup/`).

## Directory layout

```
tests/
  setup/           # Auth and other *.setup.ts projects only
  fixtures/        # Extended test / expect (test.extend)
  helpers/         # Plain utilities (env, navigation, login steps)
  shared/          # Cross-domain constants and locators
    locators/      # App shell, global UI — not feature-specific
  e2e/             # All runnable browser tests, grouped by product domain
    smoke/         # Thin, cross-domain checks (e.g. authenticated home)
    workflow/      # Workflow domain specs + colocated locators
    library/       # (add when you have specs) Library domain
    user/          # (add when you have specs) Account / profile domain
  docs/            # Requirements and testing policy (this tree is not executed)
```

**`tests/e2e/`** holds every `*.spec.ts` that exercises the app through the browser. **Infrastructure** (`setup/`, `helpers/`, `shared/`, `fixtures/`) stays next to it at `tests/`, not nested under `e2e/`, so imports stay shallow from specs (`../../helpers/...`).

New **product areas** get a folder under `tests/e2e/` (mirror the domain language from requirements), not a catch-all `features/` unless you intentionally want one.

## Rules by folder

### `tests/setup/`

- Contains **only** files that match Playwright’s setup convention (e.g. `*.setup.ts`).
- **Auth**: `auth.setup.ts` logs in once and writes storage state; credentials come from `TEST_USERNAME` / `TEST_PASSWORD` (validated in helpers).
- Do not put runnable `*.spec.ts` files here.

### `tests/fixtures/`

- Holds **extended** `test` and `expect` from `@playwright/test` (`test.extend({ ... })`).
- Use when tests need injected lifecycle: role-specific contexts, API clients, custom `page` wrappers, etc.
- Specs should import `test` / `expect` from here **once** you add extensions; until then the default re-export is a pass-through.

### `tests/helpers/`

- **Stateless utilities**: URL helpers, env readers, `loginAsTestUser(page)` for reuse (e.g. re-auth in a test).
- **No** Playwright fixture lifecycle unless you are re-exporting thin wrappers; keep that in `fixtures/`.
- Safe to import from `setup/` and from `e2e/**/*.spec.ts`.

### `tests/shared/`

- **`auth-state.ts`**: Single definition of the saved auth file path (must stay aligned with `playwright.config.ts` `storageState`).
- **`locators/`**: TypeScript implementation of `canonical_locators.yaml` shared uiObjects. See `locators/CANONICAL_PORT_STATUS.md` for port progress.
- Domain `tests/e2e/<domain>/*.locators.ts` files **re-export** shared locators and add domain-only uiObjects.

### Canonical locator registry → TypeScript modules

Requirements define shared uiObjects in `tests/docs/requirements/features/shared/canonical_locators.yaml`. Playwright implements them as follows:

| Registry scope | TypeScript home | Notes |
| --- | --- | --- |
| Cross-domain shell (`topNavigationBar`, `addMenuTrigger`, …) | `tests/e2e/navigation/navigation.locators.ts` or `tests/shared/locators/` | Promote to `shared/` when imported broadly |
| Library listing (`keywordSearchField`, `libraryFilterToolbar`, `libraryCards`, …) | `tests/e2e/library/library.locators.ts` | Project workflows tab re-exports these — do not duplicate |
| Domain-only (`projectOverviewView`, `workflowSectionContainer`, …) | `tests/e2e/<domain>/*.locators.ts` | Match canonical uiObject function names |
| One-off, single-spec | Inline in `*.spec.ts` | Only when not a named canonical uiObject |

When generating tests incrementally (one FR block at a time), still check `canonical_locators.yaml` first: shared objects belong in the owning module and are imported elsewhere.

See `adr_ai_test_generation.md` and `locator_contract_policy.md` § Locator file organization.

### `tests/e2e/smoke/`

- Short tests that **span domains** or sanity-check the logged-in shell (home, global nav).
- Not for large FR suites; those belong under the relevant domain folder inside `e2e/`.

### Domain folders (`tests/e2e/workflow/`, `tests/e2e/library/`, …)

- **`*.spec.ts`**: Runnable tests only.
- **Colocated locators**: Prefer `edit-section.locators.ts` (or a `locators/` subfolder) next to the specs that own them.
- **Imports**: Use relative paths to `tests/helpers/` and `tests/shared/` (e.g. `../../helpers/env` from `tests/e2e/workflow/`).
- **Traceability**: Keep FR IDs and requirement references in file headers or `test.describe` as in existing workflow specs.

### `tests/docs/`

- Requirements, ADRs, prompts, and **policy markdown** — not part of Playwright `testMatch`.
- Feature FR YAML lives under `tests/docs/requirements/features/` in domain folders (`workflow/`, `project/`, `library/`, …) that mirror `tests/e2e/` — see [requirements/features/README.md](../requirements/features/README.md).

## Naming conventions

| Pattern | Role |
|--------|------|
| `*.spec.ts` | Executable tests (discovered by Playwright). |
| `*.setup.ts` | Setup project steps (e.g. authenticate). |
| `*.locators.ts` | Locator factories and stable selector constants for one feature or domain. |

Use **domain-prefixed** spec names when helpful (`edit-section-fr-001-006.spec.ts`) for audit trails; otherwise prefer short names plus `describe` blocks for FR IDs.

## URLs and `baseURL`

- Prefer **path-only** navigation: `page.goto('/course-flow/...')` so `baseURL` in `playwright.config.ts` stays authoritative.
- Avoid hardcoding host/port in specs; use path-only navigation against `baseURL` (default `http://localhost:3000/` via `PLAYWRIGHT_BASE_URL`).

## Authentication

- Most specs run under the `chromium` project with **saved storage state** produced by `tests/setup/auth.setup.ts`.
- Tests that must run **unauthenticated** (true login page, public routes) should use a **separate Playwright project** without `storageState`, or `test.use({ storageState: { cookies: [], origins: [] } })` in a dedicated `describe` — document that choice when you add it.

## Anti-patterns

- Leaving runnable `*.spec.ts` files at `tests/` root long term (keep them under `tests/e2e/...`).
- A single `tests/locators/all.ts` that mirrors the entire app.
- Duplicating the auth storage path string outside `tests/shared/auth-state.ts` and `playwright.config.ts`.
- Putting heavy page objects in `helpers/`; use domain colocation or `fixtures/` for cohesive test-facing APIs.
- Copying the same canonical selector into multiple `*.locators.ts` files instead of import/re-export.
- Implementing `canonical_locators.yaml` strategy prose as XPath or MUI class selectors (see `locator_contract_policy.md`).

## Related documents

- [playwright_execution_guide.md](../runbooks/playwright_execution_guide.md) — install, env, UI Mode, and local run commands.
- [adr_ai_test_generation.md](adr_ai_test_generation.md) — architectural decisions for AI-assisted generation.
- [playwright_authoring_standard.md](playwright_authoring_standard.md) — how to write tests (titles, traceability headers, structure).
- [locator_contract_policy.md](locator_contract_policy.md) — selector contracts.
- [generated_test_review_checklist.md](generated_test_review_checklist.md) — review criteria for generated specs.
