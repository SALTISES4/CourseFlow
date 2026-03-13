# API Endpoint Matrix

## Purpose

This file documents the JSON API surface that matters most to the current frontend. It is based on:

- backend route declarations in `course_flow/routes/json_api_urls.py`
- backend endpoint implementations in `course_flow/views/json_api/*`
- frontend API callers in `react/src/HTTP/XMLHTTP/API/*`

## Notes on Naming

- Backend Python frequently uses snake_case internally.
- JSON is camel-cased by middleware/utilities.
- Some frontend route constants do **not** perfectly match backend paths. Those mismatches are called out below.

---

## Project Endpoints

| Method | Route | Backend | Frontend usage | Request shape | Response shape | Notes |
|---|---|---|---|---|---|---|
| POST | `/project/create` | `ProjectEndpoint.create` | `createProject` | `{ title, description, disciplines?, objectSets? }` | `{ message, dataPackage: { id } }` | Uses `ProjectUpsertSerializer` |
| GET | `/project/<id>/detail` | `ProjectEndpoint.fetch_detail` | `getProjectById` | none | `{ action, dataPackage: ProjectSerializerShallow }` | Main project detail page |
| POST | `/project/<id>/update` | `ProjectEndpoint.update` | `updateProject` | same upsert shape | `{ message, dataPackage: { id } }` |  |
| POST | `/project/my-projects` | `ProjectEndpoint.list_my_projects` | `listProjectsByCurrentUser` | optional/unused | `{ message, dataPackage: { ownedProjects, editProjects, deletedProjects } }` |  |
| POST | `/project/<id>/duplicate` | `ProjectEndpoint.duplicate` | intended | body contains `projectPk` in backend code | `{ message, newItem, type }` | Frontend mutation currently points to wrong path |
| POST | `/project/<id>/workflow` | `ProjectEndpoint.workflows__list` | project workflows tab | body contains `projectPk` in backend code | `{ message, dataPackage: LibraryObject[] }` |  |
| POST | `/project/<id>/object-set/create` | `ProjectEndpoint.object_set__create` | legacy/manual | `{ term, title, translation_plural }` | `{ message, new_dict }` | likely drift/bug: code uses `project.objectsets.create` |

### Known frontend mismatch

`react/src/HTTP/XMLHTTP/API/project.rtk.ts` defines `duplicateProject` using the **update** path, not the duplicate path. Treat that as a bug/unfinished migration.

---

## Workflow Endpoints

| Method | Route | Backend | Frontend usage | Request shape | Response shape | Notes |
|---|---|---|---|---|---|---|
| GET | `/workflow/<id>/detail` | `WorkflowEndpoint.fetch_detail` | `useGetWorkflowByIdQuery` | none | `{ message, dataPackage: WorkflowDataPackage }` | most important workflow-editor payload |
| GET | `/workflow/<id>/parent/detail-full` | `json_api_get_public_parent_workflow_info` or `fetch_parent_detail_full` depending route | `useGetParentWorkflowInfoQuery` | none | parent workflow package | verify exact endpoint path semantics before changing |
| POST | `/workflow/<id>/parent/detail` | `WorkflowEndpoint.fetch_parent_detail` | legacy/public usage | backend reads workflow | `{ message, dataPackage }` | parent outcomes package |
| POST/GET | `/workflow/<id>/child/detail` | `WorkflowEndpoint.fetch_child_workflow_data` | legacy/public usage | body or param depends on caller | `{ message, dataPackage }` | child outcomes package |
| POST | `/workflow/linked` | `WorkflowEndpoint.possible_linked` | link-workflow menus | `{ nodePk }` / camelized | `{ message, dataPackage, nodeId }` | returns grouped workflow options |
| POST | `/workflow/added` | `WorkflowEndpoint.possible_added` | add-workflow menus | `{ projectPk?, typeFilter?, getStrategies?, selfOnly? }` | `{ message, dataPackage, projectId }` |  |
| POST | `/workflow/create` | `WorkflowEndpoint.create` | `createWorkflow` | `{ title, description?, projectId, type, duration?, units?, courseNumber?, ponderation? }` | `{ message, dataPackage: { id } }` | `WorkflowUpsertSerializer` maps aliases |
| POST | `/workflow/<id>/update` | `WorkflowEndpoint.update` | `updateWorkflow` | partial workflow upsert payload | `{ message }` or success object |  |
| POST | `/workflow/<id>/duplicate-to-project` | `WorkflowEndpoint.duplicate_to_project` | intended | project target payload | duplicate response | verify caller before changing |
| POST | `/workflow/<id>/strategy/toggle` | strategy view | legacy | `{ weekPk, isStrategy }` | `{ id, is_strategy, strategy }` | toggles a week into/out of strategy |
| POST | `/workflow/<id>/strategy/duplicate` | `duplicate__strategy` | legacy | `{ workflowPk }` | `{ message, newItem, type }` | duplicates strategy workflow |
| POST | `/workflow/<id>/strategy/add-to-workflow` | `json_api_post_add_strategy` | legacy | `{ workflowPk, objectID, object_type, position }` | `{ message }` + broadcast side effects | adds strategy week into workflow |

### Known frontend mismatch

`apiRoutes.ts` includes:

```ts
list_templates: '/workflow/template/list'
```

No matching backend route exists in `json_api_urls.py` in this snapshot.

## Generic Workspace Mutation Endpoints

| Method | Route | Backend | Frontend usage | Request shape | Response shape | Notes |
|---|---|---|---|---|---|---|
| POST | `/workspace/<id>/update-field` | `WorkspaceEndpoint.update_value` | legacy + optimistic edits | `{ objectType, objectId, data }` | `{ message: "success" }` | central field-edit endpoint |
| POST | `/workspace/<id>/delete-soft` | `WorkspaceEndpoint.delete_soft` | archive/unarchive flows | `{ objectType }` | `{ message: "success" }` | actually archive |
| POST | `/workspace/<id>/restore` | `WorkspaceEndpoint.restore` | restore flows | `{ objectType }` | `{ message: "success" }` |  |
| POST | `/workspace/<id>/delete` | `WorkspaceEndpoint.delete` | hard delete flows | `{ objectType }` | `{ message: "success" }` | dispatches delete events |

### Important note

These are generic endpoints. Their behavior depends heavily on:

- `objectType`
- serializer lookup tables
- `get_workflow()` availability
- event dispatch scope

## Workspace User / Permission Endpoints

| Method | Route | Backend | Frontend usage | Request shape | Response shape | Notes |
|---|---|---|---|---|---|---|
| POST | `/workspace-user/<id>/list` | `WorkspaceUserEndpoint.list` | `useGetUsersForObjectQuery` | `{ objectType }` | `{ message, dataPackage: UserWithPermissions[] }` |  |
| POST | `/workspace-user/<id>/list-available` | `WorkspaceUserEndpoint.list_available` | `useGetUsersForObjectAvailableQuery` | `{ objectType, filter? }` | `{ message, dataPackage: User[] }` | current backend ignores filter |
| POST | `/workspace-user/<id>/create` | `WorkspaceUserEndpoint.create` | create permission | `{ type, userId, group }` | created message | serializer has validation |
| POST | `/workspace-user/<id>/update` | `WorkspaceUserEndpoint.update` | update permission | same shape | success message |  |
| POST | `/workspace-user/<id>/delete` | `WorkspaceUserEndpoint.delete` | delete permission | `{ userId, type }` | success message |  |

## Workflow Object Endpoints

### Column

| Method | Route | Backend | Frontend usage | Notes |
|---|---|---|---|---|
| POST | `/column/create` | `ColumnEndpoint.create` | `useCreateColumnMutation` | create by object type / parent context |
| POST | `/column/<id>/update_position` | `ColumnEndpoint.update_position` | intended | rank update |
| DELETE / POST drift | `/column/<id>/delete` | `ColumnEndpoint.delete` | `useDeleteColumnMutation` | backend implementation currently shown as DELETE; route declared without method suffix assumptions |

#### Known frontend mismatch

Frontend route constant:

```text
/column/:id/update-position
```

Backend route:

```text
/column/<id>/update_position
```

### Week

| Method | Route | Backend | Frontend usage | Notes |
|---|---|---|---|---|
| POST | `/week/create` | `WeekEndpoint.create` | `useCreateWeekMutation` | create week |
| POST | `/week/<id>/duplicate` | `WeekEndpoint.duplicate` | `useDuplicateWeekMutation` |  |
| POST | `/week/<id>/change-position` | `WeekEndpoint.change_position` | intended | update rank/order |
| POST / DELETE drift | `/week/<id>/delete` | `WeekEndpoint.delete` | `useDeleteWeekMutation` |  |

#### Known frontend mismatch

Frontend uses:

```text
/week/:id/update-position
```

Backend route is:

```text
/week/<id>/change-position
```

### Node

| Method | Route | Backend | Frontend usage | Notes |
|---|---|---|---|---|
| POST | `/node/create` | `NodeEndpoint.create` | `createNode` |  |
| POST | `/node/<id>/delete` | `NodeEndpoint.delete` | `deleteNode` |  |
| POST | `/node/<id>/delete-soft` | `NodeEndpoint.delete_soft` | intended | archive |
| POST | `/node/<id>/restore` | `NodeEndpoint.restore` | intended |  |
| POST | `/node/<id>/duplicate` | `NodeEndpoint.duplicate` | `duplicateNode` |  |
| POST | `/node/<id>/update-position` | `NodeEndpoint.update_position` | `updatePositionNode` |  |
| POST | `/node/<id>/toggle-object-set` | `NodeEndpoint.toggle_object_set` | legacy/manual |  |
| POST | `/node/<id>/link-to-workflow` | `NodeEndpoint.link_to_workflow` | legacy/manual |  |
| POST | `/node/node-link/create` | `NodeEndpoint.node_link__create` | create node link |  |

#### Known frontend mismatch

Frontend constant uses:

```text
/node/:id/delete_soft
```

Backend route is:

```text
/node/<id>/delete-soft
```

## Comments

| Method | Route | Backend | Frontend usage | Request shape | Response |
|---|---|---|---|---|---|
| POST | `/comment/list-by-object` | `CommentEndpoint.list_by_object` | comments tab | `{ objectId, objectType }` | `{ message, dataPackage: Comment[] }` |
| POST | `/comment/create` | `CommentEndpoint.create` | comments tab | `{ objectId, objectType, text }` | success |
| POST | `/comment/<id>/delete` | `CommentEndpoint.delete` | comments tab | `{ objectType, commentPk }` | success |
| POST | `/comment/delete-all` | `CommentEndpoint.delete_all` | comments tab | `{ objectId, objectType }` | success |

## Library / Search Endpoints

| Method | Route | Backend | Frontend usage | Request shape | Response |
|---|---|---|---|---|---|
| GET | `/library/home` | `LibraryEndpoint.fetch__home` | home page | none | `{ action, dataPackage: { isTeacher, projects, templates } }` |
| GET | `/library/favourites` | `LibraryEndpoint.fetch__favourite_library_objects` | favourites page | none | `{ message, dataPackage: { items, meta } }` |
| POST | `/library/objects-search` | `LibraryEndpoint.search` | library/explore pages | `{ pagination?, sort?, filters?, resultsPerPage? }` | `{ message, dataPackage: { items, meta } }` |
| POST | `/library/toggle-favourite` | `LibraryEndpoint.toggle_favourite` | favourite button | `{ id, objectType, favourite }` | success |

## User / Notification Endpoints

### User

| Method | Route | Backend | Frontend usage | Response |
|---|---|---|---|---|
| GET | `/user/current-user` | `UserEndpoint.fetch__current` | `useGetCurrentUserQuery` | current user package |
| GET | `/user/profile-settings` | `UserEndpoint.fetch_profile_settings` | settings page | `{ firstName, lastName, language }` |
| POST | `/user/profile-settings/update` | `UserEndpoint.update_profile_settings` | settings page | success |
| GET | `/user/notifications-settings` | `UserEndpoint.fetch_notification_settings` | settings page | `{ receiveNotifications }` |
| POST | `/user/notifications-settings/update` | `UserEndpoint.update_notification_settings` | settings page | success |
| POST | `/user/list` | `UserEndpoint.list` | sharing dialogs | user list |

### Notifications

| Method | Route | Backend | Frontend usage | Response |
|---|---|---|---|---|
| GET | `/notification/list` | `NotificationEndPoint.list` | `useGetNotificationsQuery` | `{ action, dataPackage: { items, meta: { unreadCount } } }` |
| POST | `/notification/<id>/delete` | `NotificationEndPoint.delete` | legacy/manual | success |
| POST | `/notification/mark-all-as-read` | `NotificationEndPoint.mark_all_as_read` | notifications page | success |

#### Known frontend mismatch

`apiRoutes.ts` defines:

```text
delete: '/notification/delete'
```

Backend route is parameterized:

```text
/notification/<id>/delete
```

## Import / Export Endpoints

| Method | Route | Backend | Request shape | Behavior |
|---|---|---|---|---|
| POST multipart | `/import` | `ExportImport.object__import` | form-data with body and file | parses CSV/XLSX, triggers async import |
| POST | `/export` | `ExportImport.object__export` | `{ objectID, object_type, exportType, exportFormat, objectSets? }` | triggers async export email |

## Canonical Frontend-Safe Contracts

When editing endpoints, preserve these first:

- `GET /workflow/<id>/detail`
- `GET /project/<id>/detail`
- `POST /library/objects-search`
- `POST /workspace/<id>/update-field`
- workspace-user permission endpoints
- comment list/create endpoints

Those are the highest-value, highest-coupling contracts in the current frontend.
