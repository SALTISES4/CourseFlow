# CourseFlow vNext Documentation

This document set is the initial source of truth for the backend rebuild.

It is intentionally narrow in scope.

## In Scope

- backend repository layout
- backend stack and layer boundaries
- Editing rules
- DTO / API contract rules
- OpenAPI generation and client workflow
- current entity-documentation folder structure
- starter runbooks for bootstrapping the new backend

## Out of Scope

These topics are intentionally not ratified here:

- frontend architecture
- background jobs / workers
- websocket or realtime design
- deployment topology
- advanced caching strategy
- event-driven integration patterns
- full permissions matrix
- finalized folder contents for every future domain area

## Current Direction

The backend is being rebuilt around:

- Django for project scaffolding, migrations, admin, auth integration, and ORM-backed persistence
- Django Ninja for the HTTP API layer
- explicit DTOs / schemas for request and response contracts
- pure Python application and domain layers
- PostgreSQL as the primary database
- `course_flow_v2/` as the active implementation target (`course_flow_legacy/` is reference-only)

Where possible, framework code remains at the boundary.

## Reading Order

1. `docs/architecture/repository_layout.md`
2. `docs/architecture/backend_stack.md`
3. `docs/architecture/llm_editing_rules.md`
4. `docs/architecture/api_contracts.md`
5. `docs/architecture/openapi_and_client_workflow.md`

## Working Rule

When architecture is not yet confirmed, do not invent it in code or in docs.
Prefer explicit TODO markers and narrow placeholders over speculative structure.
