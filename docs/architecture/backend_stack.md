# Backend Stack Precision

This file defines the stack choices that are in scope for the rebuild and the exact role each technology plays.

## Confirmed Stack

- Python 3.12
- Django
- Django Ninja
- PostgreSQL
- Django Ninja Schemas for request and response contracts
- Pydantic as the validation and serialization engine behind Ninja Schemas
- pyproject-managed dependency set

## Current Position on the ORM Boundary

The primary persistence direction is:

- Django ORM for application persistence
- PostgreSQL as the backing relational database

The architectural constraint is that the ORM must remain in infrastructure.

In practice, that means:

- Django models live under `src/infrastructure/orm/models/`
- repository implementations using Django ORM live under `src/infrastructure/orm/repositories/`
- application and domain code do not directly depend on Django models

## Django

Django is retained for:

- project scaffolding
- settings and environment management
- migrations
- admin
- authentication / permission integration
- ORM-backed persistence

Django is not the intended home for business workflow.

## Django Ninja

Django Ninja is the API layer.

Use it for:

- route declaration
- request validation and binding
- response schema declaration
- OpenAPI generation
- Swagger / docs UI exposure

Do not use it as the place where application orchestration lives.

## Ninja Schemas and Data Shapes

Keep transport, application, and persistence shapes distinct.

### 1. Ninja Schemas

Ninja Schemas are the default API contract layer.

Use them for:

- request payload parsing
- response serialization
- field validation at the transport boundary
- OpenAPI generation from real endpoint declarations

These live in `src/schemas/`.

They are Pydantic-backed contracts.

### 2. Application Data Objects

The application layer may use explicit command/query/result objects when a use case needs a shape that is not identical to an HTTP contract.

Examples:

- `CreateWorkflowCommand`
- `WorkflowResult`
- `ProjectSummaryResult`

These should live in application-owned modules, not in infrastructure.

Do not create a parallel DTO hierarchy by default unless the use case actually needs it.

### 3. ORM Models

ORM models are persistence representations.

These live in `src/infrastructure/orm/models/`.

Do not treat ORM models as interchangeable with Ninja Schemas or application objects.

## Pydantic

Pydantic is used through Django Ninja's schema system.

Practical rule:

- prefer Django Ninja `Schema` classes for API contracts
- understand that those contracts are powered by Pydantic
- do not build a second competing API DTO layer unless a concrete need emerges

## SQLAlchemy

SQLAlchemy is not the default persistence model for the rebuild.

If it is introduced at all, it must be justified for a specific technical reason and documented before use.

Default assumption for the codebase:

- application persistence uses Django ORM
- do not generate parallel SQLAlchemy models for the same entities
- do not mix Django ORM and SQLAlchemy casually inside feature work

Until explicitly ratified otherwise, assume Django ORM only.

## PostgreSQL

PostgreSQL is the system of record.

Expected usage:

- relational schema owned through Django migrations
- constraints expressed in the database where appropriate
- UUIDs where required by the data model
- indexing decisions made deliberately, not guessed

## Package Guidance

The authoritative dependency list for the foundation slice is `pyproject.toml`. At a minimum:

**Runtime**

- `django`
- `django-ninja` (brings Pydantic for Ninja Schemas)
- `psycopg[binary]` (PostgreSQL driver; Django uses the `django.db.backends.postgresql` engine with psycopg 3)
- `python-dotenv` (loads `.env` in `course_flow/settings.py` for local development)

**Development**

- `pytest`
- `pytest-django`
- `ruff`

Additional packages should be added only for a concrete need.

## OpenAPI

API documentation and the machine-readable OpenAPI document are **generated** from Django Ninja routes and Ninja Schemas. Workflow and export expectations are described in [openapi_and_client_workflow.md](openapi_and_client_workflow.md).

## Stack Rules

- do not introduce extra frameworks without explicit need
- do not generate SQLAlchemy-based persistence by default
- do not treat Ninja Schemas as equivalent to ORM models
- do not move business rules into Ninja endpoints
- do not assume a background-job or realtime subsystem exists unless documented elsewhere
