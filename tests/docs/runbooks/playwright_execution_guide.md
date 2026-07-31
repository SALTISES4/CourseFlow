# Playwright execution runbook

## Purpose

This runbook describes how to install, configure, and run the CourseFlow **browser E2E** suite locally and how that stack differs from everyday UI development.

It complements:

- [test_suite_layout.md](../testing/test_suite_layout.md) — where specs, setup, helpers, and locators live
- [playwright_authoring_standard.md](../testing/playwright_authoring_standard.md) — how tests are written

Policy documents stay under `tests/docs/testing/`. Operational runbooks live under `tests/docs/runbooks/`.

## What E2E exercises

Playwright drives a **real browser** against the **real application**:

```
Playwright (Chromium)
  → Vite dev server (:3000) — React app
    → Django API (:8000) — auth, serializers, persistence
      → Postgres (Docker :5432) — local development database
```

There are no Python mocks, fake API ports, or in-process test doubles for product behavior. The manifest file (`tests/.playwright-fixtures/workflow.json`) only records UUIDs created during real seeding so specs know which routes to open.

## Vocabulary

| Term | Command | Database | Purpose |
| ---- | ------- | -------- | ------- |
| **E2E fixtures** | `just django-seed-e2e-tests` | `courseflow` | Deterministic content for local development and Playwright (`E2E FIXTURE -` prefix) |
| **Prepare E2E** | `just e2e-prepare` | `courseflow` | Migrate + replace E2E fixtures + write manifest |
| **Rebuild dev DB** | `just rebuild-dev-db` | Wipes volume → `courseflow` | Full local reset, then migrate + superuser + E2E fixtures |

The deterministic E2E fixture set is the only local seed path. `just e2e-prepare` is the normal fixture-preparation command.

### Python environment (shared with dev)

Playwright E2E does **not** use a separate Python virtual environment.

| Do | Do not |
| -- | ------ |
| Keep one `.venv` at the repo root for dev, E2E seeding, and `pytest` | Create a second venv (e.g. `dev_venv`) for E2E |
| Run `just django-run` for local development and E2E | Delete or recreate `.venv` when switching work |
| Run `uv sync` after dependency changes | Change root `.env` `POSTGRES_DB` back and forth for every task |

All local workflows read the same database configuration from the root `.env`.

**PyCharm / IDE:** Configure the interpreter once against `.venv` and use the normal Django run configuration.

### Local database model

Local development and Playwright use one Postgres database:

| Database | Used by | Django command |
| -------- | ------- | -------------- |
| `courseflow` | Local UI development and Playwright | `just django-run` |

- `just e2e-prepare` replaces only projects owned by the deterministic E2E fixture prefix; it does not reset unrelated local rows.
- Browser specs can mutate shared local fixture data. Re-run `just e2e-prepare` to restore it.
- `just rebuild-dev-db` wipes the local volume and is the only full local database reset.

CI/CD should eventually run browser tests against a temporary Docker database created for the job. That isolation mechanism is not wired yet.

## Package layout

Playwright lives in its own package under `tests/`, separate from `react/` (Jest/Vite):

```
tests/
  package.json              # @playwright/test, yarn scripts
  playwright.config.ts      # projects, baseURL, discovery globs
  .env                      # TEST_USERNAME, PLAYWRIGHT_WORKFLOW_PATH (gitignored)
  setup/auth.setup.ts       # one-time login → storage state
  e2e/                      # runnable *.spec.ts files
  .playwright-fixtures/     # workflow.json manifest (gitignored; see .example)
  playwright/.auth/         # generated session file (gitignored)
```

Use **Yarn Classic 1.22.x** (same as `react/`), not Yarn 4 Berry/PnP. Volta is pinned in `tests/package.json`.

## One-time setup

### 1. Install Playwright dependencies

```bash
cd ./tests
yarn
yarn exec playwright install chromium
```

### 2. Configure `tests/.env`

```bash
cd ./tests
cp .env.example .env
```

Minimum `tests/.env`:

```bash
TEST_USERNAME=teacher@courseflow.com
TEST_PASSWORD=password
```

Optional override:

```bash
# PLAYWRIGHT_WORKFLOW_PATH=/workflow/<graph-uuid>/graph
```

| Variable | Required for | Notes |
| -------- | ------------ | ----- |
| `TEST_USERNAME` | All authenticated specs | Primary actor is `teacher@courseflow.com`, created by `just django-seed-e2e-tests` |
| `TEST_PASSWORD` | All authenticated specs | Default fixture password is `password` |
| `PLAYWRIGHT_WORKFLOW_PATH` | Workflow E2E (optional override) | Loaded from manifest by default (`just e2e-prepare`) |
| `PLAYWRIGHT_BASE_URL` | Optional | Default `http://localhost:3000/` in `playwright.config.ts` |
| `PLAYWRIGHT_API_BASE_URL` | Optional | Django API origin for direct authenticated API helpers; defaults to `http://127.0.0.1:8000` |

Root `.env` (`POSTGRES_DB=courseflow`) can stay unchanged for normal dev work.

### 3. Prepare fixtures

From **repo root**:

```bash
just e2e-prepare
```

This runs migrations on the local database, replaces the deterministic E2E fixture projects, and writes `tests/.playwright-fixtures/workflow.json`.

`PLAYWRIGHT_WORKFLOW_PATH` in `tests/.env` is **optional** — Playwright `globalSetup` and the `workflow` fixture read the manifest automatically. Set it only to override the manifest path.

### 4. Verify auth setup

With the E2E stack running (see [Run E2E locally](#run-e2e-locally)):

```bash
cd ./tests
yarn test-setup
```

This performs a real UI login and writes `playwright/.auth/user.json`. Chromium specs fail with `ENOENT` if this file is missing.

### 5. Verify discovery

```bash
cd ./tests
yarn test-list
```

Expect specs under `e2e/smoke/` and `e2e/workflow/`.

## Run E2E locally

`just dev` and Playwright use the same local database. Prepare fixtures first, then run the normal application stack.

**Terminal 1 — Postgres** (if not already up):

```bash
just docker-up
```

**Terminal 2 — Django:**

```bash
just django-run
```

**Terminal 3 — Vite frontend:**

```bash
just frontend-dev
```

**Terminal 4 — Playwright:**

```bash
cd ./tests
yarn test-setup    # when auth storage is missing or stale
yarn test          # headless full suite
# or
yarn test-ui       # interactive UI Mode
```

### Playwright projects

`playwright.config.ts` defines two projects:

| Project | Role | Files |
| ------- | ---- | ----- |
| `setup` | Logs in once; writes `playwright/.auth/user.json` | `setup/**/*.setup.ts` |
| `chromium` | Runs E2E specs with saved storage state | `e2e/**/*.spec.ts` |

The `chromium` project depends on `setup`.

### Yarn scripts

Run from `./tests/`:

| Command | What it does |
| ------- | ------------ |
| `yarn test-setup` | Auth setup only |
| `yarn test` | Full suite (headless) |
| `yarn test-ui` | Playwright UI Mode — visible browser, step inspection |
| `yarn test-debug` | Inspector / step-through |
| `yarn test-list` | List discovered tests without running |
| `yarn test-report` | Open HTML report from the last run |

### Run one file or one test

```bash
yarn test e2e/workflow/edit-section-fr-001-012.spec.ts
yarn test-ui e2e/smoke/authenticated-home.spec.ts
yarn test-debug e2e/workflow/edit-section-fr-001-012.spec.ts -g "FR-SEC-001"
```

### Headed run (browser visible, no UI shell)

```bash
yarn exec playwright test --headed e2e/smoke/authenticated-home.spec.ts
```

## E2E fixture contract

`just e2e-prepare` seeds via `cf-seed-e2e-data` on the configured local database:

| Field | Value |
| ----- | ----- |
| Project | `E2E FIXTURE - Edit Section` |
| Owner | `teacher@courseflow.com` |
| Recent projects | Five ordered, non-archived projects for FR-HOME-003 |
| Contributors | `editor@courseflow.com`, `commenter@courseflow.com`, `student@courseflow.com` |
| Workflow | One activity graph |
| Sections | `E2E Section 1`, blank title (position 1), `E2E Section 3` |
| Manifest | `tests/.playwright-fixtures/workflow.json` |

Workflow specs import `test` from `tests/fixtures/` and receive a `workflow` fixture:

```typescript
test('example', async ({ page, workflow }) => {
  await page.goto(workflow.path);
  const section = workflow.firstSection();
  // workflow.blankSection(), workflow.sectionByTitle('E2E Section 1'), …
});
```

`globalSetup` fails fast if the manifest is missing. UUIDs are captured at seed time — do not hardcode them in specs.

**Next (Phase 2):** contributor roles, FR-SEC-002+ coverage — see [adr_e2e_harness_roadmap.md](../testing/adr_e2e_harness_roadmap.md).

## Calibration slice (Edit Section)

Active specs in `e2e/workflow/edit-section-fr-001-012.spec.ts`:

- FR-SEC-001 — section header opens Edit section form
- FR-SEC-003 — title auto-save persists after reload
- FR-SEC-006 — delete modal Cancel preserves section count

Requires `PLAYWRIGHT_WORKFLOW_PATH`, Django on `:8000`, and an owner/editor session from auth setup.

## CI goal (not wired yet)

CI/CD should own isolation instead of introducing another local database mode:

1. Start a temporary Postgres database in Docker for the job
2. Run migrations and `cf-seed-e2e-data` against that database
3. Start Django and Vite (or serve the built frontend)
4. Run Playwright `globalSetup` → auth setup → specs
5. Destroy the temporary database with the job

CircleCI currently runs Django unit tests only; browser E2E is local-first until this pipeline exists.

## Troubleshooting

### UI Mode shows no tests

Discovery uses `testMatch: ["e2e/**/*.spec.ts"]` relative to `tests/`. Run `yarn test-list` before opening UI Mode.

### `Cannot find module 'dotenv'`

Run `yarn` in `tests/`. Use Yarn Classic (`yarn lockfile v1`), not Yarn 4 PnP.

### `ENOENT: playwright/.auth/user.json`

Run `yarn test-setup` first. Common causes:

- Missing `tests/.env` with `TEST_USERNAME` / `TEST_PASSWORD`
- Django not running on `:8000`
- Primary teacher fixture missing — run `just e2e-prepare`

### Auth setup fails

- Confirm Vite on `:3000` and Django on `:8000`
- Credentials: `teacher@courseflow.com` / `password` after `just django-seed-e2e-tests`

### Workflow specs skip immediately

1. Run `just e2e-prepare`
2. Set `PLAYWRIGHT_WORKFLOW_PATH` from `tests/.playwright-fixtures/workflow.json`
3. Confirm Django is on `:8000` and the graph has sections in the browser

### Tests see mutated fixture data or unexpected projects

Local development and Playwright intentionally share the configured database. Run `just e2e-prepare` to restore deterministic fixture projects before rerunning the suite.

### PyCharm / IDE interpreter broke after recreating `.venv`

Do not delete or recreate `.venv` when switching between dev and E2E work. Use one interpreter at `.venv`. If `.venv` was removed, run `just create-venv && just uv-sync`, then re-select `.venv` in the IDE SDK settings.

### Tests fail on navigation / timeout

Confirm `baseURL` in `playwright.config.ts` matches Vite (`http://localhost:3000/` by default). Specs use path-only navigation.

## Related documents

- [test_suite_layout.md](../testing/test_suite_layout.md) — folder conventions
- [playwright_authoring_standard.md](../testing/playwright_authoring_standard.md) — writing and waiting rules
- [locator_contract_policy.md](../testing/locator_contract_policy.md) — selector contracts
- [browser_automation_tooling_guide.md](../testing/browser_automation_tooling_guide.md) — Playwright MCP setup, E2E prerequisites, and DOM validation during generation
- [local-dev.md](../../../docs/runbooks/local-dev.md) — general local development (dev database)
