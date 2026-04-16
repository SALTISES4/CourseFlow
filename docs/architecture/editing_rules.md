# Editing Rules

These rules are for Cursor, Codex, and similar coding agents working in the CourseFlow vNext repository.

## Core Principle

Make the smallest correct change that respects the documented architecture.

## Required Editing Behavior

### 1. Prefer small edits

- edit the narrowest file set possible
- avoid broad refactors unless the task explicitly requires one
- preserve existing naming and module layout unless the task is about changing them

### 2. Do not guess missing architecture

- do not invent services, modules, or patterns that are not yet documented
- do not infer background jobs, websockets, caching layers, or event buses
- leave a clear TODO if a required decision is missing

### 3. Follow the layer boundaries

- API code stays in `src/api/`
- application orchestration stays in `src/application/`
- business rules stay in `src/domain/`
- Django ORM and persistence stay in `src/infrastructure/`

### 4. Keep transport, domain, and persistence shapes separate

Do not blur together:

- Ninja request/response schemas
- application commands / results
- domain models
- ORM models

### 5. Prefer explicit mapping

When data crosses layers, map it intentionally.

Do not pass ORM objects through the system as if they were domain objects.

### 6. Fail closed on uncertainty

When information is missing:

- do not fabricate a complete solution
- document the uncertainty
- implement only the confirmed portion
- keep the code easy to extend later

## Rules for New Backend Work

### Required rules

1. `src/domain/` must not import Django.
2. `src/application/` must not import Django ORM models directly.
3. endpoints must remain thin.
4. repositories must be defined as application-facing interfaces and implemented in infrastructure.
5. ORM models must not become the de facto domain model.
6. Ninja Schemas must not implement business graph.
7. use Django Ninja `Schema` classes as the default API contract type.

### Explicit anti-patterns

Do not introduce:

- business-heavy methods on Django models as the main graph
- endpoint functions that directly query many models and orchestrate a full use case inline
- response schemas used as internal domain state containers
- feature code that mixes Django ORM and speculative SQLAlchemy usage
- a second parallel API DTO framework competing with Ninja Schemas
- large speculative scaffolds for unconfirmed subsystems

## Patch Style

Prefer this order for a new feature:

1. add or update request/response schema
2. add or update command/query
3. add or update application service
4. add or update domain rule
5. add or update repository interface
6. implement infrastructure adapter
7. wire endpoint
8. add focused tests

## Test Guidance

- add tests closest to the changed layer
- prefer narrow tests over giant integration tests for first-pass work
- do not generate excessive test scaffolding for code that does not exist yet

## Documentation Guidance

When you add a new architectural construct that will be reused, update the relevant doc in `docs/` in the same change set.

## Default Response to Missing Decisions

Use language such as:

- "This appears not yet ratified in the docs"
- "Implementing only the confirmed slice"
- "Leaving extension points without inventing the rest"
