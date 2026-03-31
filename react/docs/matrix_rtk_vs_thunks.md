## Decision Matrix: RTK Query vs Thunks + Normalized Redux Slices

Use this as a repo policy for Courseflow.

### Core rule

Choose based on the **canonical local representation**:

- Use **RTK Query** when the canonical local representation is a **query result cache entry**, keyed by endpoint + args, with RTK Query owning dedupe, subscription lifetime, and invalidation/refetch behavior. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/overview?utm_source=chatgpt.com))
- Use **thunks / fetch helpers + normalized slices** when the canonical local representation is a **domain entity store** such as `nodes.byId`, `edges.byId`, `workflowMeta.byId`, with reducers owning merge semantics and long-lived state shape. RTK Query can be customized heavily, but its primary design goal is to eliminate hand-written fetching/cache logic for common cases, not to be the universal owner of every domain-specific projection. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/overview?utm_source=chatgpt.com))

---

## Fast decision table

| Question | If yes | Default choice |
|---|---|---|
| Is the UI mostly reading “the result of query X with args Y”? | The query result itself is the useful unit of state | **RTK Query** |
| Do multiple components need the same request result, with dedupe and shared loading/error state? | RTK Query is built for shared cached query results in Redux | **RTK Query** ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior?utm_source=chatgpt.com)) |
| Do you want tag invalidation and refetch to keep data current? | RTK Query provides this model directly | **RTK Query** ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching?utm_source=chatgpt.com)) |
| Is the local source of truth a normalized entity graph, not a request result? | State is organized by domain IDs, not query args | **Thunk + slices** |
| Are responses from multiple endpoints being merged into one long-lived editor/domain model? | Reducers own merge semantics | **Thunk + slices** |
| Will mutations apply deltas directly into entity adapters and selectors read those adapters? | Query cache is secondary at best | **Thunk + slices** |
| Would using RTK Query create a second copy of the same canonical data? | Avoid duplicate ownership | **Thunk + slices** |
| Is this ordinary list/detail CRUD with minimal transformation? | RTK Query removes boilerplate effectively | **RTK Query** ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/overview?utm_source=chatgpt.com)) |

---

## Precision rules

### Prefer RTK Query when all or most of the following are true

1. **Identity is naturally query-shaped**
   - Example: `getProject(id)`, `listProjects(filters)`, `searchLibrary(params)`.
   - The useful client object is “the result of this request”. RTK Query caches results by endpoint + serialized params and reuses existing cached data for the same request. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior?utm_source=chatgpt.com))

2. **You want subscription-aware sharing**
   - Multiple components may ask for the same data and should not trigger duplicate requests.
   - RTK Query tracks active subscriptions and cache retention for those query results. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior?utm_source=chatgpt.com))

3. **You want automated refetch semantics**
   - Mutation invalidates tags; active queries refetch.
   - RTK Query explicitly supports this as a first-class pattern. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching?utm_source=chatgpt.com))

4. **Transform needs are modest**
   - Some `transformResponse` is fine.
   - But the endpoint result still remains the meaningful unit of local state. RTK Query supports customization, but that is still within a query-cache model. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries?utm_source=chatgpt.com))

5. **You want less handwritten async boilerplate**
   - RTK Query exists partly to eliminate hand-written thunks/reducers for common fetching cases. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/overview?utm_source=chatgpt.com))

### Prefer thunks + normalized slices when all or most of the following are true

1. **Identity is domain-shaped, not query-shaped**
   - Example: `nodes.byId`, `edges.byId`, `outcomes.byId`.
   - The important local object is the entity graph, not “the response from endpoint X”.

2. **Reducers own merge semantics**
   - Payloads may be partial, overlapping, or arrive from multiple endpoints.
   - You want one reducer-controlled merge path into entity adapters.

3. **State must outlive individual query subscriptions**
   - The editor/graph store should remain canonical regardless of whether a component using a hook is mounted.
   - RTK Query is centered on query-cache lifecycle, whereas your domain store is intentionally long-lived. RTK Query docs also note that persisting API slices is generally not recommended because of staleness concerns. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/usage/persistence-and-rehydration?utm_source=chatgpt.com))

4. **Mutations apply domain deltas directly**
   - You are not merely invalidating and refetching.
   - You are applying authoritative deltas into normalized slices as the main mutation path.
   - RTK Query supports manual cache updates, but the docs position those as targeted mechanisms for optimistic/pessimistic updates or lifecycle adjustments, not the default shape of all application state management. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates?utm_source=chatgpt.com))

5. **RTK Query would become transport only**
   - If the real source of truth is elsewhere, RTK Query may only wrap the HTTP call while the actual ownership stays in slices.
   - In that case, much of RTK Query’s main value proposition is lost. RTK Query is optional and intended to simplify common fetching/caching use cases, not to be mandatory for every request. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/overview?utm_source=chatgpt.com))

---

## Courseflow policy

### Use RTK Query for

- Project detail pages
- Library/search/list endpoints
- Filtered collections
- Simple tags/disciplines lookups
- Standard CRUD forms where post-mutation invalidation/refetch is acceptable
- Data that is naturally “request result shaped”

Rationale: these are conventional server-resource queries, and RTK Query’s cache, dedupe, hooks, and invalidation model align directly with that usage. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/overview?utm_source=chatgpt.com))

### Use thunks + normalized slices for

- Workflow graph bootstrap
- Nodes / edges / outcomes / workflow meta as normalized entities
- Graph hydration orchestration across multiple requests
- Revision/delta application after mutations
- Long-lived workflow editor state
- Any flow where selectors read entity adapters as the canonical graph model

Rationale: the workflow graph is a reducer-owned domain store, not merely a cached query result. The client’s core abstraction is the normalized graph, so explicit writes into slices are the coherent ownership model.

---

## Anti-patterns to avoid

### 1. Dual canonical ownership
Do not make both of these “truth” at the same time:

- RTK Query cache entry for workflow graph
- normalized graph slices for the same graph

Pick one canonical owner. Otherwise invalidation, merge semantics, and stale-read debugging become ambiguous.

### 2. Using RTK Query only as a thin fetch wrapper
If every RTK Query endpoint immediately dispatches into slices and components never read RTK Query cache results, that is usually a sign the query cache is not the right owner.

### 3. Forcing graph/editor state into tag invalidation semantics
If the intended mutation path is “apply delta to normalized entities”, then invalidation + refetch may be the wrong default control plane.

---

## Approved hybrid model

A hybrid architecture is acceptable and likely optimal:

- **RTK Query** for ordinary resource fetching and CRUD
- **Thunk + normalized slices** for workflow graph domain state

This is consistent with Redux Toolkit guidance that RTK Query is optional, powerful for common data fetching/caching, and can eliminate handwritten logic where the query-cache model is the right fit. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/overview?utm_source=chatgpt.com))

---

## Short rule set for coding agents

1. If the local state should be keyed by **endpoint + args**, use **RTK Query**. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior?utm_source=chatgpt.com))
2. If the local state should be keyed by **domain entity IDs** and merged by reducers, use **thunks + slices**.
3. If a mutation should usually cause **invalidate + refetch**, prefer **RTK Query**. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching?utm_source=chatgpt.com))
4. If a mutation should usually cause **apply delta into normalized entities**, prefer **thunks + slices**.
5. Do not maintain two canonical copies of the same graph data.

---

## ADR-friendly summary

**Decision:**
Courseflow will use a hybrid data-access model.

**RTK Query** is the default for ordinary server-resource queries whose canonical local representation is a cached query result keyed by endpoint + args. It is preferred where deduplication, generated hooks, subscription-aware caching, and tag-based invalidation/refetch are the right operational model. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/overview?utm_source=chatgpt.com))

**Thunk/fetch orchestration with normalized Redux slices** is the default for workflow graph state, where the canonical local representation is a reducer-owned normalized entity graph keyed by domain IDs and updated via explicit merge/delta semantics.

**Consequence:**
The app will not force all HTTP traffic through RTK Query. RTK Query is a tool for query-result caching, not a mandatory wrapper for every backend interaction. ([redux-toolkit.js.org](https://redux-toolkit.js.org/rtk-query/overview?utm_source=chatgpt.com))
