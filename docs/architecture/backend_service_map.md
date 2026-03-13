# Backend Service Map

## Purpose

This document maps the backend’s main service and endpoint responsibilities. It is intentionally practical: it focuses on where an LLM should look when asked to change behavior.

## Routing Layer

### Aggregated URLs

```text
course_flow/routes/aggregated_urls.py
```

Main mounted path groups:

- `/course-flow/` HTML routes
- `/course-flow/json-api/v1/` JSON API routes
- `/admin/`
- websocket routes via ASGI

### JSON API routes

```text
course_flow/routes/json_api_urls.py
```

This file is the canonical endpoint index.

### Websocket routes

```text
course_flow/routes/websocket_urls.py
```

Current websocket route:

```text
ws/update/<workflowPk>/
```

## Endpoint Modules

### Project endpoints

```text
course_flow/views/json_api/project.py
```

Main responsibilities:

- create project
- update project
- fetch project detail
- list current user projects
- duplicate project
- list workflows for project
- create object set for project

Key serializer/service dependencies:

- `ProjectUpsertSerializer`
- `ProjectSerializerShallow`
- `ProjectService.get_my_projects()`
- `LibraryObjectSerializer`

### Workflow endpoints

```text
course_flow/views/json_api/workflow_objects/workflow.py
```

Main responsibilities:

- fetch workflow detail package
- fetch parent workflow/outcome package
- fetch child workflow/outcome package
- create workflow
- update workflow
- duplicate workflow into project
- list possible linked workflows
- list possible added workflows
- public workflow views

Key dependencies:

- `WorkflowService.get_workflow_full()`
- `WorkflowService.get_workflow_data_package()`
- `WorkflowUpsertSerializer`
- `WorkflowUpdateEmitter`

### Workspace endpoints

```text
course_flow/views/json_api/workspace.py
```

This is a generic mutation layer.

Main responsibilities:

- generic field update by object type
- hard delete
- soft delete / archive
- restore

Key dependencies:

- `serializer_lookups_shallow`
- `WorkspaceService`
- `EventsDispatch`
- `WorkflowUpdateEmitter`

Important design note:
`update_value()` is one of the highest-leverage and highest-risk functions in the codebase. Many UI edits eventually route through it.

### Workspace user / permission endpoints

```text
course_flow/views/json_api/workspace_user.py
```

Main responsibilities:

- list users with permissions for object
- list users available to add
- create permission
- update permission
- delete permission

Key dependencies:

- `ObjectPermissionUpsertSerializer`
- `ObjectPermissionDeleteSerializer`
- `UserWithPermissionsSerializer`

### Library endpoints

```text
course_flow/views/json_api/library.py
```

Main responsibilities:

- home page context
- favourites list
- generic library search
- toggle favourite

Key dependencies:

- `LibraryService`
- `SearchSerializer`
- `LibraryObjectSerializer`

### User endpoints

```text
course_flow/views/json_api/user.py
```

Main responsibilities:

- current user
- profile settings fetch/update
- notification settings fetch/update
- teacher user search

### Notification endpoints

```text
course_flow/views/json_api/notification.py
```

Main responsibilities:

- list notifications
- delete notification
- mark all as read

Depends on:

- `services.notifications.get_user_notifications()`

### Comment endpoints

```text
course_flow/views/json_api/workflow_objects/comment.py
```

Main responsibilities:

- list comments for object
- create comment
- delete comment
- delete all comments

Important behavior:

- comment creation parses `@username` mentions
- mention targets become `Notification` records if permission checks pass

### Strategy endpoints

```text
course_flow/views/json_api/strategy.py
```

Main responsibilities:

- duplicate strategy
- add strategy into workflow
- toggle week strategy state
- fetch templates

Important behavior:

- this code duplicates weeks/nodes/columns and emits workflow update events
- it is a high-coupling area touching both persistence and realtime updates

### Import/export endpoints

```text
course_flow/views/json_api/export_import.py
```

Main responsibilities:

- import spreadsheet/CSV payloads
- trigger export emails
- delegate work to async tasks

## Service Layer

### WorkflowService

```text
course_flow/services/workflow.py
```

Most important backend assembly service.

Responsibilities:

- build “workflow chooser” packages for menus and linking flows
- return workflow choice metadata
- build the full workflow detail package used by the editor
- attach project, tags, outcomes, strategies, unread comments

Most important method:

- `WorkflowService.get_workflow_full(workflow, user)`

This method defines the effective workflow-editor payload contract.

### ProjectService

```text
course_flow/services/project.py
```

Responsibility:

- assemble “my projects” sections:
  - owned projects
  - edit projects
  - deleted projects

### LibraryService

```text
course_flow/services/library.py
```

Responsibility:

- apply search filters, sort, pagination
- return workspace-like objects as a common list shape

Treat this as the central query policy for browse/search views.

### WorkspaceService

```text
course_flow/services/workspace.py
```

Responsibility:

- determine linked workflows / parent workflows during delete/restore flows
- help compute the scope of affected broadcasts

### DAO

```text
course_flow/services/dao.py
```

This is a broad helper module, not a DAO in a strict architectural sense.

Responsibilities include:

- model lookup from string
- parent model lookup from through-model type
- outcome tree traversal
- user permission resolution
- user-facing URL resolution
- notification creation
- several relationship traversal helpers

This file is heavily relied on across views and serializers.

### EventsDispatch

```text
course_flow/services/events_dispatch.py
```

Responsibility:

- centralize delete/restore-related workflow update dispatches

This is a bridge between mutation logic and socket broadcast behavior.

### notifications

```text
course_flow/services/notifications.py
```

Responsibility:

- prepare user notifications
- merge app update notifications and object/user notifications

### config

```text
course_flow/services/config.py
```

Responsibility:

- construct workflow configuration choices and metadata for UI consumption

### utils

```text
course_flow/services/utils.py
```

Responsibility:

- date formatting
- serializer save helpers
- common response prep helpers

## Serialization Layer

### Upsert serializers

Used for create/update validation:

- `ProjectUpsertSerializer`
- `WorkflowUpsertSerializer`
- `ObjectPermissionUpsertSerializer`
- settings serializers

### “Shallow” serializers

Used for outbound packages:

- `LibraryObjectSerializer`
- `ProjectSerializerShallow`
- `WorkflowSerializerShallow`
- `NodeSerializerShallow`
- `WeekSerializerShallow`
- `ColumnSerializerShallow`
- `OutcomeSerializerShallow`

Despite the name, these are not always lightweight.

## Realtime Layer

### Consumer

```text
course_flow/sockets/consumers.py
```

Responsibilities:

- authorize websocket connection
- relay workflow actions
- relay lock updates
- relay connected-user heartbeat events
- relay parent/child update notifications

### Emitter

```text
course_flow/sockets/emitters.py
```

Responsibilities:

- increment workflow edit count
- camel-case outgoing payloads
- broadcast workflow action messages
- dispatch updates to parent workflows / child workflows

## Backend Control Flows

### Workflow page load

- route resolves workflow detail endpoint
- view calls `WorkflowService.get_workflow_full()`
- service serializes workflow and related graph objects
- response returns large normalized package

### Generic field edit

- frontend sends update via generic update endpoint
- backend resolves object by `object_type`
- serializer validates partial payload
- object is saved
- workflow update emitter broadcasts a change action

### Soft delete / restore

- generic workspace endpoint mutates deleted flag
- backend determines affected workflows
- refresh serializers prepare extra data if needed
- event dispatch broadcasts corresponding delete/restore action

### Comment creation

- comment attached to object
- mentions parsed from text
- notifications created for eligible mentioned users
- comments can mark notifications read on list fetch

## Practical File Lookup Rules

Use this lookup order:

### “Where is the payload shape defined?”

1. serializer file
2. service that assembles package
3. frontend TS entity type
4. frontend marshalling / transform layer

### “Where is the permission logic?”

1. `DAO.get_user_permission()`
2. `ObjectPermission`
3. decorators in `course_flow/decorators.py`
4. workspace user endpoints

### “Where does delete/archive behavior actually happen?”

1. `views/json_api/workspace.py`
2. `services/workspace.py`
3. `services/events_dispatch.py`
4. `sockets/emitters.py`

### “Where does workflow page data come from?”

1. `views/json_api/workflow_objects/workflow.py`
2. `services/workflow.py`
3. workflow/nodes/outcomes serializers
