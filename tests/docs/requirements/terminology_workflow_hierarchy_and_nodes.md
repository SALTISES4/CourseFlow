# Terminology: workflow hierarchy, nodes, and linked workflows

**Status:** Accepted  
**Audience:** Authors and reviewers of documents under `tests/docs/requirements/`  
**Implementation mirror:** [`docs/architecture/adr_workflow_hierarchy_and_linked_nodes.md`](../../../docs/architecture/adr_workflow_hierarchy_and_linked_nodes.md)

## Pedagogical layering

```text
program  →  course  →  activity  →  task
```

- A **workflow** is a typed library object (`workflow_type`: `program` | `course` | `activity` | `task`).
- A **workflowView** edits one workflow’s graph (sections, channels, nodes).

Each **workflowNode** is a grid cell that represents the layer **one step below** the workflow being edited:

| Parent workflow type (graph being edited) | Node type (semantic layer of the cell) |
|-------------------------------------------|----------------------------------------|
| `program`                                 | `course`                               |
| `course`                                  | `activity`                             |
| `activity`                                | `task`                                   |

## Canonical terms (use in FRs)

| Term | Meaning in requirements |
|------|-------------------------|
| **Parent workflow type** | `workflow_type` of the workflow whose graph contains the node. Write: *parent workflow type is `course`* |
| **Node type** | Semantic child layer of the cell. Write: *node type is `activity`* or *workflowNode of node type `activity`* |
| **Linked workflow** | Optional symbolic link from a node to another workflow in the same project. Write: *linked activity workflow*, *linked course workflow*, or *the workflowNode has a linked workflow* |
| **Node-local metadata** | Fields stored on the **workflowNode** that are not mirrored from `linkedWorkflow` (e.g. context and tags when parent workflow type is `course`) |

## Avoid ambiguous phrases

| Avoid | Prefer |
|-------|--------|
| course node, program node, activity node (unqualified) | **node type** `course` / `activity` / `task`, or **workflowNode in a course workflow** |
| course-node-local, program-node-local | **node-local metadata when parent workflow type is `course`** (or `program`) |
| course workflowNode (unqualified) | **workflowNode of node type `activity` in a course workflow** when the link case matters; otherwise **workflowNode whose parent workflow type is `course`** |

**Note:** *Parent workflow type is `course`* is **not** the same as *node type is `course`*. The former describes the graph being edited; the latter describes what the cell represents (e.g. an activity slot inside a course graph).

## Symbolic link rules (product)

| Parent workflow type | Node type (expected in that graph) | May link to (`linkedWorkflow.workflow_type`) |
|----------------------|-------------------------------------|-----------------------------------------------|
| `course`             | `activity`                          | `activity`                                    |
| `program`            | `course`                            | `course`                                      |
| `activity`           | `task`                              | *(none — linking not supported)*              |

Link targets must be in the **same project** as the parent workflow. At most **one** linked workflow per node.

## Mapping phrases used in existing FRs

| Legacy / shorthand in YAML | Precise reading |
|----------------------------|-----------------|
| parent workflow type is `course` | the workflow being edited in workflowView has `workflow_type = course` |
| parent workflow type is `program` | the workflow being edited has `workflow_type = program` |
| linked activity workflow | `linkedWorkflow` points to a workflow with `workflow_type = activity` (typical: node type `activity` in a course workflow) |
| linked course workflow | `linkedWorkflow` points to a workflow with `workflow_type = course` (typical: node type `course` in a program workflow) |
| FR-WF-EN-003 / 004 titles “course workflow type” | field-set variants keyed on **parent workflow type** `course`, not node type |

When authoring **new** requirements, use the preferred column in the table above. Existing requirement IDs and titles need not be renamed solely for terminology.

## Persistence (typed meta)

Grid-node fields such as context, task type, and time are stored on `coursemeta` / `activitymeta` / `taskmeta`, not as duplicate columns on `cf_node`. See [ADR: Typed meta for workflows and grid nodes](../../../docs/architecture/adr_node_and_workflow_typed_meta.md).
