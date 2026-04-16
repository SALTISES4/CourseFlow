# Bootstrap Backend

This runbook describes the minimum setup direction for the rebuilt backend.

## Initial Goal

Get a local backend running with:

- Django project bootstrapped
- Django Ninja API mounted
- PostgreSQL configured
- first ORM models created
- first request/response schemas created
- first endpoint exposed in generated API docs

## Initial Package Direction

Use the dependency list in `pyproject.toml` (Django, django-ninja, `psycopg[binary]`, `python-dotenv`; dev: pytest, pytest-django, ruff). Pydantic is provided as part of Django Ninja’s schema stack.

Do not add speculative packages.

## Implemented layout (V2)

Active code lives under `course_flow_v2/` (see `manage.py` → `course_flow_v2.settings`):

- `course_flow_v2/core/models/` — persistence (maps to `docs/data/entities/entities.md`)
- `course_flow_v2/application/` — services and ports (DTOs, protocols)
- `course_flow_v2/infrastructure/repositories/` — Django ORM repository implementations wired from `course_flow_v2/api/deps.py`
- `course_flow_v2/api/` — Ninja routers and request/response schemas
- `course_flow_v2/core/migrations/0001_initial.py` — initial schema migration for the confirmed core entities

The long-term `src/` layout described in [repository_layout.md](../architecture/repository_layout.md) remains the directional target; V2 mirrors the same separation using the `course_flow_v2/` tree.

## Initial foundation status

The first backend slice is now represented in the active V2 codebase:

- confirmed core ORM models live in `course_flow_v2/core/models/`
- shared persistence conventions use UUIDs plus `date_created` / `modified_on` where the canonical entity docs define them
- explicit through models capture project-discipline, project-team membership, node/outcome/tag links, favorites, and horizontal outcome links
- the initial Ninja API slice exposes `POST/GET/LIST` endpoints for projects and graphs
- generated API docs are wired through Django Ninja at `/api/docs`
- generated OpenAPI JSON is wired at `/api/openapi.json`

## Suggested next slices

1. authentication dependencies for Ninja (replace dev-only `owner_id` on write APIs)
2. domain module and repository interfaces per aggregate
3. focused `pytest-django` tests for services and API
