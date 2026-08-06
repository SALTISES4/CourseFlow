# Local development (rebuild foundation)

Python runs on the host. Docker Compose provides **PostgreSQL only**.

The default Django project uses `manage.py` → `course_flow.settings`. Active backend code lives in the `course_flow/` Python package (Django app `course_flow.core`).

## Stack roles (short)

| Layer | Role |
| --- | --- |
| Django ORM models (`course_flow/core/models/`) | Persistence — **canonical schema** |
| Ninja `Schema` classes (`course_flow/api/schemas/`) | API request/response DTOs (Pydantic-backed) |
| Django Ninja routes (`course_flow/api/routers/`) | HTTP API; OpenAPI is generated from routes + schemas |
| Application services (`course_flow/application/`) | Thin orchestration; persistence via repository implementations |

Do not hand-maintain a parallel OpenAPI document as the source of truth; export the generated spec when tooling needs it (see [OpenAPI and client graph](../architecture/openapi_and_client_graph.md)).

## 1. Environment file

Copy the example file and set secrets:

```bash
cp .env.example .env
```

Variables:

- **Compose**: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`
- **Django (host → container)**: `POSTGRES_HOST` (default `127.0.0.1`); database name/user/password/port align with the local `courseflow` database
- **Optional**: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`

`course_flow/settings.py` loads `.env` from the repository root via `python-dotenv`.

## Local database and test fixtures

Local UI development and Playwright E2E use **one Python virtual environment** (`.venv` at the repo root) and **one local development database** (`courseflow`). Do **not** create a second local database mode for browser tests.

`just e2e-prepare` migrates the local database, replaces only the deterministic `E2E FIXTURE -` project trees, and writes the Playwright manifest. The same fixtures are the supported local-development content set. `just rebuild-dev-db` remains the explicit full-volume reset.

Future CI/CD browser-test isolation should use a temporary database in Docker for the job. That CI mechanism is intentionally not part of the local environment model yet.

**PyCharm:** Point the project SDK at `.venv` once and run Django with `just django-run` for both development and local browser tests.

See [playwright_execution_guide.md](../../tests/docs/runbooks/playwright_execution_guide.md) for the full E2E stack.

## 2. Start Postgres

```bash
docker compose up -d postgres
```

Persistence uses the named volume `courseflow_pgdata`. Check health with `docker compose ps`.

## 3. Python dependencies

One-time (or after `pyproject.toml` changes):

```bash
uv sync
```

`just create-venv` creates `.venv` only if it is missing; it does not remove a healthy environment. If `.venv/bin/python` is broken (common when an IDE pointed at a removed `/usr/local/bin/python3`), it is recreated using uv-managed Python 3.12 (see repo-root `.python-version`).

If `just uv-sync` prints `Removed virtual environment at: .venv` on every run, the existing `.venv` had a stale interpreter — run `just create-venv && just uv-sync` once, then point PyCharm at `.venv/bin/python` (not a separate interpreter path).

Runtime packages: `django`, `django-ninja`, `psycopg[binary]`, `python-dotenv`. Dev: `pytest`, `pytest-django`, `ruff`.

## 4. Django against Postgres

With Postgres up and env vars set:

```bash
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver
```

## 5. V2 API entrypoints

With the dev server running:

- Docs UI: `http://127.0.0.1:8000/api/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/api/openapi.json`
- Example routes: `GET/POST /api/project`, `GET/POST /api/graph` (see OpenAPI for exact paths)

**Note:** Authenticated graph/project writes derive the owner from the bearer token; register or log in to obtain a token before calling protected routes.

## 6. Canonical data model

Persistence shapes are defined in **`course_flow/core/models/`**. Documents under `docs/data/entities/` are derived summaries and Mermaid ERDs; update them when models change (not the other way around).
