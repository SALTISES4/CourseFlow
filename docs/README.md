# CourseFlow vNext Documentation

This document set is the initial source of truth for the backend rebuild.

It is intentionally narrow in scope.

## In Scope

- backend repository layout
- backend stack and layer boundaries
- Editing rules
- DTO / API contract rules
- OpenAPI generation and **frontend client generation policy** (Hey API, Fetch SDK, TanStack Query)
- current entity-documentation folder structure
- starter runbooks for bootstrapping the new backend

## Out of Scope

These topics are intentionally not ratified here:

- full frontend application architecture (routing, design system, etc.)
- background jobs / workers
- websocket or realtime design
- deployment topology
- advanced caching strategy
- event-driven integration patterns
- full permissions matrix
- finalized folder contents for every future domain area

## API contracts, OpenAPI, and frontend clients (canonical pointers)

For **coding agents** and contributors implementing HTTP clients in `react/`:

| Topic | Canonical doc |
| --- | --- |
| OpenAPI generation from Django Ninja, export, and **do-not** rules | [docs/architecture/openapi_and_client_graph.md](architecture/openapi_and_client_graph.md) |
| **ADR:** Hey API + Fetch + TanStack Query; Redux graph store; not RTK Query as strategic codegen | [docs/architecture/adr_frontend_api_client.md](architecture/adr_frontend_api_client.md) |
| Backend stack + short frontend summary | [docs/architecture/backend_stack.md](architecture/backend_stack.md) |

## Current Direction

The backend is being rebuilt around:

- Django for project scaffolding, migrations, admin, auth integration, and ORM-backed persistence
- Django Ninja for the HTTP API layer
- explicit DTOs / schemas for request and response contracts
- pure Python application and domain layers
- PostgreSQL as the primary database
- `course_flow/` as the active backend package (`course_flow_legacy/` is reference-only). ORM source of truth: `course_flow/core/models/`.

Where possible, framework code remains at the boundary.

## Reading Order

1. `docs/architecture/repository_layout.md`
2. `docs/architecture/backend_stack.md`
3. `docs/architecture/llm_editing_rules.md`
4. `docs/architecture/api_contracts.md`
5. `docs/architecture/openapi_and_client_graph.md`
6. `docs/architecture/adr_frontend_api_client.md` (frontend API client and server-state decision)

## Operational runbooks

- [Staging deployment](runbooks/staging-deployment.md)

## Working Rule

When architecture is not yet confirmed, do not invent it in code or in docs.
Prefer explicit TODO markers and narrow placeholders over speculative structure.
