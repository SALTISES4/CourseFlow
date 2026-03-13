# Realtime Event Graph

## Purpose

This document explains websocket-based collaboration in CourseFlow.

The realtime system is used for:

- collaborative workflow edits
- transient field locks
- connected-user presence
- parent/child workflow invalidation messages

It is **not** the primary persistence mechanism. REST remains the source of truth for saved state.

## Transport

### Websocket route

Backend:

```text
course_flow/routes/websocket_urls.py
```

Route:

```text
ws/update/<workflowPk>/
```

### Backend consumer

```text
course_flow/sockets/consumers.py
```

### Frontend websocket services

```text
react/src/HTTP/WebSocketService.ts
react/src/HTTP/WebsocketServiceConnectedUserManager.ts
react/src/components/pages/Workspace/Workflow/hooks/useWorkflowWebsocketManager.tsx
```

## Event Types

Shared names appear in both frontend and backend.

Defined event types:

- `workflow_action`
- `micro_update`
- `lock_update`
- `connection_update`
- `workflow_parent_updated`
- `workflow_child_updated`

Important nuance:
`micro_update` is an inbound client message type that the backend consumer remaps into an outgoing `workflow_action`.

## Authorization

On websocket connect:

- consumer resolves workflow by `workflowPk`
- permission check runs
- connection is accepted only if user has view or edit access

Relevant code:

- `WorkflowUpdateConsumer.get_permission()`
- `WorkflowUpdateConsumer.connect()`

## Frontend Realtime Flow

### Initialization

Workflow page creates:

- `WebSocketService`
- `WebSocketServiceConnectedUserManager`

This happens in:

```text
useWorkflowWebsocketManager.tsx
```

### Lifecycle

- create websocket for `ws/update/<workflowId>/`
- connect handlers
- fetch workflow detail via RTK Query
- hydrate Redux store
- drain queued messages
- continue normal collaborative operation

The code currently treats websocket initialization and workflow data loading as loosely coupled but interdependent.

## Backend Broadcast Flow

### `WorkflowUpdateEmitter.emit_workflow_update()`

This is the main server-side workflow broadcast function.

Behavior:

- increment `workflow.edit_count`
- save workflow
- build message:
  - `type`
  - `action`
  - `edit_count`
- camelize payload
- send to channel group `workflow_<id>`

### Other emitter methods

- `dispatch_to_parent_wf()`
- `emit_parent_updated()`
- `emit_child_updated()`

These propagate changes beyond the current workflow where linked workflows are involved.

## Client Event Routing

Client routing logic is in:

```text
useWorkflowWebsocketManager.tsx
```

### `workflow_action`

Behavior:

- directly dispatch the incoming Redux action into store

This is the main collaborative edit mechanism.

### `lock_update`

Behavior:

- create or clear transient lock state for object
- lock expiry handled client-side with timeout

### `connection_update`

Behavior:

- forwarded into connected-user manager
- updates user presence list in UI

### `workflow_parent_updated`

Behavior:

- queue messages
- refetch parent workflow data
- replace parent-related slices
- clear queue

### `workflow_child_updated`

Behavior:

- queue messages
- fetch child workflow data
- merge into store
- clear queue

## Presence / Connected Users

Connected-user manager:

```text
WebSocketServiceConnectedUserManager
```

Behavior:

- sends connection update when socket opens
- continues sending heartbeat every 10s
- tracks users as connected/disconnected with timeout-based expiry
- assigns user colour for presence display

This is presence-only logic, not persistence.

## Field Locks

Frontend can call:

```ts
lockUpdate({ objectId, objectType }, time, lock)
```

Sent payload:

```ts
{
  type: "lock_update",
  lock: {
    objectId,
    objectType,
    expires,
    userId,
    lock
  }
}
```

Backend consumer:

- rebroadcasts the lock message to workflow group

Client:

- stores lock
- clears it automatically when timeout expires

Important limitation:
Lock state is transient and not persisted in DB.

## Optimistic Edit Flow

This is the most important realtime pattern.

### On local field edit

- frontend dispatches immediate Redux field change
- frontend sends REST update to generic update endpoint
- backend saves object
- backend emits workflow update action to channel
- other clients receive and dispatch same action

So collaboration is:

- optimistic locally
- confirmed by server persistence
- propagated via websocket action replay

## Message Queueing

The client contains queue logic because websocket messages can arrive before the full workflow state is ready.

State variables:

- `isMessagesQueued`
- `messageQueue`

The queue is used especially when:

- parent workflow updates arrive
- child workflow updates arrive
- initial hydration is incomplete

This queueing logic is acknowledged in code comments as fragile and not fully trusted.

## Parent / Child Workflow Update Graph

This is specific to linked workflows.

### Parent update case

When a child workflow changes in a way that affects parent alignment:

- backend emits `workflow_parent_updated`
- client refetches parent-related data package

### Child update case

When a linked child workflow changes:

- backend emits `workflow_child_updated`
- client fetches child outcome package and merges it

This avoids trying to broadcast the full derived alignment graph over websocket directly.

## Failure / Reconnect Behavior

`WebSocketService` implements:

- exponential backoff reconnect
- capped max reconnect attempts
- queued messages until socket is ready

If maximum reconnect attempts are reached, the service logs failure.

## Important Constraints for Changes

- Do not change websocket event names casually.
- If backend outgoing payload keys change, update frontend parser.
- If Redux action shapes change, websocket replay may break.
- Presence and lock messages are not durable; treat them as ephemeral UI state.
- Parent/child workflow events rely on follow-up REST fetches, not complete websocket snapshots.

## Safe Mental Model

Use the websocket layer as:

- a broadcast bus
- for editor state synchronization
- not as the sole source of truth

Persist first through REST or explicit backend logic, then broadcast.
