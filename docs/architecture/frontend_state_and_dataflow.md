# Frontend State and Data Flow

## Purpose

This document explains how the React frontend loads, stores, mutates, and synchronizes CourseFlow data.

The core fact to understand is this:

> For workflow editing, the frontend does **not** operate as a simple RTK Query consumer. It loads a normalized workflow package and then treats Redux as the active in-memory graph.

## Boot Sequence

Entry point:

```text
react/src/app.tsx
```

The app initializes:

- Redux Provider
- Cookie context
- dialog context
- user context
- MUI theme
- router

Notable implementation detail:

- Emotion cache uses `window.cf_nonce`
- console warnings/errors are selectively suppressed in development/runtime

## Router Structure

Main router:

```text
react/src/router/appRoutes.tsx
```

Primary pages:

- Home
- Library
- Explore
- Favourites
- Notifications
- Notification settings
- Profile settings
- Project detail
- Workflow detail

The SPA is mounted under:

```text
/course-flow/*
```

## Layout Shell

Base layout:

```text
react/src/base.tsx
```

This wraps most routes with:

- sidebar
- top bar
- global dialogs
- update-notification alert
- body container
- network activity provider

## Main State Systems

### 1. RTK Query

Base API:

```text
react/src/HTTP/XMLHTTP/API/api.ts
```

Used for:

- page-level data fetching
- create/update/delete mutations
- user/settings endpoints
- library lists
- project/workflow fetches

Characteristics:

- uses `fetchBaseQuery`
- injects CSRF token via `window.getCsrfToken()`
- always sends JSON content type

### 2. Redux normalized store

Store:

```text
react/src/redux/store.ts
react/src/redux/Reducers.ts
```

Used especially for workflow editing:

- workflow object
- project object
- weeks
- columns
- nodes
- links
- outcomes
- through-model state
- selection state
- lock state
- drag/drop ordering
- sidebar/UI state

This is the working application graph, not just a cache.

### 3. Contexts

Important contexts:

- `UserContext`
- `WorkflowConfigContext`
- dialog context
- cookie context
- workflow sidebar context

Workflow-specific contexts help coordinate:

- editable methods
- websocket status
- connected users
- active workflow view
- sidebar config

## Workflow Page Data Flow

Main page:

```text
react/src/components/pages/Workspace/Workflow/index.tsx
```

### Load sequence

1. read `workflowId` from route
2. start RTK Query:
   - `useGetWorkflowByIdQuery({ id: workflowId })`
3. start websocket manager:
   - `useWorkflowWebsocketManager({ user, workflowId })`
4. when RTK data arrives:
   - convert workflow package to Redux app state
   - dispatch `refreshWorkspaceStoreData`
5. component waits for workflow permissions to exist in store
6. component renders `WorkflowTabs`

Important implication:

The page blocks on the Redux-hydrated workflow state, not only on RTK Query status.

The code itself comments that this architecture may be reconsidered later.

## Websocket Workflow Manager

File:

```text
react/src/components/pages/Workspace/Workflow/hooks/useWorkflowWebsocketManager.tsx
```

Responsibilities:

- create websocket service
- create connected-user manager
- fetch workflow via RTK Query
- inject fetched package into Redux
- receive websocket messages and route them
- expose editable helpers back to UI

Returned methods:

- `microUpdate`
- `changeField`
- `lockUpdate`
- `clearQueue`

### `changeField`

This is one of the most important frontend edit pathways.

Behavior:

- dispatch optimistic Redux field change
- call generic REST update endpoint

So edits are:

- optimistic in Redux
- persisted over REST
- synchronized to other users via websocket broadcast

## Workflow Tabs / Views

Tabs container:

```text
react/src/components/pages/Workspace/Workflow/WorkflowTabs/index.tsx
```

It coordinates:

- top menu bar
- connection bar
- workflow header
- workflow tabs
- workspace sidebar
- workflow dialogs

Main views include:

- overview
- workflow/grid edit view
- outcome edit view
- outcome table / alignment views

## Workflow Edit View

Main editor:

```text
react/src/components/views/WorkflowView/WorkflowEditView/index.tsx
```

Key characteristics:

- renders board-like workflow grid
- uses selectors to derive board state
- supports drag/drop reorder for columns, weeks, nodes
- redraws SVG link layer on layout changes
- drives reorder actions through Redux

Important point:

The visual board is derived from normalized state rather than fetched directly as nested view data.

## Project Page Data Flow

Main page:

```text
react/src/components/pages/Workspace/Project/index.tsx
```

Flow:

- fetch project via RTK Query
- marshal entity into local display model
- render tabs:
  - overview
  - workflows

Project page is much simpler than workflow page. It does not appear to rely on the large workspace Redux graph in the same way.

## Library / Search Flow

Main files:

```text
react/src/components/views/LibrarySearchView/index.tsx
react/src/HTTP/XMLHTTP/API/library.rtk.ts
```

Search payload includes:

- pagination
- sort
- filters

Returned objects are normalized as `ELibraryObject` through a shared “library object” contract.

This is the browse/search abstraction for projects and workflows.

## Type System and API Contracts

Important TypeScript API contracts live in:

```text
react/src/HTTP/XMLHTTP/types/entity.ts
react/src/HTTP/XMLHTTP/types/args.ts
react/src/HTTP/XMLHTTP/types/query.ts
```

Notable design note from the code:

- `E*` types represent backend-shaped entities, not ideal frontend models
- comments explicitly acknowledge abstraction leakage from Django models into TS

## Key Frontend Patterns

### Pattern 1: backend entity -> frontend transform -> Redux app state

Example:

- workflow detail RTK query returns backend-shaped package
- hook converts package into `WorkSpaceAppState`
- Redux reducers own it from then on

### Pattern 2: optimistic field change

Example:

- edit node title
- dispatch Redux change immediately
- send REST update
- server rebroadcasts to other users

### Pattern 3: normalized ID lists

Entities commonly contain related IDs rather than fully nested objects:

- workflow has weeks, columns, outcomes
- week has nodes
- node has `outcomenodeSet`
- project has `workflowprojectSet`

Selectors reconstruct board structures from those pieces.

### Pattern 4: partial migration

Some old procedural API modules still exist alongside RTK Query modules. Do not assume one single access style yet.

## Important Frontend Risks

### 1. Route/API constant drift

`react/src/router/apiRoutes.ts` contains path mismatches against backend route declarations in a few places. Do not blindly trust the constants file without checking the backend.

### 2. Redux is still authoritative for workflow editing

Changing only RTK Query types is insufficient for workflow-page features.

### 3. Workflow page depends on websocket + REST + Redux together

A change that touches one of those layers may need corresponding updates in the other two.

### 4. Entities are backend-shaped

Frontend TS types often mirror serializer output directly. If backend serializer fields change, TypeScript entity definitions likely need changes too.

## Practical State Lookup Guide

### “Where does this page fetch from?”

Check RTK Query modules under:

```text
react/src/HTTP/XMLHTTP/API/
```

### “Where does this page store working graph state?”

Check:

```text
react/src/redux/
```

Especially slices/selectors for the workflow editor.

### “Where does collaboration logic live?”

Check:

- `useWorkflowWebsocketManager`
- `WebSocketService`
- `WebsocketServiceConnectedUserManager`

### “Where are route-specific page components?”

Check:

```text
react/src/components/pages/
```

### “Where are actual editor views?”

Check:

```text
react/src/components/views/WorkflowView/
```
