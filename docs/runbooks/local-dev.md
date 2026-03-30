# Local development (rebuild foundation)

Python runs on the host. Docker Compose provides **PostgreSQL only**.

The default Django project is **V2**: `manage.py` uses `course_flow_v2.settings`. The `course_flow/` package is legacy reference code only.

## Stack roles (short)

| Layer | Role |
| --- | --- |
| Django ORM models (`course_flow_v2/core/models/`) | Persistence |
| Ninja `Schema` classes (`course_flow_v2/api/schemas/`) | API request/response DTOs (Pydantic-backed) |
| Django Ninja routes (`course_flow_v2/api/routers/`) | HTTP API; OpenAPI is generated from routes + schemas |
| Application services (`course_flow_v2/application/`) | Thin orchestration; persistence via repository implementations |

Do not hand-maintain a parallel OpenAPI document as the source of truth; export the generated spec when tooling needs it (see [OpenAPI and client workflow](../architecture/openapi_and_client_workflow.md)).

## 1. Environment file

Copy the example file and set secrets:

```bash
cp .env.example .env
```

Variables:

- **Compose**: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`
- **Django (host → container)**: `POSTGRES_HOST` (default `127.0.0.1`); database name/user/password/port align with the same values Compose uses
- **Optional**: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`

`course_flow_v2/settings.py` loads `.env` from the repository root via `python-dotenv`.

## 2. Start Postgres

```bash
docker compose up -d postgres
```

Persistence uses the named volume `courseflow_pgdata`. Check health with `docker compose ps`.

## 3. Python dependencies

```bash
uv sync
```

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
- Example routes: `GET/POST /api/project`, `GET/POST /api/workflow` (see OpenAPI for exact paths)

**Note:** Authenticated workflow/project writes derive the owner from the bearer token; register or log in to obtain a token before calling protected routes.

## 6. Canonical data model

Persistence shapes are defined to match `docs/data/entities/entities.md` (authoritative YAML). When in doubt, update that document before changing ORM fields.
