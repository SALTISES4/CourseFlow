
# Graph Graph Mutation Concurrency

## Status

Accepted

## Context

CourseFlow v2 models graph graph mutations through application services that operate on nodes, edges, and related graph-scoped graph state. These mutations are not independent row-level CRUD operations in the architectural sense; they are graph operations that may depend on multiple entities and invariants at once.

Examples:

* creating an edge depends on both source and target nodes existing
* deleting a node may affect connected edges and graph consistency
* mutation responses may include graph revision changes or ordered delta envelopes

The system requires a clear concurrency policy for write operations inside a single graph.

## Decision

We treat the **graph** as the aggregate root for persisted graph mutations.

All graph mutations within a graph must:

1. begin a database transaction
2. acquire a row lock on the owning graph using `SELECT ... FOR UPDATE`
3. validate the requested mutation against the current graph state
4. apply all writes inside the same transaction
5. update graph revision metadata if applicable
6. commit the transaction

In Django terms, the canonical pattern is:

```python
@transaction.atomic
def mutate_graph_graph(...):
    graph = Graph.objects.select_for_update().get(uuid=graph_uuid)
    ...
```

The graph row is used as the **lock anchor** for all graph mutations within that graph.

## Rationale

### 1. Graph mutations are aggregate operations

Operations such as node creation, edge creation, node deletion, edge deletion, and related graph updates often depend on multiple rows and domain invariants simultaneously. They should not be modeled as isolated leaf-row writes from a concurrency perspective.

### 2. Coarse-grained serialization is simpler and safer

By locking the graph row first, all graph mutations for the same graph are serialized, provided all mutation paths follow the same rule. This avoids a large class of race conditions without requiring entity-specific locking schemes.

### 3. Ordered mutation semantics become easier to reason about

If the backend emits graph mutation envelopes, increments graph revision IDs, or otherwise expects a stable write ordering, serializing writes through a single graph lock produces more predictable behavior.

### 4. This fits the current product phase

At the current stage, correctness and architectural clarity are more important than maximizing concurrent write throughput inside the same graph. Fine-grained concurrency can be introduced later if it becomes necessary.

## What this guarantees

If all graph mutation paths acquire the graph lock consistently, then mutations within the same graph are serialized at the application level.

This prevents classes of race conditions such as:

* create-edge racing with delete-node
* concurrent edge creations violating graph invariants
* inconsistent graph revision sequencing
* stale validation followed by conflicting writes in another transaction

## What this does **not** guarantee

Locking the graph row does **not** automatically lock all nodes and edges in that graph.

This design only works if the following discipline is maintained:

> Every graph-mutating code path must acquire the graph row lock before reading or writing graph graph state.

If some mutation paths bypass the graph lock, the concurrency model becomes partial and unreliable.

This lock also does **not** replace structural database guarantees. The system must still rely on:

* foreign keys
* uniqueness constraints where applicable
* indexes
* explicit application-level validation for graph-specific rules

## Scope

The graph lock policy applies to persisted graph graph mutations, including but not limited to:

* create node
* update node
* delete node
* move node if persisted in graph state
* create edge
* update edge
* delete edge
* attach or detach graph-scoped related entities
* bulk graph mutations
* graph layout writes, if those writes are currently treated as part of graph graph persistence

## Non-goals

This decision does not attempt to optimize for:

* high-frequency concurrent editing within the same graph
* real-time collaborative multi-user graph editing
* fine-grained node-level or edge-level locking
* lock-free or partially parallel graph mutation execution

Those concerns may be addressed later if contention becomes material.

## Tradeoffs

### Benefits

* simple concurrency model
* easier reasoning about graph invariants
* clear aggregate boundary
* stable write ordering within a graph
* reduced risk of subtle race conditions in early development

### Costs

* unrelated writes within the same graph will block each other
* throughput is lower for concurrent edits on the same graph
* correctness depends on all mutation paths following the same lock discipline
* coarse locking may become a bottleneck in future collaborative editing scenarios

## Implementation guidance

### Canonical graph lock helper

Use a helper that loads and locks the graph by unique identifier:

```python
class GraphMutationService:
    def _get_locked_graph(
        self,
        graph_uuid: UUID,
        user_id: int,
    ) -> tuple[Graph | None, MutationError | None]:
        try:
            graph = Graph.objects.select_for_update().get(uuid=graph_uuid)
        except Graph.DoesNotExist:
            return None, "not_found"

        if graph.owner_id != user_id:
            return None, "forbidden"

        return graph, None
```

`get()` is preferred over `filter(...).first()` for unique UUID lookup because it encodes the invariant that exactly one row is expected and does not silently mask duplicate-row integrity failures.

### Required rule for mutation services

Every service method that mutates graph graph state must:

* be wrapped in `@transaction.atomic`
* acquire the graph lock before graph reads used for validation
* perform mutation writes inside the same transaction
* update graph revision metadata inside the same transaction, if revisions are part of the write contract

### Database assumptions

This design assumes a database backend with real row-level locking semantics, such as PostgreSQL.

Development behavior on SQLite should not be treated as representative of production locking semantics.

## Consequences for API design

This ADR is compatible with either of the following endpoint styles:

### Parent-scoped mutation style

```text
POST   /graph/{graph_uuid}/nodes
POST   /graph/{graph_uuid}/edges
DELETE /graph/{graph_uuid}/nodes/{node_uuid}
DELETE /graph/{graph_uuid}/edges/{edge_uuid}
```

### Mixed style with flat leaf-resource endpoints

```text
POST   /graph/{graph_uuid}/nodes
POST   /graph/{graph_uuid}/edges
PATCH  /node/{node_uuid}
DELETE /node/{node_uuid}
PATCH  /edge/{edge_uuid}
DELETE /edge/{edge_uuid}
```

The concurrency policy does not depend on the public URL shape. It depends on all mutation code paths resolving the owning graph and acquiring the graph lock before mutation.

## Rejected alternatives

### 1. No explicit aggregate lock

Rejected because validation and mutation would be more vulnerable to races across interdependent graph operations.

### 2. Node-level or edge-level locking only

Rejected for now because graph invariants often span multiple entities, making fine-grained locking harder to reason about and easier to implement incorrectly.

### 3. Optimistic concurrency only

Rejected for the current phase because it would add complexity before the basic graph mutation lifecycle is stable.

## Future reconsideration triggers

Revisit this decision if any of the following become true:

* multiple users frequently edit the same graph concurrently
* lock contention becomes measurable in production
* persisted layout/view writes become high-frequency and should not block structural graph mutations
* real-time collaboration requires finer-grained or optimistic concurrency models

## Summary

Graph graph mutations are serialized per graph by locking the graph row inside a transaction. The graph row acts as the aggregate lock anchor for graph persistence. This is an intentionally coarse-grained concurrency policy chosen for correctness, simplicity, and predictable mutation ordering during the current phase of CourseFlow v2 development.
