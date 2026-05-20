# ADR: Workflow hierarchy, node types, and linked workflows

**Status:** Accepted  
**Scope:** Domain language for graph nodes, symbolic workflow links, and alignment with functional requirements

## Context

CourseFlow uses a pedagogical layering model:

```text
program  →  course  →  activity  →  task
```

A **workflow** is a typed object in the library (`Workflow.workflow_type`). A **graph** is the editable grid for one workflow.

**Nodes** are cells on that grid. Each node stands for the layer **one step below** the workflow that owns the graph:

| Parent workflow type (`Workflow.workflow_type`) | Expected child **node type** (`Node.node_type`) |
|-----------------------------------------------|--------------------------------------------------|
| `program`                                     | `course`                                         |
| `course`                                      | `activity`                                       |
| `activity`                                    | `task`                                           |

`Node.node_type` is set at creation from the parent workflow type (see `course_flow/core/hierarchy.py`) and is not user-editable.

Informal phrases such as **“course node”** are ambiguous. They have been read as either:

1. a node with **`node_type = course`** (a course-shaped slot in a **program** workflow graph), or  
2. **any** node that lives in a graph whose **parent workflow type** is `course`.

Those are different concepts. Linking rules, sidebar field sets, and canvas chrome must be stated in the unambiguous vocabulary below.

## Decision

### 1. Canonical terms (use in ADRs, code comments, and new docs)

| Term | Refers to | Example |
|------|-----------|---------|
| **Workflow** | A `Workflow` row and its library metadata | “the linked **activity workflow**” |
| **Parent workflow** | The workflow whose graph contains the node (`Node.workflow`) | “inside this **course workflow**” |
| **Parent workflow type** | `Workflow.workflow_type` of that parent | “when the **parent workflow type** is `program`” |
| **Node** | A grid cell in a parent workflow’s graph | “select a **node**” |
| **Node type** | `Node.node_type` — semantic layer of what the cell represents | “a **node of type** `activity`” |
| **Linked workflow** | Optional `Node.linked_workflow` FK to another workflow in the same project | “symbolically linked **activity workflow**” |

**Preferred phrasing**

- “a **node of type** `activity` in a **course workflow** graph”
- “**activity**-typed nodes in a **course** parent workflow”
- “the **parent workflow type** is `course`”

**Avoid (ambiguous)**

- “course node”, “program node”, “activity node” **without** stating whether you mean `node_type` or parent workflow type.

When both dimensions matter, state both explicitly, e.g. “a node of type `course` in a program workflow.”

### 2. Two workflow foreign keys on `Node`

| Field | Role |
|-------|------|
| `Node.workflow` | **Parent workflow** — the graph this cell belongs to. Immutable placement context. |
| `Node.linked_workflow` | **Linked workflow** — optional symbolic reference to another library workflow. Does not replace the parent FK. |

Linking does **not** change which graph owns the node.

### 3. What a node represents

Each node is a placeholder for a child-layer workflow:

- **Unlinked:** the node’s own metadata fields (`title`, `description`, time, tags, etc.) stand in for that child workflow superficially.
- **Linked:** `linked_workflow` points at an existing library workflow of the matching layer; UI **mirrors** selected fields from that workflow (read-only in the edit-node form per FR-WF-EN-004 / FR-WF-EN-006). Node-local fields (e.g. context, tags on course-parent graphs) remain on the node.

The node’s stored title/description/time (and program-level credits/ponderation) are **preserved** while linked; they are masked in mirror fields, not overwritten (FR-WF-EN-011).

### 4. Symbolic link rules (architecture)

Link targets must belong to the **same project** as the parent workflow. A node may have **at most one** linked workflow.

| Parent workflow type | Node type (required for cells in that graph) | May link to (`linked_workflow.workflow_type`) |
|----------------------|-----------------------------------------------|-----------------------------------------------|
| `course`             | `activity`                                    | `activity`                                    |
| `program`            | `course`                                      | `course`                                        |
| `activity`           | `task`                                        | *(none — linking not supported)*                |

Product copy examples (FR-WF-EN-009 / FR-WF-NODE-001): “Link activity” / “Remove linked activity” when the parent is a **course workflow**; “Link course” / “Remove linked course” when the parent is a **program workflow**.

### 5. Mapping legacy functional-requirement wording

Existing YAML under `tests/docs/requirements/original/` often says **“parent workflow type is course”** and **“linked activity workflow”**. Read them as:

| FR phrase | Precise meaning |
|-----------|-----------------|
| parent workflow type is `course` | the node’s **`Node.workflow`** is a **course workflow** (not “node type is course”) |
| parent workflow type is `program` | the node’s **`Node.workflow`** is a **program workflow** |
| linked activity workflow | `Node.linked_workflow` points to a workflow with **`workflow_type = activity`** (typically on a node of type `activity` in a course workflow) |
| linked course workflow | `Node.linked_workflow` points to a workflow with **`workflow_type = course`** (typically on a node of type `course` in a program workflow) |
| course-node-local metadata | fields stored on the **node** that are not mirrored from `linked_workflow` (e.g. context, tags on course-parent graphs) |
| program-node-local metadata | node-local fields when the parent workflow type is `program` (e.g. tags, specific-education switch) |

Do **not** rewrite historical FR IDs in this ADR; use this table when implementing or discussing behavior.

## Consequences

**Positive**

- Implementation and reviews can distinguish parent graph context from `node_type` and from `linked_workflow`.
- Linked-workflow UI work can be checked against FR-WF-EN-004/006/010/011 without terminology drift.

**Discipline**

- New architecture notes and code comments follow §1 preferred phrasing.
- New functional requirements should prefer “parent workflow type” and “node of type …” over bare “course node”.
- `Node.node_type` must stay consistent with `child_node_type_for_workflow(parent.workflow_type)` at creation.

## References

- Typed meta ERD: [ADR: Typed meta for workflows and grid nodes](adr_node_and_workflow_typed_meta.md)
- Hierarchy helpers: `course_flow/core/hierarchy.py`
- Model: `course_flow/core/models/node.py`
- FR terminology (authoring): `tests/docs/requirements/terminology_workflow_hierarchy_and_nodes.md`
- Edit-node behavior: `tests/docs/requirements/original/workflow_edit_node_requirements_v1.yaml` (FR-WF-EN-004, FR-WF-EN-006, FR-WF-EN-010, FR-WF-EN-011)
- Canvas behavior: `tests/docs/requirements/original/workflow_node_visual_requirements_v1.yaml` (FR-WF-NODE-001)
- Entity summary: `docs/data/entities/entities.md`
