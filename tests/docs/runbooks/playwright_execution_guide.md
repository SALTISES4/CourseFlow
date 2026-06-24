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
      → Postgres (Docker :5432) — logical database courseflow_e2e
```

There are no Python mocks, fake API ports, or in-process test doubles for product behavior. The manifest file (`tests/.playwright-fixtures/workflow.json`) only records UUIDs created during real seeding so specs know which routes to open.

## Vocabulary

| Term | Command | Database | Purpose |
| ---- | ------- | -------- | ------- |
| **Dev seed** | `just django-seed` | `courseflow` | Faker-driven synthetic data for local UI work (`DEV SEED -` prefix) |
| **E2E fixtures** | `just django-seed-e2e-tests` | `courseflow_e2e` | Deterministic contract data for Playwright (`E2E FIXTURE -` prefix) |
| **Rebuild dev DB** | `just rebuild-dev-db` | Wipes volume → `courseflow` | Fresh dev migrate + superuser + dev seed |
| **Rebuild E2E DB** | `just rebuild-e2e-db` | Resets `courseflow_e2e` only | Migrate + superuser + E2E fixtures + manifest |

Do **not** use `just django-seed` or `just dev` to prepare Playwright workflow tests.

### Python environment (shared with dev)

Playwright E2E does **not** use a separate Python virtual environment.

| Do | Do not |
| -- | ------ |
| Keep one `.venv` at the repo root for dev, E2E seeding, and `pytest` | Create a second venv (e.g. `dev_venv`) for E2E |
| Run `just django-run-e2e` to point Django at `courseflow_e2e` | Delete or recreate `.venv` when switching to E2E work |
| Run `uv sync` after dependency changes | Change root `.env` `POSTGRES_DB` back and forth for every task |

E2E `just` recipes set `POSTGRES_DB=courseflow_e2e` on the **process** (`django-run-e2e`, `django-migrate-e2e`, `django-seed-e2e-tests`, …). Root `.env` can stay on `POSTGRES_DB=courseflow` for normal UI development.

**PyCharm / IDE:** Configure the interpreter once against `.venv`. Use terminal recipes or a run configuration with `POSTGRES_DB=courseflow_e2e` for E2E — not a second interpreter path.

### Dev database vs E2E database

One Postgres container (`docker compose`), **two logical databases** on the same instance:

| Database | Used by | Django command |
| -------- | ------- | -------------- |
| `courseflow` | Local UI development | `just django-run` (reads root `.env`) |
| `courseflow_e2e` | Playwright / automated browser tests | `just django-run-e2e` |

- Dev and E2E data can coexist on one running Postgres container.
- `just rebuild-e2e-db` drops and recreates **only** `courseflow_e2e`.
- `just rebuild-dev-db` wipes the Docker volume and destroys **both** databases.

`courseflow_e2e` is created on first volume init (`scripts/postgres/init/`) or via `just postgres-ensure-e2e-db` on an existing volume.

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
cd CourseFlow/tests
yarn
yarn exec playwright install chromium
```

### 2. Configure `tests/.env`

```bash
cd CourseFlow/tests
cp .env.example .env
```

Minimum `tests/.env`:

```bash
TEST_USERNAME=admin@courseflow.com
TEST_PASSWORD=password
```

Optional override:

```bash
# PLAYWRIGHT_WORKFLOW_PATH=/workflow/<graph-uuid>/graph
```

| Variable | Required for | Notes |
| -------- | ------------ | ----- |
| `TEST_USERNAME` | All authenticated specs | Must exist in `courseflow_e2e` (see `just django-create-superuser-e2e`) |
| `TEST_PASSWORD` | All authenticated specs | Default `password` after E2E superuser recipe |
| `PLAYWRIGHT_WORKFLOW_PATH` | Workflow E2E (optional override) | Loaded from manifest by default (`just e2e-prepare`) |
| `PLAYWRIGHT_BASE_URL` | Optional | Default `http://localhost:3000/` in `playwright.config.ts` |

Root `.env` (`POSTGRES_DB=courseflow`) can stay unchanged for normal dev work.

### 3. Prepare the E2E database and fixtures

From **repo root**:

```bash
just e2e-prepare
```

This ensures `courseflow_e2e` exists, runs migrations, creates the admin superuser (if needed), seeds E2E fixtures, and writes `tests/.playwright-fixtures/workflow.json`.

For a full reset of the E2E database only (drops `courseflow_e2e`, leaves dev data intact):

```bash
just rebuild-e2e-db
```

`PLAYWRIGHT_WORKFLOW_PATH` in `tests/.env` is **optional** — Playwright `globalSetup` and the `workflow` fixture read the manifest automatically. Set it only to override the manifest path.

### 4. Verify auth setup

With the E2E stack running (see [Run E2E locally](#run-e2e-locally)):

```bash
cd CourseFlow/tests
yarn test-setup
```

This performs a real UI login and writes `playwright/.auth/user.json`. Chromium specs fail with `ENOENT` if this file is missing.

### 5. Verify discovery

```bash
cd CourseFlow/tests
yarn test-list
```

Expect specs under `e2e/smoke/` and `e2e/workflow/`.

## Run E2E locally

`just dev` starts Django against **`courseflow`** (dev data). For Playwright, run the E2E stack instead.

**Terminal 1 — Postgres** (if not already up):

```bash
just docker-up
```

**Terminal 2 — Django against `courseflow_e2e`:**

```bash
just django-run-e2e
```

**Terminal 3 — Vite frontend:**

```bash
just frontend-dev
```

**Terminal 4 — Playwright:**

```bash
cd CourseFlow/tests
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

Run from `CourseFlow/tests/`:

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
yarn test e2e/workflow/edit-section-fr-001-006.spec.ts
yarn test-ui e2e/smoke/authenticated-home.spec.ts
yarn test-debug e2e/workflow/edit-section-fr-001-006.spec.ts -g "FR-SEC-001"
```

### Headed run (browser visible, no UI shell)

```bash
yarn exec playwright test --headed e2e/smoke/authenticated-home.spec.ts
```

## E2E fixture contract

`just e2e-prepare` seeds via `cf-seed-e2e-data` on `courseflow_e2e`:

| Field | Value |
| ----- | ----- |
| Project | `E2E FIXTURE - Edit Section` |
| Owner | `admin@courseflow.com` |
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

Active specs in `e2e/workflow/edit-section-fr-001-006.spec.ts`:

- FR-SEC-001 — section header opens Edit section form
- FR-SEC-003 — title auto-save persists after reload
- FR-SEC-006 — delete modal Cancel preserves section count

Requires `PLAYWRIGHT_WORKFLOW_PATH`, Django on `courseflow_e2e`, and an owner/editor session from auth setup.

## CI sketch (not wired yet)

Same Postgres container, E2E database only:

1. `docker compose up -d postgres`
2. `just postgres-ensure-e2e-db`
3. `just rebuild-e2e-db`
4. Start Django with `POSTGRES_DB=courseflow_e2e`
5. Start Vite or serve built frontend
6. Playwright `globalSetup` → auth setup → specs

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
- Django pointed at `courseflow` instead of `courseflow_e2e` — use `just django-run-e2e`
- Superuser missing in E2E DB — run `just django-create-superuser-e2e` or `just rebuild-e2e-db`

### Auth setup fails

- Confirm Vite on `:3000` and Django on `:8000`
- Confirm Django uses `courseflow_e2e` (`just django-run-e2e`)
- Credentials: `admin@courseflow.com` / `password` after `just django-create-superuser-e2e`

### Workflow specs skip immediately

1. Run `just rebuild-e2e-db` or `just django-seed-e2e-tests`
2. Set `PLAYWRIGHT_WORKFLOW_PATH` from `tests/.playwright-fixtures/workflow.json`
3. Confirm Django is on `courseflow_e2e` and the graph has sections in the browser

### Tests mutate the wrong data / see unexpected projects

Django is likely connected to `courseflow` (dev). Stop it and start `just django-run-e2e`.

### PyCharm / IDE interpreter broke after recreating `.venv`

Do not delete or recreate `.venv` when switching between dev and E2E. Use one interpreter at `.venv` and switch databases via `just django-run` vs `just django-run-e2e`. If `.venv` was removed, run `just create-venv && just uv-sync`, then re-select `.venv` in the IDE SDK settings.

### Tests fail on navigation / timeout

Confirm `baseURL` in `playwright.config.ts` matches Vite (`http://localhost:3000/` by default). Specs use path-only navigation.

### `courseflow_e2e` does not exist

```bash
just postgres-ensure-e2e-db
```

On a brand-new volume, the init script creates it automatically when Postgres first starts.

## Related documents

- [test_suite_layout.md](../testing/test_suite_layout.md) — folder conventions
- [playwright_authoring_standard.md](../testing/playwright_authoring_standard.md) — writing and waiting rules
- [locator_contract_policy.md](../testing/locator_contract_policy.md) — selector contracts
- [browser_automation_tooling_guide.md](../testing/browser_automation_tooling_guide.md) — MCP/CLI during generation
- [local-dev.md](../../../docs/runbooks/local-dev.md) — general local development (dev database)
