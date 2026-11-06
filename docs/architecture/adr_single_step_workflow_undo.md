# ADR: Single-step workflow undo uses compensating commands

## Status

Accepted; Phase 1 implemented

## Date

2026-11-06

## Context

CourseFlow needs one step of undo history for structural mutations in the Workflow and Outcomes views. The feature is not intended to provide an audit log, an unlimited edit history, database transaction rollback after commit, or Git-like state reconstruction.

The graph is already the aggregate root for workflow graph mutations. Those mutations execute inside a database transaction, acquire the graph row lock, increment the graph revision, and return a backend-authoritative graph mutation delta.

Undo must support both simple mutations and bounded aggregate deletion. Deleting a node can remove incident edges, assignments, typed metadata, and comment threads, change grid placement, and create a bypass edge. Deleting a section or channel removes multiple nodes and every edge incident on those nodes, including edges that cross the deleted aggregate boundary.

Fields managed through auto-update forms are deliberately outside the initial functional scope. Their interaction boundaries are not suitable for reliable one-step undo without a separate grouping contract.

## Decision

### 1. Undo is a compensating command

Undo is represented as a server-authored inverse command. Executing undo applies a new forward database mutation whose result compensates for the previous in-scope mutation.

Undo does not roll back a previously committed database transaction and does not restore a database backup.

### 2. Undo is graph-scoped and single-step

At most one undo command is available for a graph. A later successfully finalized in-scope mutation replaces the previous command. Failed, rejected, aborted, or cancelled attempts do not create or replace it.

Each undo command is owned by the user who finalized the represented mutation. Only that user may execute it, and only while that user holds the workflow edit lease.

When the workflow edit lease changes to a different user, the existing undo command is deleted. Undo authority is not transferred, delegated, or retained for later reactivation. Refreshing or reacquiring the lease by the same user without an intervening different holder is not a handoff and does not delete the command.

An excluded auto-update mutation does not create an undo command and does not clear or replace an existing structural undo command.

Because auto-update mutations increment graph revision metadata, undo cannot rely only on equality with the graph revision captured when the structural command was recorded. Revision and conflict validation must allow intervening excluded auto-update mutations while still rejecting or replacing stale structural commands. Each inverse command must change only the structural fields and relationships it owns so that later auto-updated values survive whenever the entity remains present after undo.

### 3. The backend derives and validates undo data

The backend derives the inverse command from locked pre-mutation state. Clients do not submit executable inverse-command payloads.

Any persisted payload must be typed, discriminated by a constrained command kind, schema-versioned, and validated before execution. JSON is an acceptable persistence representation, but it is not an untyped general-purpose `{action, field, value}` interpreter.

The exact persistence schema is deferred until implementation. A dedicated graph undo record is preferred over embedding undo mechanics into unrelated domain rows. The record must identify the user who authored the represented mutation so availability and execution can enforce ownership.

### 4. Undo executes as one graph aggregate mutation

Undo must:

1. acquire the existing workflow edit lease required for mutation;
2. begin one database transaction;
3. lock the graph aggregate;
4. validate authorization, undo ownership, current edit-lease ownership, graph revision, and referenced entities;
5. apply the complete inverse command;
6. increment the graph revision exactly once;
7. emit one normal graph mutation delta; and
8. consume the undo command only after successful completion.

If any required restoration step fails, the transaction rolls back, no partial result is exposed, and the undo command is not consumed.

Existing application mutation primitives may be reused internally. Public endpoints or top-level mutation methods must not be chained as independent undo steps because they independently lock, increment revisions, emit deltas, and would interfere with the single undo record.

### 5. Restored entities preserve logical UUIDs, not physical row identity

CourseFlow's UUID fields are stable logical identities but are not database primary keys. When a deleted entity is restored:

- the entity retains its previous public UUID;
- Django/PostgreSQL assigns a new internal primary key to the new row;
- recreated edges and join-table relationships receive new row identities; and
- relationship foreign keys are rebuilt against the new internal rows.

The system does not manually reuse deleted integer primary keys or database sequence values.

Preserving public UUIDs avoids identity remapping for graph deltas, boundary edges, and any future bounded multi-step history.

### 6. Aggregate deletion captures a bounded subgraph

An inverse command for deletion captures owned descendants and the relationship boundary required to restore observable graph state.

For section or channel deletion this includes, as applicable:

- parent section or channel metadata and ordered position;
- contained nodes and their placements;
- node typed metadata;
- linked-workflow, tag, and outcome references;
- edges whose endpoints are both inside the deleted aggregate; and
- edges with one endpoint inside and one endpoint outside the deleted aggregate.

References to workflows, tags, outcomes, and surviving nodes are recorded as references. Undo does not recursively snapshot those externally owned entities.

Comment threads and comments belonging to deleted workflow entities are not captured or restored in the initial scope.

Restoration creates the parent first, then contained nodes and local relationships, and finally edges after all required endpoints exist.

### 7. Auto-update form mutations are excluded initially

Title, description, tags, and similar fields persisted through auto-update forms do not create undo commands in the initial scope and do not clear an existing structural undo command. Structural deletion undo still restores the last persisted metadata that belonged to a deleted entity.

### 8. The initial UI exposes only a generic Undo button

The initial functional contract requires a generic button labeled `Undo` in the Workflow and Outcomes views for owners and editors. The button is active only when one undo command exists, the current user authored it, and the current user holds the workflow edit lease; it is disabled otherwise. Its exact placement and styling are deferred until UI design exists.

No keyboard binding and no redo action are included in the initial scope.

## Rejected alternatives

### Database rollback after commit

Rejected because a committed transaction cannot be safely reopened and rolled back as a later user action.

### Event sourcing

Rejected because reconstructing the graph from an event log introduces unnecessary storage, migration, projection, and operational complexity for one undo step.

### Whole-graph snapshots

Rejected because they capture unrelated state, scale with the entire graph instead of the affected aggregate, and risk overwriting changes outside the original mutation boundary.

### Client-owned inverse payloads

Rejected because the client cannot authoritatively capture database cascades, hidden relationships, revision state, or authorization invariants.

### Reusing deleted integer primary keys

Rejected because it couples product identity to persistence sequences and creates avoidable integrity and operational risk.

## Implementation rollout

Phase 1 persists and executes inverse commands for workflow edge creation and deletion. The generic Undo button and author/edit-lease checks are included. Route navigation preserves the server-side slot. Other structural mutations currently invalidate the single slot rather than creating an inverse command; their inverse payloads and restoration logic remain deferred. Auto-update metadata mutations preserve the slot as required.

This rollout boundary is an implementation status, not a reduction of the accepted functional scope.

## Consequences

### Benefits

- Undo follows the existing graph transaction, lock, revision, and delta architecture.
- Simple structural edits and aggregate restoration share one command model.
- Stable public identity is preserved without restoring physical database rows.
- The design can evolve to a small bounded stack without adopting event sourcing.

### Costs and unresolved decisions

- Aggregate deletion snapshots may be materially larger than simple inverse commands and require size and performance limits.
- Where deletion removes a workflow entity's thread or comments, undo intentionally does not restore them.
- Undo button placement remains an unresolved product decision.
- Any future path that transfers an expired or active workflow edit lease must also clear the graph undo slot.
- Dependencies outside the graph aggregate may become invalid before undo and must produce an atomic conflict rather than partial restoration.

## Functional requirements

See `tests/docs/requirements/features/workflow/deferred/workflow_graph_outcomes_undo_requirements_v1.yaml`.
