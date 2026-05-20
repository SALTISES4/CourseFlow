# CourseFlow core entities (implementation source of truth)

**Canonical schema:** Django ORM models under `course_flow/core/models/` in this repository.  
This document is a **derived** view of that code. When code and prose disagree, **trust the models**.

**Naming note:** the legacy “unit” concept is the **`Workflow`** model; the editable graph projection container is **`Graph`**. `Graph` currently stores revision metadata (`revision_id`); sections, channels, and outcomes attach to `Graph`. `Workflow` is one-to-one with `Graph` and carries typed domain fields (`workflow_type`, title, description, `author`).

**Database tables** use the `cf_` prefix as declared in each model’s `Meta.db_table`.

---

## Abstract bases

| Concern | Model |
|--------|--------|
| UUID + `date_created` / `modified_on` | `TimeStampedUUIDModel` |
| UUID only | `UUIDModel` |

---

## Core entities

### User (`cf_user`)

- Extends `AbstractUser`; login field is `email` (`USERNAME_FIELD`).
- Extra fields: `uuid`, `language_preference` (see `course_flow.core.enum.LanguagePreference`), `notifications_active`.
- Typical reverse relations: `owned_projects`, `created_graphs` (FK from `Workflow`; name is historical), `comments`, `notifications`, `favorite_projects`, `favorite_graphs`, `team_users`, `authtokens`.

### Project (`cf_project`)

- `owner` → `User`
- `title`, `description`, `is_published`, `is_template`
- M2M `disciplines` through `ProjectDiscipline`

### Graph (`cf_graph`)

- `TimeStampedUUIDModel` fields + `revision_id`
- **No** `project` or `owner` FK in the current model; graph ownership / project attachment, if needed, must be inferred from related `Workflow` or application logic until modeled.

### Workflow (`cf_workflow`)

- `author` → `User` (`SET_NULL`, optional; `related_name="created_graphs"`)
- `graph` → `Graph` (`OneToOne`, `related_name="workflow"`)
- `title`, `description`, `workflow_type` (`WorkflowType` enum)
- Typed meta (each `OneToOne` from meta model): `taskmeta`, `programmeta`, `coursemeta`, `activitymeta`

### Section (`cf_section`)

- `graph` → `Graph`
- `title`, `position`
- `thread` → `Thread` (`OneToOne`, `SET_NULL`, optional)

### Channel (`cf_channel`)

- `graph` → `Graph`
- `title`, `position`
- `thread` → `Thread` (`OneToOne`, `SET_NULL`, optional)

### Node (`cf_node`)

- `section` → `Section`, `channel` → `Channel` (required)
- `workflow` → `Workflow` (**parent workflow** — the graph this cell belongs to; required)
- `linked_workflow` → `Workflow` (optional symbolic link to another library workflow in the same project; does not replace `workflow`)
- `node_type` — semantic child layer (`course` | `activity` | `task`); set at creation from parent `workflow_type` per `course_flow/core/hierarchy.py`; not user-editable
- `thread` → `Thread` (`OneToOne`, `SET_NULL`, optional)
- `section_row` — grid row index
- Identity fields on the node row: `title`, `description`
- Typed metadata via **one** `OneToOne` (by `node_type`): `coursemeta`, `activitymeta`, or `taskmeta` — not `programmeta` (see [ADR: Typed meta for workflows and grid nodes](../../architecture/adr_node_and_workflow_typed_meta.md))
- M2M `outcomes` through `NodeOutcome`, M2M `tags` through `NodeTag`

**Terminology:** [ADR: Workflow hierarchy, node types, and linked workflows](../../architecture/adr_workflow_hierarchy_and_linked_nodes.md). Prefer “node of type `activity` in a course workflow” over ambiguous “course node”.

### Edge (`cf_edge`)

- `source_node`, `target_node` → `Node`
- `line_type`, `source_port`, `target_port` (strings)

### Outcome (`cf_outcome`)

- `graph` → `Graph`
- `thread` → `Thread` (`OneToOne`, `PROTECT`)
- Tree ordering among outcomes: `parent` → `self` (`SET_NULL` for roots), `order` (`PositiveIntegerField`)
- Partial unique constraint on `(parent, order)` when `parent` is not null
- M2M `tags` through `OutcomeTag`

### Thread (`cf_thread`)

- Timestamped UUID container for comments attached to section, channel, node, or outcome.

### Comment (`cf_comment`)

- `author` → `User`
- `thread` → `Thread`
- `body`

### Tag (`cf_tag`)

- `project` → `Project` (`SET_NULL`, optional tag without project)
- `label`, `translation_plural`

### Discipline (`cf_discipline`)

- `label`, `translation_plural`

### Notification (`cf_notification`)

- `user` → `User`
- `message`, `is_read`, `date_created`

### Team (`cf_project_team`)

- `project` → `Project` (`OneToOne`, `related_name="team"`)

### Horizontaloutcome (`cf_horizontaloutcome`)

- M2M to `Outcome` through `HorizontaloutcomeOutcome` (`related_name="horizontal_groups"` on outcome side)

### Authtoken (`cf_authtoken`)

- `user`, `token_hash`, `label`, `created_at`, `expires_at`, `last_used_at`, `revoked_at`

---

## Join / through models (`course_flow/core/models/relations.py`)

| Model | Table | Role |
|-------|--------|------|
| `ProjectDiscipline` | `cf_project_discipline` | Project ↔ Discipline |
| `TeamUser` | `cf_team_user` | User + `Team` + `role` |
| `NodeTag` | `cf_node_tag` | Node ↔ Tag |
| `OutcomeTag` | `cf_outcome_tag` | Outcome ↔ Tag |
| `NodeOutcome` | `cf_node_outcome` | Node ↔ Outcome |
| `HorizontaloutcomeOutcome` | `cf_horizontaloutcome_outcome` | Horizontal group ↔ Outcome |
| `FavoriteProject` | `cf_favorite_project` | User ↔ Project |
| `FavoriteGraph` | `cf_favorite_graph` | User ↔ Graph |

---

## Meta models (typed extensions)

Shared pattern: typed fields live on `*meta` tables; `Workflow` and `Node` keep `title` / `description` on the parent row.

| Model | Table | Attached to | Notes |
|-------|--------|-------------|--------|
| `Programmeta` | `cf_programmeta` | `Workflow` only (`workflow_type=program`) | Not used on nodes |
| `Coursemeta` | `cf_coursemeta` | `Workflow` or `Node` (XOR) | Node: `node_type=course` |
| `Activitymeta` | `cf_activitymeta` | `Workflow` or `Node` (XOR) | Node: `node_type=activity`; includes context/task/time fields |
| `Taskmeta` | `cf_taskmeta` | `Node` only | Node: `node_type=task`; workflows do not have `taskmeta` |

See [ADR: Typed meta for workflows and grid nodes](../../architecture/adr_node_and_workflow_typed_meta.md).

---

## Enums (`course_flow/core/enum.py`)

- **WorkflowType:** `program`, `course`, `activity`, `task` (root graph types exclude `task`)
- **NodeType:** `course`, `activity`, `task` (child layer for grid nodes; no `program` on nodes)
- **Role:** `editor`, `commenter`, `viewer`
- **LanguagePreference:** `en-ca`, `fr-ca` (values stored on `User.language_preference`)

---

## Django app

- App config: `course_flow.core.apps.CoreConfig`
- Label: `cf2_core`
- Models module: `course_flow.core.models`
