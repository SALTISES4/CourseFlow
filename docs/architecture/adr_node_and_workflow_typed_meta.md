# ADR: Typed meta tables for workflows and grid nodes

**Status:** Accepted  
**Scope:** ORM layout for `Workflow` and `Node` metadata  
**Related:** [ADR: Workflow hierarchy, node types, and linked workflows](adr_workflow_hierarchy_and_linked_nodes.md)

## Context

Grid **nodes** represent the child workflow layer in a parent graph (see hierarchy ADR). Node display and edit behavior uses typed metadata (context, task type, time, program/course-specific fields) similar to **workflows** in the library.

An earlier change added inline columns on `cf_node` (`context_classification`, `time_required`, etc.) while typed meta tables (`cf_activitymeta`, `cf_coursemeta`, `cf_taskmeta`) already existed with optional `node` foreign keys. That duplicated storage and diverged from the workflow pattern.

## Decision

### 1. Shared shape, separate rows

| Entity | Identity fields | Typed metadata |
|--------|-----------------|----------------|
| **Workflow** | `title`, `description`, `workflow_type` on `cf_workflow` | Exactly one of `programmeta`, `coursemeta`, or `activitymeta` (by `workflow_type`) |
| **Node** | `title`, `description`, `node_type`, placement FKs on `cf_node` | Exactly one of `coursemeta`, `activitymeta`, or `taskmeta` (by `node_type`) |

Typed meta tables use a **workflow XOR node** check constraint where both sides are allowed (`activitymeta`, `coursemeta`). **`taskmeta` is node-only** — workflows do not have `taskmeta` rows.

**`programmeta` is workflow-only** — grid nodes do not have `programmeta` rows.

### 2. Layering matrix

| Parent `workflow_type` (graph root) | `node_type` | Typed meta on node |
|-------------------------------------|-------------|-------------------|
| `program` | `course` | `coursemeta` |
| `course` | `activity` | `activitymeta` |
| `activity` | `task` | `taskmeta` |

| `workflow_type` | Typed meta on workflow |
|-----------------|------------------------|
| `program` | `programmeta` |
| `course` | `coursemeta` |
| `activity` | `activitymeta` |
| `task` | *(none — task workflows use title/description only)* |

### 3. Grid-node fields on typed meta

**Activitymeta** and **taskmeta** (node rows) store API-facing fields previously on `Node`:

- `context_classification`, `task_classification` (activity only)
- `time_required`, `time_units`
- `represents_workflow`

**Coursemeta** (node rows) keeps course-layer fields (`classification`, `code`). Activity-layer fields are not stored on course-type nodes.

Legacy char fields `context` / `classification` on `activitymeta` remain for older workflow library projections until fully retired.

### 4. Application access

- Read/write helpers: `course_flow/core/node_meta.py`
- Node create: `post_save` signal ensures the typed meta row for `node_type`
- Graph payloads: services call `read_node_meta_fields` / `patch_node_typed_meta` — HTTP schemas unchanged

### 5. Symbolic link unchanged

`Node.linked_workflow` remains a separate FK; it does not replace typed meta or parent `Node.workflow`.

## Consequences

- Migrations move data off `cf_node` onto typed tables (`0010_node_typed_meta_fields`).
- Workflow `task` rows no longer create `taskmeta`.
- ERD diagrams and `docs/data/entities/entities.md` must show node ↔ typed-meta edges.

## References

- Models: `course_flow/core/models/node.py`, `*meta.py`, `meta_fields.py`
- Migration: `course_flow/core/migrations/0010_node_typed_meta_fields.py`
- FR terminology: `tests/docs/requirements/terminology_workflow_hierarchy_and_nodes.md`
