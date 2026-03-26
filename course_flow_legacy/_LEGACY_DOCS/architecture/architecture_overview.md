# CourseFlow Architecture Overview

## Purpose

This document is a code-driven architecture map for the uploaded CourseFlow snapshot. It is intended for LLM coding agents working in Cursor or similar IDEs.

The repository is a **Django monolith with an embedded JSON API and websocket layer**, paired with a **Vite/React frontend** that consumes the API and also maintains a large client-side normalized workspace state.

The codebase is in a **transitional state**:
- the frontend uses RTK Query, but still relies heavily on a normalized Redux workspace store
- the backend uses DRF-style endpoints, but also contains many generic catch-all mutation handlers
- several model and serializer comments explicitly identify current design choices as temporary or incorrect
- websocket updates are used for collaboration and optimistic edits, but are layered on top of REST persistence rather than replacing it

## Repository Shape

### Backend

Primary backend package:

```text
course_flow/
```

Important areas:

```text
course_flow/settings.py
course_flow/asgi.py
course_flow/routes/
course_flow/views/json_api/
course_flow/serializers/
course_flow/models/
course_flow/services/
course_flow/sockets/
```

### Frontend

Primary frontend app:

```text
react/
```

Important areas:

```text
react/src/app.tsx
react/src/router/
react/src/HTTP/XMLHTTP/API/
react/src/redux/
react/src/components/pages/
react/src/components/views/
react/src/context/
react/src/HTTP/WebSocketService.ts
```

## Runtime Topology

### Backend runtime

- Django serves HTML pages and the JSON API.
- DRF function/class endpoints under `/course-flow/json-api/v1/*`.
- Channels + Redis power websocket collaboration.
- SQLite is configured as the default DB in the snapshot.
- `djangorestframework_camel_case` middleware transforms JSON field naming between Python and JS conventions.

### Frontend runtime

- Vite React SPA bootstrapped from `react/src/app.tsx`.
- Router uses `createBrowserRouter`.
- RTK Query is the primary HTTP layer.
- Redux still holds the authoritative in-memory workspace graph for interactive workflow editing.
- Websocket events update Redux directly.

## Core Domains

### Project

A container for workflows and object sets (terminology/tag-like structures).

Key model:

```text
course_flow/models/workspace/project.py
```

### Workflow

Main editable workspace. Three concrete workflow subclasses exist:

- Activity
- Course
- Program

Key files:

```text
course_flow/models/workspace/workflow.py
course_flow/models/workspace/activity.py
course_flow/models/workspace/course.py
course_flow/models/workspace/program.py
```

### Workflow Objects

A workflow contains:

- columns
- weeks/parts/terms
- nodes
- outcomes

These are linked by through tables that preserve rank/order.

### Sharing / Library

Projects and workflows are surfaced through a common “library object” abstraction for listing, search, favourites, templates, and permissions.

### Collaboration / Realtime

Workflow pages open a websocket per workflow:

```text
ws/update/<workflowPk>/
```

Messages carry:

- workflow Redux actions
- lock state
- connected-user heartbeat updates
- parent/child workflow invalidation signals

## Backend Architecture in Practice

The backend is not cleanly layered, but it does have recurring roles:

### Routes

Route registration lives in:

```text
course_flow/routes/json_api_urls.py
course_flow/routes/aggregated_urls.py
course_flow/routes/websocket_urls.py
```

### Views / Endpoints

Most API behavior is in:

```text
course_flow/views/json_api/
```

These endpoints:

- validate request payloads
- call services or serializers
- return normalized JSON packages

### Serializers

Serializer usage falls into two patterns:

- upsert serializers for create/update validation
- shallow serializers for outbound JSON payloads

Important consequence: “shallow” often still includes substantial related data and derived fields.

### Services

Services are partly orchestration and partly query/packaging helpers:

- `WorkflowService` builds full workflow data packages
- `ProjectService` builds “my projects” sections
- `LibraryService` applies filters/sort/pagination
- `DAO` is a grab-bag of model lookup and relationship traversal helpers
- `WorkspaceService` and `EventsDispatch` support delete/restore and broadcast logic

### Websockets

Backend collaboration logic lives in:

```text
course_flow/sockets/consumers.py
course_flow/sockets/emitters.py
```

Important design point: the websocket is used mainly as a broadcast channel, not a persistence source of truth. Persistence usually still happens through REST.

## Frontend Architecture in Practice

### App bootstrap

`react/src/app.tsx` sets up:

- Redux Provider
- Cookie context
- dialog context
- user context
- MUI theme
- router

### Routing

Main routes:

- `/course-flow/home`
- `/course-flow/library`
- `/course-flow/explore`
- `/course-flow/favourites`
- `/course-flow/user/notifications`
- `/course-flow/project/:id`
- `/course-flow/workflow/:id/*`

### Data loading split

The frontend has two overlapping state systems:

#### RTK Query

Used for:

- fetching page data
- settings
- lists
- CRUD mutations

#### Redux normalized store

Used heavily for:

- interactive workflow graph state
- ordering
- drag/drop
- locks
- live collaborative updates
- selectors that derive workflow board structures

### Workflow page flow

Workflow page behavior is the most important architectural path:

1. route loads workflow page
2. page opens websocket manager
3. page fetches workflow detail via RTK Query
4. RTK response is converted into a large normalized store payload
5. Redux becomes the working in-memory graph
6. UI edits mutate Redux optimistically and often also persist via REST
7. websocket broadcasts synchronize other clients

This is a hybrid architecture. It is not pure RTK Query and not pure Redux; both coexist.

## Important Architectural Tensions

These are not theoretical concerns; they are visible in the code.

### 1. Base workflow vs subclass workflow

The code often needs the real subtype (`activity`, `course`, `program`), but permissions and content types frequently collapse back to base `Workflow`.

### 2. Generic mutation endpoints

`WorkspaceEndpoint.update_value` is used as a broad field-update endpoint for many object types. This reduces endpoint count but increases coupling between serializer names, object-type strings, and frontend optimistic updates.

### 3. Many-to-many relations used where FK was probably intended

Several model comments state this explicitly:

- workflow ↔ weeks
- workflow ↔ columns
- week ↔ nodes
- project ↔ workflows
- project ↔ object_sets

The system depends on those through tables now, especially for ordering.

### 4. Partial modernization on the frontend

There is clear migration from procedural API helpers toward RTK Query, but the migration is incomplete.

### 5. Normalized package contracts are the real API

For the workflow page especially, the effective contract is not “one serializer = one DTO”. The real contract is the large assembled package produced by `WorkflowService.get_workflow_full()`.

## Primary Edit Flows

### Project detail

- fetch project by id
- display overview/workflows tabs
- use shallow project serializer

### Workflow detail

- fetch large data package
- hydrate Redux
- render tabs for overview / workflow grid / outcome views
- allow live edits

### Library search

- submit flexible search payload with filters/sort/pagination
- receive `LibraryObjectSerializer` results

### Sharing / permissions

- fetch users for object
- create/update/delete `ObjectPermission`
- frontend interprets permission group to render controls

## Recommended Mental Model for LLMs

Treat this repo as:

- a legacy Django domain model
- wrapped by a JSON normalization layer
- consumed by a React editor that treats the workflow as a client-side graph
- synchronized by broadcast websockets
- with several known structural debts that must be respected during incremental changes

Do not assume this is clean REST, clean DDD, or clean event sourcing. It is a pragmatic hybrid system.

## Intended Direction for Backend Evolution

The current backend snapshot is a Django-centric system with mixed responsibilities across views, serializers, services, and models.

The intended backend direction is to move toward a layered architecture in which:

- HTTP remains a transport boundary
- application services own use-case orchestration
- domain code owns business rules
- persistence is isolated behind repository/gateway adapters
- framework code remains replaceable infrastructure

This means future backend work should reduce coupling, not reinforce the current monolithic blending of transport, business logic, and persistence.




## High-Value Entry Points for Investigation

When making changes, start from these files first:

```text
course_flow/routes/json_api_urls.py
course_flow/services/workflow.py
course_flow/serializers/workspace.py
course_flow/serializers/workflow.py
course_flow/serializers/node.py
course_flow/views/json_api/workspace.py
course_flow/views/json_api/workflow_objects/workflow.py
react/src/router/apiRoutes.ts
react/src/HTTP/XMLHTTP/API/workflowObjects/workflow.rtk.ts
react/src/components/pages/Workspace/Workflow/index.tsx
react/src/components/pages/Workspace/Workflow/hooks/useWorkflowWebsocketManager.tsx
react/src/redux/store.ts
```
