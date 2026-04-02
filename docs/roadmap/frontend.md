---
title: Graph State Re-Architecture Roadmap
doc_type: architecture-roadmap
status: draft
owner: frontend-architecture
updated: 2026-03-30
tags:
  - frontend
  - redux
  - rtk
  - graph-editor
  - architecture
  - roadmap
---

# Graph State Re-Architecture Roadmap

> This document formalizes the architectural decisions for the workflow graph/editor rewrite and defines a phased implementation roadmap. :contentReference[oaicite:0]{index=0}

## Table of Contents

- [1. Purpose](#1-purpose)
- [2. Executive Decision Summary](#2-executive-decision-summary)
  - [2.1 Backend is authoritative for graph mutations](#21-backend-is-authoritative-for-graph-mutations)
  - [2.2 Redux Toolkit remains the frontend state foundation](#22-redux-toolkit-remains-the-frontend-state-foundation)
  - [2.3 Legacy graph slices are not the migration target](#23-legacy-graph-slices-are-not-the-migration-target)
  - [2.4 Optimistic UX is retained, but via local overlay](#24-optimistic-ux-is-retained-but-via-local-overlay)
  - [2.5 Future collaboration remains feasible without another full rebuild](#25-future-collaboration-remains-feasible-without-another-full-rebuild)
  - [2.6 We are not switching to Apollo/GraphQL at this stage](#26-we-are-not-switching-to-apollographql-at-this-stage)
- [3. Problem Statement](#3-problem-statement)
  - [3.1 Frontend mutation semantics are overpowered](#31-frontend-mutation-semantics-are-overpowered)
  - [3.2 Store responsibilities are mixed](#32-store-responsibilities-are-mixed)
  - [3.3 Old entity and reducer boundaries are legacy-shaped](#33-old-entity-and-reducer-boundaries-are-legacy-shaped)
  - [3.4 The system is hard to evolve toward collaboration](#34-the-system-is-hard-to-evolve-toward-collaboration)
- [4. Architectural Goals](#4-architectural-goals)
- [5. Target Architecture](#5-target-architecture)
  - [5.1 State layers](#51-state-layers)
  - [5.2 Rendering model](#52-rendering-model)
  - [5.3 Mutation model](#53-mutation-model)
  - [5.4 Backend response contract](#54-backend-response-contract)
  - [5.5 Revision model](#55-revision-model)
- [6. Frontend Store Design](#6-frontend-store-design)
  - [6.1 Proposed top-level shape](#61-proposed-top-level-shape)
  - [6.2 Canonical entity slices](#62-canonical-entity-slices)
  - [6.3 Graph load state](#63-graph-load-state)
  - [6.4 Graph UI state](#64-graph-ui-state)
  - [6.5 Optimistic operations state](#65-optimistic-operations-state)
- [7. Selector Strategy](#7-selector-strategy)
  - [7.1 Selectors own projection](#71-selectors-own-projection)
  - [7.2 Readiness gating](#72-readiness-gating)
  - [7.3 Effective projection](#73-effective-projection)
- [8. Fetch / Hydration Strategy](#8-fetch--hydration-strategy)
  - [8.1 Read model remains split by resource](#81-read-model-remains-split-by-resource)
  - [8.2 Parallel load](#82-parallel-load)
  - [8.3 Immediate normalization on arrival](#83-immediate-normalization-on-arrival)
  - [8.4 Staged rendering](#84-staged-rendering)
- [9. Mutation Strategy](#9-mutation-strategy)
  - [9.1 Explicit command orientation](#91-explicit-command-orientation)
  - [9.2 One user intent -> one backend command](#92-one-user-intent---one-backend-command)
  - [9.3 Bounded optimistic UX](#93-bounded-optimistic-ux)
- [10. Collaboration Readiness](#10-collaboration-readiness)
- [11. Technology Decision Record](#11-technology-decision-record)
- [12. Migration Strategy](#12-migration-strategy)
  - [12.1 Phase 0 — Architecture freeze and inventory](#121-phase-0--architecture-freeze-and-inventory)
  - [12.2 Phase 1 — Backend contract alignment](#122-phase-1--backend-contract-alignment)
  - [12.3 Phase 2 — New frontend graph state skeleton](#123-phase-2--new-frontend-graph-state-skeleton)
  - [12.4 Phase 3 — Read-side hydration](#124-phase-3--read-side-hydration)
  - [12.5 Phase 4 — Basic mutation flows without optimistic overlay](#125-phase-4--basic-mutation-flows-without-optimistic-overlay)
  - [12.6 Phase 5 — Add optimistic local overlay](#126-phase-5--add-optimistic-local-overlay)
  - [12.7 Phase 6 — Component migration and legacy retirement](#127-phase-6--component-migration-and-legacy-retirement)
  - [12.8 Phase 7 — Hardening and collaboration-ready cleanup](#128-phase-7--hardening-and-collaboration-ready-cleanup)
- [13. Risks and Mitigations](#13-risks-and-mitigations)
- [14. Acceptance Criteria for the Overall Rewrite](#14-acceptance-criteria-for-the-overall-rewrite)
- [15. Immediate Next Step](#15-immediate-next-step)

---

## 1. Purpose

The goal is to replace the current legacy frontend graph state model with a cleaner backend-authoritative architecture that:

- supports the new backend entity model
- removes legacy websocket-driven assumptions
- preserves a path toward future real-time collaboration
- restores fast local UX through controlled optimistic overlays
- remains conventional, maintainable, and cost-conscious

This is a rewrite of the graph/editor state boundary, not a rewrite of the entire frontend.

---

## 2. Executive Decision Summary

We are committing to the following decisions.

### 2.1 Backend is authoritative for graph mutations

The frontend will no longer be the primary executor of graph business rules.

The frontend sends explicit user intent such as:

- delete node
- create edge
- move node
- rename node
- assign node to channel

The backend determines:

- whether the command is valid
- what side effects occur
- what entities are created, updated, or deleted
- the canonical resulting workflow revision

### 2.2 Redux Toolkit remains the frontend state foundation

We will keep RTK as the client-state foundation.

We will not preserve the current graph Redux design.

We will replace the graph/editor state model with a new RTK architecture based on:

- canonical normalized graph entities
- explicit UI/editor state
- optimistic local operation overlay
- explicit mutation flows
- backend-authoritative delta application

**Server-state and HTTP transport (settled policy):** ordinary pages use **TanStack Query** with types and clients generated from OpenAPI via **Hey API** (fetch-based SDK). The graph editor uses **generated SDK / fetch functions** for imperative bootstrap and mutations; **TanStack Query is not** the canonical store for graph/editor domain state. **Redux normalized slices** remain the source of truth for the graph; the graph is not modeled primarily as a query cache. See `docs/architecture/openapi_and_client_workflow.md` and `docs/architecture/adr_frontend_api_client.md`.

### 2.3 Legacy graph slices are not the migration target

We are not attempting to gradually “clean up” the old graph Redux architecture into the new one.

The old graph Redux implementation mixed:

- canonical entity storage
- local-first mutation semantics
- websocket reconciliation assumptions
- layout manipulation
- UI state

That is a different architecture from the one we now want.

The old graph/editor slices should therefore be treated as legacy reference material, not the basis of the new system.

### 2.4 Optimistic UX is retained, but via local overlay

We still want instant-feeling edits for the current user.

We will not restore that by making the frontend the primary domain mutation engine.

Instead, we will implement:

- backend-authoritative canonical graph state
- a local optimistic operation overlay
- selectors that project effective UI state as:

```text
effective view = canonical state + local pending operations
````

This preserves responsiveness without reintroducing client-owned mutation semantics.

### 2.5 Future collaboration remains feasible without another full rebuild

This architecture is being designed so that later we can add:

* workflow-scoped realtime subscriptions
* remote delta application
* presence/awareness features
* version/revision-based concurrency handling

Realtime collaboration will later be an extension of the mutation/result contract, not a replacement of the architecture.

### 2.6 We are not switching to Apollo/GraphQL at this stage

We are not adopting Apollo Server / GraphQL as part of this rewrite.

**Reason:**

* our core problem is mutation authority and synchronization, not read query flexibility
* GraphQL does not solve command semantics, revisions, optimistic overlay, or collaboration policy by itself
* it would add architecture surface area at the wrong time

We will continue with a conventional backend-authoritative HTTP API shape, with future realtime push added later if needed.

---

## 3. Problem Statement

The current graph/editor frontend state model is not aligned with the new backend direction.

### 3.1 Frontend mutation semantics are overpowered

Legacy reducers encode business-like graph operations directly in the client, such as:

* delete node and related consequences
* create/link entities
* reorder graph structures
* mutate links during drag/drop

This makes the frontend act as a local domain executor rather than a client of an authoritative backend.

### 3.2 Store responsibilities are mixed

The current Redux graph layer mixes:

* canonical data storage
* mutation orchestration
* websocket-driven updates
* hydration/replacement logic
* editor/view state
* layout and drag behaviors

This makes it hard to reason about where truth lives.

### 3.3 Old entity and reducer boundaries are legacy-shaped

The current slice boundaries and naming reflect the old backend and old product shape.

They are not cleanly aligned to the new entities such as:

* workflow
* sections
* channels
* nodes
* edges
* units
* tags

### 3.4 The system is hard to evolve toward collaboration

Client-owned graph mutation semantics are not a good foundation for later multi-user concurrent editing.

If multiple clients each execute their own local mutation engine and rely on reconciliation later, complexity compounds quickly.

---

## 4. Architectural Goals

### Primary goals

* Make backend the source of truth for graph mutation semantics.
* Make Redux the source of truth for canonical client-side graph state.
* Restore fast local UX through optimistic overlays, not local domain authority.
* Separate canonical graph state from ephemeral UI/editor state.
* Make mutation and synchronization contracts explicit.
* Preserve a clean future path to real-time collaboration.

### Secondary goals

* Reduce conceptual load in reducers.
* Improve inspectability and debuggability.
* Make migration bounded and phased.
* Avoid unnecessary platform churn or technology rewrites.

---

## 5. Target Architecture

### 5.1 State layers

The new frontend graph architecture has three conceptual layers.

#### Layer A — Canonical shared graph state

This is the backend-authoritative state currently known by the client.

Examples:

* workflow metadata
* sections
* channels
* nodes
* edges
* tags
* workflow revision

This state is updated only by:

* initial `GET` hydration
* successful mutation responses
* later, remote realtime deltas
* explicit repair/refetch

This is the primary persistent client graph model.

#### Layer B — Local optimistic overlay

This layer contains pending local operations initiated by the current user and not yet confirmed by the backend.

Examples:

* pending node deletion
* pending node rename
* pending node move
* pending edge creation
* pending field edits

This layer exists only to improve perceived responsiveness.

It is:

* local
* provisional
* reversible
* subordinate to backend truth

It does not define the canonical graph.

#### Layer C — Ephemeral UI/editor state

This layer contains non-canonical, non-shared interaction state.

Examples:

* selected node
* selected edge
* hover state
* current open sidebar tab
* insertion mode
* drag-in-progress state
* viewport/pan/zoom if not persisted
* draft edge gesture state

This layer is not part of the graph domain model.

### 5.2 Rendering model

The UI should render from effective projected state, not directly from raw canonical state alone.

Conceptually:

```text
effective graph view = canonical graph state + optimistic local overlay
```

That means:

* canonical state remains stable and inspectable
* instant UX is still possible
* optimistic behavior remains bounded and reversible

### 5.3 Mutation model

All graph mutations should be modeled as explicit user-intent operations.

Examples:

* `deleteNode`
* `createNode`
* `moveNode`
* `renameNode`
* `createEdge`
* `deleteEdge`
* `assignNodeToChannel`

Mutation lifecycle:

1. user action occurs
2. frontend records optimistic local operation if applicable
3. frontend sends one explicit backend command
4. backend validates and computes canonical consequences
5. backend returns canonical delta + revision
6. frontend applies canonical delta
7. frontend removes/settles optimistic operation

### 5.4 Backend response contract

Mutation responses should be structured as canonical delta envelopes.

Example shape:

```json
{
  "workflowId": "wf_123",
  "revision": 42,
  "changes": {
    "nodes": {
      "created": [],
      "updated": [],
      "deleted": []
    },
    "edges": {
      "created": [],
      "updated": [],
      "deleted": []
    },
    "channels": {
      "created": [],
      "updated": [],
      "deleted": []
    },
    "tags": {
      "created": [],
      "updated": [],
      "deleted": []
    }
  },
  "meta": {
    "triggeredBy": "delete_node",
    "triggerEntityId": "node_9"
  }
}
```

We should prefer state deltas, not imperative UI instructions.

### 5.5 Revision model

Every workflow graph mutation should produce or reference a workflow revision/version.

This is required for:

* stale response handling
* future collaborative editing
* mutation ordering
* fallback reconciliation
* audit/debugging clarity

The frontend must store workflow revision alongside canonical graph state.

---

## 6. Frontend Store Design

### 6.1 Proposed top-level shape

Illustrative target shape:

```ts
interface GraphState {
  workflowMeta: WorkflowMetaState
  sections: SectionsState
  channels: ChannelsState
  nodes: NodesState
  edges: EdgesState
  tags: TagsState

  graphLoad: GraphLoadState
  graphUi: GraphUiState
  optimisticOps: OptimisticOperationsState
}
```

### 6.2 Canonical entity slices

Canonical slices should store normalized entities and lightweight indexing.

Examples:

* `sections.byId`
* `channels.byId`
* `nodes.byId`
* `edges.byId`

Relationship maps that are single-entity in nature may be stored if useful, such as:

* `nodeIdsByWorkflowId`
* `edgeIdsByWorkflowId`
* `channelIdsByWorkflowId`

Cross-entity projections should generally be selectors first, not reducer-maintained derived state.

### 6.3 Graph load state

We need explicit resource-level loading states.

Example:

```ts
type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed'
```

Per workflow:

* channels load status
* nodes load status
* edges load status
* tags load status

This supports staged hydration and readiness gating.

### 6.4 Graph UI state

This slice should contain only ephemeral editor/view concerns.

Examples:

* selected node ID
* selected edge ID
* hovered entity
* insertion mode
* current toolbar mode
* sidebar panel state
* drag preview state
* local pan/zoom if not persisted

This slice must not contain canonical graph mutation semantics.

### 6.5 Optimistic operations state

This slice tracks pending local operations.

Example:

```ts
interface PendingOperation {
  id: string
  workflowId: string
  type: 'deleteNode' | 'moveNode' | 'renameNode' | 'createEdge'
  targetIds: string[]
  status: 'pending' | 'failed'
  submittedAt: string
  payload: unknown
}
```

This slice exists to power optimistic projection and response settlement.

---

## 7. Selector Strategy

### 7.1 Selectors own projection

Selectors should own cross-entity projection and readiness-based derivation.

Examples:

* `selectCanRenderNodes`
* `selectCanRenderEdges`
* `selectNodesForChannel`
* `selectRenderableEdges`
* `selectEffectiveNodes`
* `selectEffectiveEdges`

### 7.2 Readiness gating

Selectors must account for dependency readiness.

Examples:

* nodes are renderable only when channels + nodes are loaded
* edges are renderable only when nodes + edges are loaded

We are not serializing fetches for this reason; we are decoupling fetch order from render readiness.

### 7.3 Effective projection

Selectors should merge canonical state with optimistic overlays.

Examples:

* pending node delete hides node in effective view
* pending node move temporarily overrides `x/y` position
* pending rename shows provisional name
* edges attached to effectively hidden nodes are suppressed in effective rendering

This is a projection concern, not a canonical mutation concern.

---

## 8. Fetch / Hydration Strategy

### 8.1 Read model remains split by resource

We will keep separate `GET`s for graph resources, such as:

* workflow metadata
* sections
* channels
* nodes
* edges
* tags

This remains aligned with the backend’s split resource model.

### 8.2 Parallel load

These resources should be fetched in parallel where possible.

We should not serialize requests solely because one resource depends on another for rendering.

Fetching and render readiness are separate concerns.

### 8.3 Immediate normalization on arrival

As soon as a resource arrives, it should be normalized into canonical store state.

We do not wait for all graph resources before storing.

The UI and selectors decide what is ready to render.

### 8.4 Staged rendering

The page can render progressively.

Example:

* graph shell after workflow metadata
* channel structure after channels
* nodes after channels + nodes
* edges after channels + nodes + edges
* tags and extras later

This avoids all-or-nothing blank loading while preserving dependency correctness.

---

## 9. Mutation Strategy

### 9.1 Explicit command orientation

Mutations should originate from explicit actions/thunks/hooks, not inferred from store diffs.

**Bad pattern:**

* state changes
* listener notices mutation-like diff
* listener infers backend writes

**Good pattern:**

* explicit action: `deleteNode(nodeId)`
* mutation flow owns API call and local optimistic overlay

We do not want store-diff-driven persistence.

### 9.2 One user intent -> one backend command

A node deletion should not become multiple client-authored authoritative API writes due to frontend cascades.

The frontend sends the user’s intent.
The backend determines the consequences.

### 9.3 Bounded optimistic UX

Optimistic local behavior is allowed, but should remain shallow and reversible.

**Suitable for optimistic local projection:**

* move node
* rename node
* provisional edge preview
* visual suppression of deleted node

**Conservative / shallow optimistic treatment:**

* delete node with rich cascading effects
* structural reorders affecting many relationships
* cross-boundary moves with backend rules
* anything with significant permission or validation risk

In those cases, pending/dimmed/provisional UI is preferable to trying to replicate full backend cascade semantics.

---

## 10. Collaboration Readiness

This rewrite must preserve a future path to collaboration.

### 10.1 Not in current scope

We are not implementing collaborative editing now.

We are preserving the architecture required to add it later.

### 10.2 What this rewrite must preserve

The following must be supported by design:

* canonical delta envelopes
* workflow revisions
* explicit mutation commands
* canonical state separate from optimistic local overlay
* canonical state separate from ephemeral presence state

### 10.3 Later additive path

Later, we can add:

* workflow-scoped realtime channel
* backend event emission after committed mutations
* remote delta broadcasting to subscribed clients
* presence events
* edit indicators
* coarse conflict policy

Because mutations and deltas are explicit, realtime later becomes additive rather than a second redesign.

---

## 11. Technology Decision Record

### Decision: keep RTK

We are retaining Redux Toolkit.

#### Why

* explicit client/editor state still exists
* graph editor state is not only server-state fetching
* RTK remains conventional and well supported
* DevTools and explicit reducers are useful for a complex editor
* future remote deltas and optimistic overlay fit well with RTK

### Non-decision

We are not preserving the old Redux graph architecture.

### Decision: use HTTP-first, not Apollo/GraphQL

We are not adopting Apollo Server or GraphQL at this time.

#### Why

* current pain is mutation/sync architecture, not read query flexibility
* GraphQL would not remove the need for commands, deltas, revisions, or collaboration policy
* it adds architecture surface area at the wrong stage
* conventional HTTP endpoints are sufficient and lower risk

### Decision: Hey API + Fetch + TanStack Query for non-graph server-state

OpenAPI generated from Django Ninja is the contract input. **Hey API** generates TypeScript types, a **fetch** client/SDK, and **TanStack Query** integration for conventional server-state. **RTK Query** is not the strategic codegen or default server-state layer for new work. Graph/editor flows use the **generated fetch/SDK** with **Redux** as canonical graph state, not TanStack Query as the graph cache. Full rationale: `docs/architecture/adr_frontend_api_client.md`.

---

## 12. Migration Strategy

We will rewrite the graph state layer intentionally and phase it.

### 12.1 Phase 0 — Architecture freeze and inventory

**Goal**

* stop continuing ad hoc cleanup of legacy graph Redux
* document target architecture and migration scope
* inventory what remains useful from legacy frontend

**Deliverables**

* this roadmap
* legacy behavior inventory
* list of old reducers/actions to retire
* identified presentational components to keep

**Acceptance criteria**

* team agrees old graph Redux is legacy reference, not migration target
* target architecture and phase boundaries are explicit

### 12.2 Phase 1 — Backend contract alignment

**Goal**

Finalize assumptions about read endpoints and mutation response envelopes.

**Tasks**

* confirm graph resource endpoints
* define workflow revision semantics
* define mutation delta envelope format
* identify operations needing optimistic UX
* identify mutation operations requiring conservative handling

**Acceptance criteria**

* frontend can rely on stable read/write contracts
* command and response format are documented

### 12.3 Phase 2 — New frontend graph state skeleton

**Goal**

Create the new RTK graph state structure with no legacy mutation logic.

**Tasks**

* create canonical slices
* create graph load slice
* create graph UI slice
* create optimistic ops slice
* define selectors scaffolding
* remove dependency on old graph state for new code paths

**Acceptance criteria**

* new store compiles
* no legacy graph reducers are reused in new module
* no backend calls yet required for initial scaffolding

### 12.4 Phase 3 — Read-side hydration

**Goal**

Load workflow graph resources into the new canonical store.

**Tasks**

* bootstrap graph page loading flow
* parallel fetch sections/channels/nodes/edges/tags
* normalize each resource on arrival
* add readiness selectors
* render graph shell and staged layers from new state

**Acceptance criteria**

* graph page can load from new store
* graph can render from canonical state only
* old websocket/refresh assumptions are not required

### 12.5 Phase 4 — Basic mutation flows without optimistic overlay

**Goal**

Implement backend-authoritative mutation lifecycle first, without advanced optimistic behavior.

**Tasks**

* delete node
* create edge
* delete edge
* rename node
* move node commit flow
* apply backend deltas to canonical store

**Acceptance criteria**

* mutations work end-to-end
* UI updates only through canonical store application
* no store-diff-driven persistence exists

### 12.6 Phase 5 — Add optimistic local overlay

**Goal**

Reintroduce instant-feeling UX in a bounded, disciplined way.

**Tasks**

* pending operation registry
* selectors that project effective state
* optimistic handling for simple operations first:

  * rename node
  * move node
  * provisional edge create
* conservative optimistic treatment for destructive operations

**Acceptance criteria**

* local edits feel responsive
* canonical state remains backend-authoritative
* rollback/settlement is operation-scoped

### 12.7 Phase 6 — Component migration and legacy retirement

**Goal**

Finish moving graph/editor UI components onto the new store model.

**Tasks**

* replace old selectors/action creators in editor components
* remove legacy graph reducers and websocket-based graph synchronization code
* retire obsolete graph action creator patterns
* clean dead code

**Acceptance criteria**

* workflow editor uses only new graph state module
* legacy graph Redux is no longer in active path
* no hidden dependencies on old graph slices remain

### 12.8 Phase 7 — Hardening and collaboration-ready cleanup

**Goal**

Prepare system for long-term maintainability and future realtime extension.

**Tasks**

* version mismatch handling
* repair/refetch strategy
* delta application tests
* selector correctness tests
* document future realtime integration points

**Acceptance criteria**

* mutation/revision model is stable
* failure/recovery paths are explicit
* future push-based delta application is straightforward to add

---

## 13. Risks and Mitigations

### Risk 1 — Over-modeling optimistic logic

If the frontend tries to predict full backend mutation consequences, we drift back into the old problem.

**Mitigation**

* keep optimistic overlay shallow
* use conservative pending UI for complex operations
* treat backend delta as final truth

### Risk 2 — Reintroducing derived-state chaos into reducers

If reducers begin rebuilding cross-entity projection logic eagerly, complexity returns.

**Mitigation**

* canonical reducers store normalized data
* selectors own cross-entity projection first
* only promote derived indexes into store when justified by profiling

### Risk 3 — Leaking legacy assumptions into new module

The team may be tempted to re-use old action patterns or legacy mutation semantics.

**Mitigation**

* no reuse of old graph reducers/actions in new module
* legacy code used only as behavioral reference
* explicit architecture review per phase

### Risk 4 — Backend response contract remains underspecified

If mutation responses are ambiguous, frontend logic will become ad hoc again.

**Mitigation**

* document delta envelopes and revisions before implementing broad mutation flows
* prefer explicit state deltas over imperative instructions

### Risk 5 — Scope explosion

Because this is a conceptual rewrite, it may sprawl.

**Mitigation**

* phase strictly
* read side first
* non-optimistic mutation flow before optimistic overlay
* collaboration explicitly out of current scope

---

## 14. Acceptance Criteria for the Overall Rewrite

The rewrite is successful when all of the following are true:

* The workflow graph page loads from the new canonical graph store.
* Graph rendering no longer depends on legacy websocket/refresh architecture.
* Graph mutations are initiated by explicit command flows, not store-diff listeners.
* Backend mutation responses apply canonical deltas to the store.
* Optimistic local UX exists through pending overlays, not client-owned mutation semantics.
* Canonical graph state, optimistic overlay state, and UI/editor state are cleanly separated.
* Workflow revision is tracked in the frontend.
* The architecture can later accept remote deltas without redesigning the store model.

---

## 15. Immediate Next Step

* architecture freeze / backend contract doc
* new RTK graph state scaffolding
* read-side hydration
* basic mutation flows
* optimistic overlay
* migration and retirement of legacy graph Redux

```
