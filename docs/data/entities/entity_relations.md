# Entity relations (implementation-backed)

High-level relationships matching **`course_flow/core/models/`**. For fields and tables, see [`entities.md`](entities.md).

## Users and access

- A **user** owns many **projects** (`Project.owner`).
- A **user** authors many **workflows** (`Workflow.author`; reverse name `created_graphs`).
- **Comments** reference a **user** as author (`Comment.author`).
- **Notifications**, **favorite projects**, **favorite graphs**, and **auth tokens** belong to a user.
- **Team membership**: `TeamUser` links a **user** to a **team** (one team per project).

## Project

- A **project** has one **team** container (`Team`).
- A **project** has many **tags** (optional null project on tag allowed).
- A **project** may have many **disciplines** (M2M via `ProjectDiscipline`).

## Graph and workflow

- A **graph** holds structural/editor state: **sections**, **channels**, **outcomes** (`Outcome.graph`), and `revision_id`.
- Each **graph** has exactly one **workflow** (`Workflow.graph` one-to-one); the workflow carries the typed academic object (`workflow_type`, titles, meta records).
- The ORM does **not** currently define `Graph.project` or `Graph.owner`; document or add when those are modeled.

## Sections, channels, nodes

- **Sections** and **channels** belong to a **graph** and may have an optional **thread**.
- **Nodes** reference a **section**, a **channel**, and a **workflow** (all required in code), optional **thread**, and `section_row`.
- **Nodes** connect to **outcomes** (M2M) and **tags** (M2M).
- **Edges** connect two **nodes** (directed).

## Outcomes

- An **outcome** belongs to a **graph** and has a required **thread** (`PROTECT`).
- Outcomes may form a **tree**: optional **parent** outcome, **`order`** among siblings (unique per parent when parent is set).
- Outcomes may have **tags** (M2M) and participate in **horizontal outcome** groupings (M2M via `HorizontaloutcomeOutcome`).

## Documentation rule

- **Canonical source:** `course_flow/core/models/`.
- Update this file when models change, or regenerate from code review.
