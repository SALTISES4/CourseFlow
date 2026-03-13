# Data Model Relations

## Purpose

This document maps the relational model behind CourseFlow. It focuses on the entities and through-models that matter most for workflow editing, ordering, permissions, and search.

## High-Level Summary

The model is centered on:

- `Project`
- `Workflow` and subclasses (`Activity`, `Course`, `Program`)
- workflow objects (`Week`, `Column`, `Node`, `Outcome`)
- through-models used to preserve order/rank
- generic relations for permissions and favourites

A recurring pattern in the code comments is that several many-to-many relationships are acknowledged as historically convenient but structurally questionable. Despite that, the current app depends on them.

## Base Abstract Models

### `AbstractCourseFlowModel`

Source:

```text
course_flow/models/_abstract.py
```

Common fields:

- `hash`
- `deleted`
- `deleted_on`
- `created_on`
- `last_modified`
- `title`
- `description`

This is the base soft-deletable content model used by many core entities.

### `AbstractWorkspaceModel`

Extends `AbstractCourseFlowModel`.

Additional fields:

- `is_strategy`
- `from_saltise`
- `is_template`
- `published`
- `disciplines` (M2M)

Used by:

- `Project`
- `Workflow`

## Core Entities

### Project

Source:

```text
course_flow/models/workspace/project.py
```

Important fields:

- `author`
- `published`
- `is_original`
- `parent_project`

Important relations:

- generic relation to `ObjectPermission`
- generic relation to `Favourite`
- many-to-many to `Workflow` through `WorkflowProject`
- many-to-many to `ObjectSet`

Type:

```python
@property
def type(self):
    return "project"
```

### Workflow

Source:

```text
course_flow/models/workspace/workflow.py
```

Important fields:

- `edit_count`
- `static`
- `public_view`
- `is_original`
- time-related fields
- `outcomes_type`
- `outcomes_sort`
- `condensed`
- `code`
- ponderation fields

Important relations:

- `author`
- generic relation to `ObjectPermission`
- generic relation to `Favourite`
- `parent_workflow`
- M2M to `Week` through `WeekWorkflow`
- M2M to `Column` through `ColumnWorkflow`
- M2M to `Outcome` through `OutcomeWorkflow`

### Workflow subtypes

Concrete subclasses:

- `Activity`
- `Course`
- `Program`

These override `.type` and define defaults such as default columns.

Important practical rule:
If workflow subtype matters, prefer retrieving the subclass rather than assuming a base `Workflow` instance is sufficient.

### Week

Source:

```text
course_flow/models/workflow_objects/week.py
```

Semantically, “week” is broader than calendar weeks. It can represent:

- part
- week
- term

Important fields:

- `default`
- `is_original`
- `is_strategy`
- `is_dropped`
- `strategy_classification`
- `week_type`

Relations:

- `author`
- `parent_week`
- `original_strategy`
- M2M to `Node` through `NodeWeek`
- M2M to `Comment`

### Column

Source:

```text
course_flow/models/workflow_objects/column.py
```

Represents vertical categories in a workflow grid.

Important fields:

- `icon`
- `visible`
- `colour`
- `column_type`
- `is_original`

Relations:

- `author`
- `parent_column`
- M2M to `Comment`

### Node

Source:

```text
course_flow/models/workflow_objects/node.py
```

Represents a task/activity cell within the workflow grid.

Important fields:

- `is_original`
- `has_autolink`
- `is_dropped`
- `context_classification`
- `task_classification`
- `node_type`
- `represents_workflow`
- time fields
- ponderation fields

Relations:

- `sets` (M2M `ObjectSet`)
- `comments`
- `parent_node`
- `author`
- `linked_workflow`
- `column`
- M2M to `Outcome` through `OutcomeNode`

Important semantic role:
A node may represent or link to another workflow, which drives parent/child workflow alignment behavior.

### Outcome

Source:

```text
course_flow/models/workflow_objects/outcome.py
```

Represents learning outcomes / competencies.

Important fields:

- `title`
- `code`
- `is_original`
- `is_dropped`
- `depth`

Relations:

- `author`
- `parent_outcome`
- `sets`
- recursive M2M to `Outcome` through `OutcomeOutcome`
- horizontal M2M to `Outcome` through `OutcomeHorizontalLink`
- `comments`

Important semantic distinction:

- `children` = hierarchical decomposition inside same outcome tree
- `horizontal_outcomes` = cross-workflow alignment links, typically competency mapping

## Support Entities

### ObjectSet

Term/tag/terminology set associated with projects and objects.

### Comment

Simple comment model with:

- `text`
- `created_on`
- `user`

### Notification

Generic notification pointing at project/workflow content via content type + object id.

### CourseFlowUser

One-to-one extension around Django auth user for:

- notifications preference
- language
- duplicated name fields

### ObjectPermission

Generic permission entry:

- `user`
- `content_type`
- `object_id`
- `permission_type`
- `last_viewed`

Supported content types are effectively:

- `project`
- `workflow`

Workflow subtypes are collapsed to base `Workflow` content type on save.

### Favourite

Generic favourite entry:

- `user`
- `content_type`
- `object_id`

Again, workflow subtypes collapse to base `Workflow` content type.

## Through-Models and Rank Semantics

These are essential.

### WorkflowProject

Links workflow to project.

Fields:

- `project`
- `workflow`
- `added_on`
- `rank`

### WeekWorkflow

Links week to workflow.

Fields:

- `workflow`
- `week`
- `added_on`
- `rank`

### ColumnWorkflow

Links column to workflow.

Fields:

- `workflow`
- `column`
- `added_on`
- `rank`

### NodeWeek

Links node to week.

Fields:

- `week`
- `node`
- `added_on`
- `rank`

### OutcomeWorkflow

Links top-level outcomes to workflow.

Fields:

- `workflow`
- `outcome`
- `added_on`
- `rank`

### OutcomeOutcome

Links parent outcome to child outcome.

Fields:

- `parent`
- `child`
- `added_on`
- `rank`

### OutcomeNode

Links outcome to node.

Fields:

- `node`
- `outcome`
- `added_on`
- `rank`
- `degree`

### OutcomeHorizontalLink

Links outcome to cross-workflow parent outcome.

Fields:

- `parent_outcome`
- `outcome`
- `degree`
- `rank`
- `added_on`

### NodeLink

Represents visual/semantic link between nodes.

Important fields include:

- `source_node`
- `target_node`
- `source_port`
- `target_port`
- `dashed`
- `text_position`
- soft-delete fields

## Rank Is the Real Ordering Contract

The UI’s visual ordering is not inferred from creation order. It comes from rank on through-models:

- workflow columns: `ColumnWorkflow.rank`
- workflow weeks: `WeekWorkflow.rank`
- week nodes: `NodeWeek.rank`
- top-level outcomes: `OutcomeWorkflow.rank`
- outcome tree children: `OutcomeOutcome.rank`

Any reordering feature must preserve or recompute these ranks.

## Permissions Model

Permissions are object-level and generic:

```text
ObjectPermission(user, content_type, object_id, permission_type)
```

Permission types:

- none
- view
- edit
- comment
- student

Important practical behavior:
workflow subtypes (`activity`, `course`, `program`) are normalized to base `Workflow` for permission storage and lookup.

## Favourites Model

Favourites are also generic:

```text
Favourite(user, content_type, object_id)
```

Workflow subtype normalization mirrors permission logic.

## Soft Delete Model

Most workspace and workflow objects use:

- `deleted: bool`
- `deleted_on: datetime`

Soft delete is common. Many serializers and query helpers filter out deleted rows manually. Do not assume managers automatically exclude deleted records.

## Outcome Recursion / Alignment Rules

Outcome logic is one of the most specialized parts of the model.

Key behaviors:

- top-level outcomes belong to workflows via `OutcomeWorkflow`
- child outcomes are recursive via `OutcomeOutcome`
- node mappings are via `OutcomeNode`
- cross-workflow alignment is via `OutcomeHorizontalLink`
- helper methods auto-propagate parent/child outcome links in some cases

This means outcome edits often have secondary effects beyond a single row.

## Mermaid ERD

Known structural debt to respect:

- Several comments state some M2M relationships should really be FKs.
- Workflow subtype handling is inconsistent unless subclass resolution is explicit.
- Permissions/favourites collapse workflow subtypes to base `Workflow`.
- Soft-delete filtering is manual and scattered.
- Several `get_*` methods assume “first related object” semantics because the model allows more relations than the UI really wants.

These are not reasons to rewrite the model during a normal feature patch. They are reasons to edit carefully.
