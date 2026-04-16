# ADR: Frontend API client generation and server-state layer

**Status:** Accepted  
**Scope:** React frontend (`react/`), API consumption, OpenAPI-driven clients

## Context

- The team requires **one authoritative HTTP contract**: OpenAPI produced from Django Ninja routes and schemas.
- The product needs **both**:
  - **Declarative server-state** for conventional pages (lists, detail, forms) with cache semantics familiar to product engineers.
  - **Imperative orchestration** for the graph graph/editor (bootstrap, multi-step mutations, delta application into Redux) where request/response shapes are not well modeled as a long-lived query cache.
- The public API surface is **relatively small**; codegen and shared types should pay for themselves without duplicated DTO maintenance.
- **Graph/editor canonical state** is intentionally **normalized Redux**, not a TanStack Query cache; treating the editor graph as “server state” in a query library would duplicate ownership and fight the domain model.

## Decision

1. **OpenAPI** (generated from Django Ninja) remains the **single source of truth** for HTTP contracts.
2. **Hey API** is the **standard tool** for generating frontend artifacts from that OpenAPI document:
   - TypeScript types aligned with the spec
   - **Fetch-based** client / SDK functions
   - **TanStack Query** helpers (query/mutation options) where applicable
3. **TanStack Query** is the **strategic default** for **ordinary server-state** (resource reads/writes that are naturally cache- and key-oriented).
4. **Paginated list screens** use **backend pagination** (`page`, `page_size`, `{ items, meta }` with pagination in `meta`); TanStack Query keys include those query params so each page is a separate fetch. **No** full-list download plus client-side `slice` for paging (see [api_response_envelope_naming_conventions.md](api_response_envelope_naming_conventions.md) and [openapi_and_client_graph.md](openapi_and_client_graph.md)).
5. **Generated SDK / fetch functions** are used **directly** for **graph/editor** flows (orchestration, thunks, command handlers) that feed **normalized Redux slices** as the canonical client-side graph store.
6. **RTK Query** (including `@rtk-query/codegen-openapi`) is **not** the long-term strategic codegen or server-state layer for new work.

### Rule: generated API directory (`react/src/api`)

The directory **`react/src/api`** (and everything Hey API writes beneath it per `react/openapi-ts.config.ts`) is **generated output only**.

- **Do not** edit files in this directory by hand—not for fixes, not for one-off tweaks, not to “match” something until the next regen.
- **Do** change the **backend** routes/schemas, export **OpenAPI**, and **re-run Hey API** (`yarn openapi-ts` from `react/` with the configured Node version) so the tree is regenerated from the spec.
- If the generator’s output is wrong, fix **inputs** (OpenAPI from Ninja, Hey API config/plugins, or tool version), not the emitted files.

Violations make the client drift from the contract, break the next codegen run, and hide real contract bugs in unreviewed diffs.

Detailed graph and related “do not” rules live in [openapi_and_client_graph.md](openapi_and_client_graph.md).

## Consequences

**Positive**

- One pipeline from backend schemas → OpenAPI → generated types and clients; fewer handwritten DTOs drifting from the API.
- Clear split: TanStack Query owns conventional remote state; Redux owns graph domain state; generated fetch functions bridge HTTP without inventing parallel transport layers.
- Graph rewrite decisions (backend-authoritative mutations, normalized slices, optimistic overlay) stay intact; only the **transport and non-graph server-state** strategy is standardized.

**Tradeoffs / discipline**

- **`react/src/api` is off-limits to manual edits**; it must always reflect Hey API output from OpenAPI (see rule above).
- Teams must **consume generated types** and **avoid** parallel handwritten API models for the same endpoints.
- Feature code should **not** add **bespoke HTTP wrappers** that duplicate the generated client surface without an exceptional reason (documented in code review).
- Legacy or experimental RTK Query usage may exist in the repo during migration; **new features** should follow this ADR unless explicitly exempted.

## Related documents

- [openapi_and_client_graph.md](openapi_and_client_graph.md) — operational graph and anti-patterns
- [backend_stack.md](backend_stack.md) — backend OpenAPI generation context
- `docs/roadmap/frontend.md` — graph/editor Redux architecture (orthogonal to this ADR’s transport choice)
