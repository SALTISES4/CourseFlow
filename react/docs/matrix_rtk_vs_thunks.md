## Decision matrix: TanStack Query vs thunks + normalized Redux slices (graph)

**Policy:** CourseFlow’s strategic server-state layer is **TanStack Query** with **Hey API**–generated types and a **fetch**-based client (see [`../../docs/architecture/adr_frontend_api_client.md`](../../docs/architecture/adr_frontend_api_client.md)). This document replaces an earlier RTK Query–centric framing: the **same architectural split** applies—only the recommended **query/cache library** for ordinary remote state has changed.

### Core rule

Choose based on the **canonical local representation**:

- Use **TanStack Query** when the canonical local representation is a **server-state cache entry** keyed by query key, with TanStack Query owning dedupe, staleness, and invalidation/refetch behavior for **ordinary** resource reads/writes.
- Use **thunks (or async command handlers) + fetch/SDK + normalized Redux slices** when the canonical local representation is a **domain entity store** such as `nodes.byId`, `edges.byId`, `workflowMeta`, with reducers owning merge semantics and long-lived state shape—the **workflow graph/editor**.

The graph editor is **not** modeled as TanStack Query’s primary cache; **Redux** remains canonical for graph state.

---

## Fast decision table

| Question | If yes | Default choice |
|---|---|---|
| Is the UI mostly reading “the result of query X with args Y”? | The cached query result is the useful unit of state | **TanStack Query** |
| Do multiple components need the same request result, with dedupe and shared loading/error state? | Shared async state for a resource | **TanStack Query** |
| Do you want invalidation and refetch to keep list/detail data current? | Standard CRUD / list pages | **TanStack Query** |
| Is the local source of truth a normalized entity graph, not a request result? | State is organized by domain IDs, not query keys | **Thunk + Redux slices** |
| Are responses merged into one long-lived editor model with reducer-owned merge? | Graph hydration and deltas | **Thunk + Redux slices** |
| Will mutations apply deltas directly into entity adapters and selectors read those adapters? | Query cache is secondary at best | **Thunk + Redux slices** |
| Would using TanStack Query create a second copy of the same canonical graph data? | Avoid duplicate ownership | **Thunk + Redux slices** |

---

## Precision rules

### Prefer TanStack Query when

1. **Identity is naturally query-shaped** — e.g. project list, library search, user profile settings.
2. **You want shared async state** without hand-rolling dedupe and status for every screen.
3. **Invalidation/refetch** after mutations is the right control plane for that feature.
4. **OpenAPI-generated types** and Hey API helpers align with list/detail CRUD.

### Prefer thunks + normalized Redux slices when

1. **Identity is domain-shaped** — `nodes.byId`, `edges.byId`, workflow revision on the client.
2. **Reducers own merge semantics** for partial/overlapping payloads and multi-endpoint hydration.
3. **State must outlive** component mount; the editor store is intentionally long-lived.
4. **Mutations apply authoritative deltas** into normalized entities; refetch-the-whole-graph is not the default mutation path.
5. **Generated fetch/SDK** is called from command flows; **TanStack Query is not** the owner of canonical graph truth.

---

## Courseflow policy

### Use TanStack Query (with Hey API–generated client/types) for

- Project / workflow list and detail pages that are “ordinary” server-state
- Library search
- User settings, notifications, auth-adjacent resource reads
- Standard CRUD where invalidate + refetch is acceptable

### Use thunks + normalized Redux slices + generated fetch/SDK for

- Workflow graph bootstrap and multi-resource hydration
- Nodes, edges, sections, channels as normalized entities
- Revision/delta application after graph mutations
- Long-lived workflow editor state

**Do not** duplicate canonical graph data in TanStack Query cache and Redux simultaneously.

---

## Anti-patterns

1. **Dual canonical ownership** — TanStack Query cache and Redux slices both “owning” the same graph.
2. **TanStack Query only as a thin wrapper** that immediately dispatches everything into Redux without a clear reason—prefer calling the **generated SDK** from thunks when the cache adds no value.
3. **Forcing graph/editor state into** generic **invalidation-only** semantics when the real mutation path is **delta application into slices**.

---

## Short rules for coding agents

1. Ordinary server-state pages → **TanStack Query** + generated types/client.
2. Graph/editor domain state → **Redux** + **generated fetch/SDK** in orchestration code; **not** TanStack Query as the graph store.
3. One canonical owner for the workflow graph.

---

## ADR-friendly summary

**Decision:** TanStack Query replaces RTK Query as the strategic server-state layer; **Hey API + OpenAPI** replace RTK Query codegen. **Redux Toolkit** remains for client and graph state; **graph** flows use **imperative generated clients**, not TanStack Query as canonical graph storage.

**Canonical doc:** [`../../docs/architecture/adr_frontend_api_client.md`](../../docs/architecture/adr_frontend_api_client.md)
