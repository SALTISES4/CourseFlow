# Entities folder

Artifacts here describe the **CourseFlow vNext** persistence layer.

## Source of truth

The **canonical schema** is the Django ORM under:

`course_flow/core/models/`

(package directory `course_flow/`, module import path `course_flow.core.models`).

Files in this folder (`entities.md`, `entity_relations.md`, `schema_mermaid.md`) are **derived documentation**. They should be updated when models change, not the other way around.

## Contents

| File | Purpose |
|------|---------|
| `entities.md` | Field- and table-level summary aligned with models |
| `entity_relations.md` | Narrative relation overview |
| `schema_mermaid.md` | Mermaid ERD derived from models |

## Rule

Do not add entities or relations here that are not present in `course_flow/core/models/` unless they are explicitly queued for implementation.
