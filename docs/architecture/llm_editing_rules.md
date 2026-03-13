# LLM Editing Rules

## Purpose

This file defines practical rules for AI coding agents modifying this CourseFlow snapshot.

These rules are tuned for the current architecture, not for an idealized rewrite.

## Core Principle

Make **small, contract-preserving, cross-layer-aware** changes.

This codebase has real legacy debt and ongoing migration. Large “cleanup” edits that cross backend models, serializers, API routes, TypeScript DTOs, Redux slices, selectors, and websockets will usually break something.

## Golden Rules

### 1. Start from the user-visible contract, not from the model

For most changes, begin with:

- route
- endpoint
- serializer
- frontend caller
- TS entity type
- selector/view

Only then touch the model if required.

### 2. Preserve response shapes

Changing backend serializer output without updating:

- frontend entity types
- RTK Query transforms
- marshalling helpers
- selectors

will cause breakage.

### 3. Treat workflow detail as a package contract

The workflow editor depends on the assembled package from:

```text
WorkflowService.get_workflow_full()
```

Do not casually rename or remove package keys such as:

- `workflow`
- `column`
- `week`
- `node`
- `nodelink`
- `outcomeworkflow`
- `outcome`
- `outcomeoutcome`
- `outcomenode`
- `project`
- `tags`

### 4. Assume camelCase on the frontend

When adding backend serializer fields, expect them to appear as camelCase in JS/TS.

Check:

- serializer field name
- TS `E*` type
- any transformation code

### 5. Do not “fix” the M2M model in a normal feature patch

The code comments note that some relationships should not be many-to-many. That may be true, but the current application logic depends on those through-models and their ranks.

Do not refactor them unless the task is explicitly a migration/refactor task.

## Recommended Edit Workflow

### A. For simple field additions on existing objects

#### Backend

- add field to model if truly necessary
- add migration if schema changes
- expose field in relevant serializer(s)
- ensure update serializer accepts it if editable

#### Frontend

- update corresponding `E*` type
- update any formatter/marshalling function
- update view component
- if workflow page: verify Redux hydration still works

### B. For editable workflow fields

If the field is edited from the workflow UI:

- verify `serializer_lookups_shallow` maps the object type
- ensure the object’s shallow serializer supports partial update
- confirm `WorkspaceEndpoint.update_value()` can save it
- check websocket rebroadcast still makes sense
- update any optimistic Redux action handling if needed

### C. For new list/search filters

- update `SearchSerializer.validate_filters()`
- update `LibraryService`
- update frontend filter config/types
- verify library query still returns `LibraryObjectSerializer`

## High-Risk Files

These files have broad blast radius:

```text
course_flow/services/workflow.py
course_flow/views/json_api/workspace.py
course_flow/services/dao.py
course_flow/serializers/workflow.py
course_flow/serializers/node.py
react/src/components/pages/Workspace/Workflow/hooks/useWorkflowWebsocketManager.tsx
react/src/redux/Reducers.ts
react/src/redux/selectors/*
react/src/router/apiRoutes.ts
```

Edit them carefully and narrowly.

## Specific Danger Zones

### 1. Route constant drift

`react/src/router/apiRoutes.ts` is not perfectly aligned with backend routes.

Known mismatches in this snapshot:

- node soft delete: frontend uses `/delete_soft`, backend route is `/delete-soft`
- week reorder: frontend uses `/update-position`, backend route is `/change-position`
- column reorder: frontend uses `/update-position`, backend route is `/update_position`
- workflow template list route exists in frontend constants but not backend routes
- project duplicate mutation points to update path

Rule:

Before trusting a frontend route constant, verify it against `course_flow/routes/json_api_urls.py`.

### 2. Generic update endpoint

`WorkspaceEndpoint.update_value()` is powerful but fragile.

It depends on:

- object-type strings
- serializer lookup tables
- serializer partial update support
- object `get_workflow()` behavior
- websocket emitter assumptions

Rule:

If a field edit does not work, inspect serializer lookup and partial update support before changing client code.

### 3. Workflow subtype normalization

Permissions and favourites often normalize:

- `activity`
- `course`
- `program`

into base workflow.

Rule:

When touching permissions/favourites, check both subtype logic and base `Workflow` content type handling.

### 4. Outcome logic

Outcome relationships are recursive and cross-workflow.

Rule:

Changes to outcomes may require updates in:

- `OutcomeSerializerShallow`
- DAO outcome traversal helpers
- parent/child workflow data package builders
- websocket parent/child invalidation behavior

### 5. Embedded comments on nodes

Node DTOs embed full comment objects while many other relations are id-based.

Rule:

Do not normalize this “for consistency” unless you also update all consumers.

## Safe Refactor Boundaries

These are generally safe if done carefully.

### Relatively safe

- adding non-breaking serializer fields
- adding frontend display-only fields
- tightening validation in upsert serializers
- adding new library filters if contract preserved
- improving internal helper function names without changing exports

### Medium risk

- changing workflow package assembly
- changing node/week/column reorder logic
- editing permission flows
- changing comment payload shapes

### High risk

- changing through-model semantics
- changing websocket event names or payloads
- replacing Redux workflow store logic
- changing object-type strings
- changing how subtype workflows map to content types

## File Lookup Rules by Task

### “Add a field to project detail”

Check:

```text
course_flow/models/workspace/project.py
course_flow/serializers/project.py
react/src/HTTP/XMLHTTP/types/entity.ts
react/src/components/pages/Workspace/Project/*
```

### “Add a field to workflow header or overview”

Check:

```text
course_flow/models/workspace/workflow.py
course_flow/serializers/workflow.py
course_flow/services/workflow.py
react/src/HTTP/XMLHTTP/types/entity.ts
react/src/components/pages/Workspace/Workflow/*
react/src/components/views/WorkflowView/OverviewView/*
```

### “Change workflow editor behavior”

Check:

```text
course_flow/services/workflow.py
course_flow/views/json_api/workspace.py
react/src/components/pages/Workspace/Workflow/hooks/useWorkflowWebsocketManager.tsx
react/src/redux/*
react/src/components/views/WorkflowView/WorkflowEditView/*
```

### “Change library search”

Check:

```text
course_flow/serializers/library.py
course_flow/services/library.py
course_flow/views/json_api/library.py
react/src/HTTP/XMLHTTP/API/library.rtk.ts
react/src/components/views/LibrarySearchView/*
```

### “Change sharing/permissions”

Check:

```text
course_flow/models/objectPermission.py
course_flow/serializers/workspace_user.py
course_flow/views/json_api/workspace_user.py
react/src/HTTP/XMLHTTP/API/workspaceUser.rtk.ts
```

## What Not to Do

- Do not perform large architectural rewrites unless explicitly asked.
- Do not rename serializer fields without tracing all TS consumers.
- Do not change route strings in one layer only.
- Do not convert “legacy” code paths to new ones without checking whether they are still used.
- Do not assume comments marked `@todo` are safe to fix immediately.
- Do not remove websocket code because a REST path exists; both may be required.

## Minimal Verification Checklist

For a normal patch, verify at least:

- backend endpoint still returns expected keys
- frontend type definitions still match
- main page compiles
- no route/path constant drift introduced
- workflow editor still loads
- if collaboration touched, websocket payload names still match

## Preferred Change Style for LLMs

Use this order:

1. identify the exact contract being changed
2. trace backend serializer + endpoint
3. trace frontend caller + TS type + render path
4. implement smallest viable patch
5. preserve existing naming and response structure
6. leave deeper cleanup for a dedicated refactor task

That style fits this codebase better than broad “improve architecture” edits.

If you want the next pass, the highest-value addition is a ninth doc: `workflow_editor_change_map.md`, focused only on the end-to-end edit paths for node/week/column/outcome mutations.
