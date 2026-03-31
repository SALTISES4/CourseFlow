# CourseFlow Backend Repository Layout

This is the current target layout for the backend rebuild.

**Status:** the running Django project uses `course_flow_v2/` (ORM in `course_flow_v2/core`, API in `course_flow_v2/api`, application and infrastructure siblings). The tree below remains the north-star shape; migrate toward it as features grow.

The intent is to keep business logic independent from Django while still using Django for framework concerns such as configuration, migrations, admin, auth integration, and ORM-backed persistence.

## Top-Level Structure

```text
courseflow/
├── manage.py
├── pyproject.toml
├── .env.example
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── src/
│   ├── api/
│   │   ├── router.py
│   │   ├── dependencies.py
│   │   ├── errors.py
│   │   └── endpoints/
│   ├── application/
│   │   ├── commands/
│   │   ├── queries/
│   │   ├── ports/
│   │   ├── services/
│   │   └── dto/
│   ├── domain/
│   │   ├── models/
│   │   ├── services/
│   │   ├── value_objects/
│   │   └── exceptions.py
│   ├── infrastructure/
│   │   ├── orm/
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   └── mappers/
│   │   ├── auth/
│   │   └── database/
│   ├── schemas/
│   │   ├── requests/
│   │   ├── responses/
│   │   └── shared/
│   └── common/
│       ├── ids/
│       ├── time/
│       └── pagination/
├── tests/
│   ├── api/
│   ├── application/
│   ├── domain/
│   └── infrastructure/
└── docs/
```

## Layer Intent

### `src/api/`

Transport layer only.

Responsibilities:

- Django Ninja routers
- request binding
- auth dependencies
- HTTP status mapping
- response serialization
- OpenAPI exposure

This layer must stay thin.

### `src/application/`

Use-case orchestration.

Responsibilities:

- commands and queries
- application services
- repository / gateway interfaces
- DTOs returned to the API layer
- transaction-level coordination where needed

This layer coordinates work but does not own framework code.

### `src/domain/`

Pure business logic.

Responsibilities:

- domain entities / aggregates
- value objects
- invariants
- domain services
- domain exceptions

This layer must not import Django.

### `src/infrastructure/`

Framework and persistence details.

Responsibilities:

- Django ORM models
- repository implementations
- ORM-to-domain mapping
- auth integration adapters
- database-specific configuration

This layer is allowed to depend on Django.

### `src/schemas/`

Transport-facing request and response schemas.

Responsibilities:

- Ninja / Pydantic schemas
- request payload validation
- response shape contracts
- shared API primitives such as pagination or error payloads

These schemas are not domain models.

## Non-Negotiable Boundary Rules

## Allowed Django Usage

Django is allowed only in:

- config and bootstrapping
- admin
- migrations
- auth/session integration
- ORM models and persistence
- API wiring via Django Ninja

## Forbidden Django Leakage

The following are not allowed:

- `domain/` importing Django
- `application/` importing Django ORM models directly
- business rules implemented primarily in Django models
- endpoint functions orchestrating multi-step workflows inline
- serializer or schema save hooks acting as the main application workflow
- ORM instances passed directly into domain logic

## Dependency Direction

Required direction:

```text
api -> application -> domain
api -> application -> ports
infrastructure -> application ports
infrastructure -> domain
```

Never:

```text
domain -> Django
application -> Django ORM models
domain -> API schemas
```

## Persistence Rule

All persistence access must be mediated through repository or gateway interfaces owned by the application layer and implemented in infrastructure.

## Mapping Rule

- ORM models are persistence shapes
- domain models are business shapes
- request/response schemas are transport shapes

Mapping between these shapes must be explicit.

## Example Vertical Slice: Create Workflow

```text
POST /api/workflow
    -> src/api/endpoints/workflows.py
    -> src/schemas/requests/workflow.py
    -> src/application/commands/create_workflow.py
    -> src/application/services/workflow_service.py
    -> src/domain/models/workflow.py
    -> src/application/ports/workflow_repository.py
    -> src/infrastructure/orm/repositories/workflow_repository.py
    -> src/infrastructure/orm/mappers/workflow_mapper.py
    -> Django ORM model
    -> PostgreSQL
```

## Anti-Pattern to Avoid

Do not collapse a feature into:

```text
APIView / Ninja endpoint -> schema save logic -> ORM model save
```

That pattern hides business workflow inside transport and persistence code.

## Why This Layout Is Good for Editing

- files are small and single-purpose
- import paths expose architecture
- domain logic is easy to locate
- persistence logic is centralized
- fewer chances to smear concerns across layers
