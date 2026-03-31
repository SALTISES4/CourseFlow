# ADR Companion: Backend Contract for Workflow Graph State

## Status

Proposed

## Purpose

This document defines the backend contract required by the frontend workflow graph state rewrite.

Its purpose is to make the frontend migration executable against a stable and explicit API contract rather than informal assumptions.

This contract defines:

- read-side resource contracts
- mutation command contracts
- canonical delta envelopes
- revision/version behavior
- error and reconciliation behavior
- optimistic-UI implications
- collaboration-ready design constraints

This contract is HTTP-first and collaboration-ready, but it does not yet define realtime transport.

---

## 1. Scope

### 1.1 In Scope

This contract applies to the workflow graph editor domain, including:

- workflow graph resource loading
- explicit graph mutation operations
- mutation responses as canonical deltas
- workflow revision handling
- repair and refetch behavior

### 1.2 Out of Scope

This contract does not define:

- websocket transport
- GraphQL schema
- CRDT/OT conflict algorithms
- the full permissions model
- every entity outside the graph/editor surface
- database schema internals

---

## 2. Normative Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** in this document are to be interpreted as normative requirements.

---

## 3. Core Contract Decisions

### 3.1 Backend Authority

The backend **MUST** be authoritative for graph mutation semantics.

The backend **MUST** be responsible for:

- validating graph commands
- applying domain rules
- determining cascades and side effects
- normalizing resulting state
- incrementing workflow revision
- returning canonical mutation deltas

The frontend **MUST NOT** be required to authoritatively derive graph mutation consequences.

### 3.2 Explicit User Intent

The frontend **MUST** send explicit graph commands that correspond to user intent.

Examples include:

- create node
- update node
- rename node
- move node
- delete node
- create edge
- delete edge
- assign node to channel
- reorder structural entities, if supported

The backend **MUST** interpret and execute those commands.

### 3.3 Canonical Mutation Responses

Mutation responses **MUST** describe changes in canonical graph state.

Mutation responses **MUST NOT** contain UI-imperative instructions such as:

- "remove this component"
- "dispatch these actions"
- "run this reducer"

The frontend **MUST** map backend deltas into client state.

### 3.4 Workflow Revision

Every successful mutation response **MUST** include a workflow revision/version.

Revision exists to support:

- stale response detection
- response ordering
- future remote delta application
- repair/refetch logic
- debugging and audit clarity

---

## 4. Resource Model

The graph editor **SHOULD** load graph-related resources as independent read surfaces.

These boundaries **SHOULD** remain stable enough for the frontend to bootstrap the graph page in parallel.

### 4.1 Expected Read Resources

At minimum, the frontend expects read access to the following workflow graph resources:

- workflow metadata
- sections
- channels
- nodes
- edges
- tags

Some resources **MAY** be deferred in an early implementation, but the overall contract model **SHOULD** remain stable.

### 4.2 Read-Side Requirements

#### Canonical entities

Read endpoints **MUST** return canonical entities, not frontend action streams.

#### Idempotent reads

Repeated reads for the same workflow/resource **MUST** be safe and **MUST** support replacement of canonical client state.

#### Independent fetchability

The frontend **MAY** request graph resources independently and in parallel.

#### Revision context

Read payloads **SHOULD** include workflow revision where practical.

---

## 5. Read Endpoint Contract Shape

These endpoint shapes are conceptual. URI naming **MAY** change, but the payload pattern **SHOULD** remain stable.

### 5.1 Workflow Metadata

**Endpoint**

`GET /workflows/{workflowId}`

**Purpose**

Returns workflow-level metadata required to bootstrap the editor shell.

**Response**

```json
{
  "workflow": {
    "id": "wf_123",
    "title": "Semester Planning",
    "unitId": "unit_1",
    "revision": 17,
    "updatedAt": "2026-03-30T12:00:00Z"
  }
}
````

**Requirements**

* The response **SHOULD** include `revision`.
* The `workflow` object **MUST** be canonical.

### 5.2 Sections

**Endpoint**

`GET /workflows/{workflowId}/sections`

**Response**

```json
{
  "workflowId": "wf_123",
  "revision": 17,
  "sections": [
    {
      "id": "sec_1",
      "workflowId": "wf_123",
      "title": "Term 1",
      "position": 1
    }
  ]
}
```

**Requirements**

* `sections` **MUST** contain canonical section entities.
* `workflowId` **MUST** identify graph scope.
* `revision` **SHOULD** be included.

### 5.3 Channels

**Endpoint**

`GET /workflows/{workflowId}/channels`

**Response**

```json
{
  "workflowId": "wf_123",
  "revision": 17,
  "channels": [
    {
      "id": "ch_1",
      "workflowId": "wf_123",
      "sectionId": "sec_1",
      "title": "Assessment",
      "position": 1
    }
  ]
}
```

**Requirements**

* `channels` **MUST** contain canonical channel entities.
* `workflowId` **MUST** identify graph scope.
* `revision` **SHOULD** be included.

### 5.4 Nodes

**Endpoint**

`GET /workflows/{workflowId}/nodes`

**Response**

```json
{
  "workflowId": "wf_123",
  "revision": 17,
  "nodes": [
    {
      "id": "node_1",
      "workflowId": "wf_123",
      "channelId": "ch_1",
      "unitId": "unit_10",
      "title": "Essay Draft",
      "positionX": 120,
      "positionY": 240
    }
  ]
}
```

**Requirements**

* `nodes` **MUST** contain canonical node entities.
* `workflowId` **MUST** identify graph scope.
* `revision` **SHOULD** be included.

### 5.5 Edges

**Endpoint**

`GET /workflows/{workflowId}/edges`

**Response**

```json
{
  "workflowId": "wf_123",
  "revision": 17,
  "edges": [
    {
      "id": "edge_1",
      "workflowId": "wf_123",
      "sourceNodeId": "node_1",
      "targetNodeId": "node_2",
      "kind": "dependency"
    }
  ]
}
```

**Requirements**

* `edges` **MUST** contain canonical edge entities.
* `workflowId` **MUST** identify graph scope.
* `revision` **SHOULD** be included.

### 5.6 Tags

**Endpoint**

`GET /workflows/{workflowId}/tags`

**Response**

```json
{
  "workflowId": "wf_123",
  "revision": 17,
  "tags": [
    {
      "id": "tag_1",
      "name": "Assessment"
    }
  ],
  "nodeTags": [
    {
      "nodeId": "node_1",
      "tagId": "tag_1"
    }
  ]
}
```

**Requirements**

* `tags` **MUST** contain canonical tag entities.
* tag relationships **MUST** be returned as canonical relations.
* the backend **MUST NOT** return frontend instructions in place of canonical tag data.

If the domain model differs, the same principle still applies.

---

## 6. Mutation Command Contract

### 6.1 General Mutation Requirements

#### One user intent maps to one backend command

The frontend **SHOULD** issue one explicit command per user intent.

The backend **MUST** own derived consequences such as cascades.

Example:

Bad:

* delete node
* client derives and sends delete-edge commands separately

Good:

* delete node
* backend computes all consequences

#### Mutations return canonical consequences

Mutation responses **MUST** describe the resulting canonical graph state changes.

#### Mutations are explicit, typed, and bounded

The frontend **MUST NOT** persist graph state by emitting inferred writes from observed store diffs.

#### Mutation responses are future-broadcast compatible

Successful mutation responses **SHOULD** already be usable later as broadcast payloads.

### 6.2 Recommended Mutation Operations

Initial frontend rewrite assumes some subset of the following operations exists or will exist.

#### Core operations

* create node
* update node
* rename node
* move node
* delete node
* create edge
* delete edge
* assign/reassign node to channel

#### Later structural operations

* reorder channel
* reorder section
* move node across section
* bulk mutations

---

## 7. Canonical Mutation Response Envelope

### 7.1 Required Envelope Shape

Every successful graph mutation **MUST** return a response conforming to this shape:

```json
{
  "workflowId": "wf_123",
  "revision": 18,
  "changes": {
    "sections": {
      "created": [],
      "updated": [],
      "deleted": []
    },
    "channels": {
      "created": [],
      "updated": [],
      "deleted": []
    },
    "nodes": {
      "created": [],
      "updated": [],
      "deleted": []
    },
    "edges": {
      "created": [],
      "updated": [],
      "deleted": []
    },
    "tags": {
      "created": [],
      "updated": [],
      "deleted": []
    }
  },
  "meta": {
    "triggeredBy": "delete_node",
    "triggerEntityId": "node_9"
  }
}
```

### 7.2 Required Semantics

* `workflowId` **MUST** identify graph scope.
* `revision` **MUST** be the canonical post-mutation revision.
* `changes` **MUST** contain the exact entities created, updated, and deleted.
* `meta` **MAY** be included for debugging, analytics, and future collaboration.

### 7.3 Change-Set Semantics

#### `created`

`created` **MUST** contain full canonical entities newly created.

#### `updated`

`updated` **SHOULD** contain full canonical entities.

`updated` **MAY** contain partials only if those partials are unambiguous and safe to patch without additional interpretation.

#### `deleted`

`deleted` **MUST** contain canonical entity identifiers removed from state.

### 7.4 Preferred Return Strategy

For `created` and `updated`, the backend **SHOULD** return full canonical entities unless payload size becomes a material operational concern.

This reduces ambiguity around:

* server-side normalization
* calculated/defaulted fields
* backend-enforced ordering
* debugging and auditability
* collaboration fan-out consistency

---

## 8. Example Mutation Contracts

### 8.1 Rename Node

**Endpoint**

`PATCH /workflows/{workflowId}/nodes/{nodeId}`

**Request**

```json
{
  "title": "Essay Draft v2"
}
```

**Response**

```json
{
  "workflowId": "wf_123",
  "revision": 18,
  "changes": {
    "nodes": {
      "created": [],
      "updated": [
        {
          "id": "node_1",
          "workflowId": "wf_123",
          "channelId": "ch_1",
          "unitId": "unit_10",
          "title": "Essay Draft v2",
          "positionX": 120,
          "positionY": 240
        }
      ],
      "deleted": []
    },
    "edges": {
      "created": [],
      "updated": [],
      "deleted": []
    }
  },
  "meta": {
    "triggeredBy": "rename_node",
    "triggerEntityId": "node_1"
  }
}
```

### 8.2 Move Node

**Endpoint**

`PATCH /workflows/{workflowId}/nodes/{nodeId}`

**Request**

```json
{
  "positionX": 280,
  "positionY": 310
}
```

**Response**

```json
{
  "workflowId": "wf_123",
  "revision": 19,
  "changes": {
    "nodes": {
      "created": [],
      "updated": [
        {
          "id": "node_1",
          "workflowId": "wf_123",
          "channelId": "ch_1",
          "unitId": "unit_10",
          "title": "Essay Draft v2",
          "positionX": 280,
          "positionY": 310
        }
      ],
      "deleted": []
    },
    "edges": {
      "created": [],
      "updated": [],
      "deleted": []
    }
  },
  "meta": {
    "triggeredBy": "move_node",
    "triggerEntityId": "node_1"
  }
}
```

### 8.3 Create Edge

**Endpoint**

`POST /workflows/{workflowId}/edges`

**Request**

```json
{
  "sourceNodeId": "node_1",
  "targetNodeId": "node_2",
  "kind": "dependency"
}
```

**Response**

```json
{
  "workflowId": "wf_123",
  "revision": 20,
  "changes": {
    "edges": {
      "created": [
        {
          "id": "edge_10",
          "workflowId": "wf_123",
          "sourceNodeId": "node_1",
          "targetNodeId": "node_2",
          "kind": "dependency"
        }
      ],
      "updated": [],
      "deleted": []
    }
  },
  "meta": {
    "triggeredBy": "create_edge"
  }
}
```

### 8.4 Delete Edge

**Endpoint**

`DELETE /workflows/{workflowId}/edges/{edgeId}`

**Response**

```json
{
  "workflowId": "wf_123",
  "revision": 21,
  "changes": {
    "edges": {
      "created": [],
      "updated": [],
      "deleted": ["edge_10"]
    }
  },
  "meta": {
    "triggeredBy": "delete_edge",
    "triggerEntityId": "edge_10"
  }
}
```

### 8.5 Delete Node with Backend Cascade

**Endpoint**

`DELETE /workflows/{workflowId}/nodes/{nodeId}`

**Response**

```json
{
  "workflowId": "wf_123",
  "revision": 22,
  "changes": {
    "nodes": {
      "created": [],
      "updated": [],
      "deleted": ["node_9"]
    },
    "edges": {
      "created": [],
      "updated": [],
      "deleted": ["edge_3", "edge_7"]
    }
  },
  "meta": {
    "triggeredBy": "delete_node",
    "triggerEntityId": "node_9"
  }
}
```

This is the canonical example of backend-owned mutation consequences.

---

## 9. Revision / Version Contract

### 9.1 Required Behavior

The backend **MUST** maintain a revision/version for each workflow graph.

Revision **MUST** change whenever a mutation changes canonical graph state relevant to the editor.

### 9.2 Client Expectations

The frontend expects:

1. read responses **MAY** include the current revision
2. mutation responses **MUST** include the post-mutation revision
3. revisions **MUST** be monotonic for a given workflow
4. revision **MUST** be usable to detect stale client assumptions

### 9.3 Request-Side Revision Handling

This may be introduced in levels.

#### Level 1 — response-only revision

The frontend receives revision in responses and uses it for ordering and repair logic.

#### Level 2 — expected revision in write requests

The frontend includes expected revision on mutation requests.

Example:

```json
{
  "positionX": 280,
  "positionY": 310,
  "expectedRevision": 19
}
```

This is preferable long term, but it is not required for the initial rewrite.

### 9.4 Revision Mismatch Behavior

If the backend rejects a mutation because the client is stale, the backend **MUST** return a machine-readable revision conflict error.

Frontend behavior **MUST** be able to:

* discard or settle optimistic overlay
* refetch graph resources or targeted resources
* re-establish canonical state

---

## 10. Error Contract

### 10.1 Error Requirements

Mutation failures **MUST** be machine-readable enough for the frontend to decide whether to:

* rollback optimistic overlay
* show validation error
* retry
* perform repair refetch

The backend **MUST NOT** rely on human-readable strings alone.

### 10.2 Error Categories

Stable error categories **SHOULD** include:

* `validation_error`
* `permission_denied`
* `not_found`
* `revision_conflict`
* `workflow_locked`
* `domain_constraint_violation`
* `server_error`

Exact naming **MAY** vary, but semantics **SHOULD** remain stable.

### 10.3 Example Error Responses

#### Revision conflict

```json
{
  "error": {
    "code": "revision_conflict",
    "message": "Workflow revision is stale.",
    "workflowId": "wf_123",
    "currentRevision": 22
  }
}
```

#### Validation error

```json
{
  "error": {
    "code": "validation_error",
    "message": "Target node cannot reference itself.",
    "fields": {
      "targetNodeId": ["Target node cannot equal source node."]
    }
  }
}
```

---

## 11. Repair / Reconciliation Contract

### 11.1 Repair as Fallback

The architecture **MUST** support recovery, but it **MUST NOT** assume routine disagreement between client and backend.

Repair **SHOULD** be used for:

* revision conflict
* reduced confidence in local state
* unexpected error conditions
* future missed remote updates

### 11.2 Backend Support Required for Repair

The backend **MUST** support clean idempotent reads so the frontend can:

* refetch the entire graph resource set
* refetch targeted resources

without side effects.

### 11.3 Success-Path Requirement

Successful mutation handling **MUST NOT** require immediate full refetch.

The canonical mutation delta **MUST** be sufficient for the standard success path.

---

## 12. Optimistic-UI Implications

### 12.1 Backend Remains Canonical

The backend contract **MUST** remain canonical and deterministic.

The backend **MUST NOT** expose separate optimistic-preview semantics.

### 12.2 Optimistic UI Depends on Stable Mutation Semantics

To support responsive UI, the frontend requires mutation contracts that are:

* explicit
* bounded
* stable
* deterministic enough to project local pending state

This matters especially for:

* rename node
* move node
* create edge
* delete node

### 12.3 Conservative Optimism for Complex Operations

For complex mutations such as delete-node with cascading effects, the backend contract remains unchanged.

The frontend **MAY** choose shallow provisional treatment until the authoritative delta returns.

A separate endpoint or response mode is **NOT REQUIRED**.

---

## 13. Collaboration-Ready Constraints

This rewrite does not implement collaboration now, but the contract **MUST NOT** block it later.

### 13.1 Broadcast-Reusable Mutation Envelopes

The delta envelope returned from HTTP mutations **SHOULD** later be reusable as a broadcast payload.

That requires stable:

* `workflowId`
* `revision`
* `changes`

Actor/meta information **MAY** be included.

### 13.2 Canonical State and Presence State Separation

This contract covers canonical graph state only.

Future presence or awareness events **MUST** remain distinct from canonical mutation deltas.

Examples include:

* user joined workflow
* user selected node
* user started editing a field
* user moved cursor or viewport

These **MUST NOT** be mixed into canonical mutation envelopes.

### 13.3 Realtime Fan-Out Must Preserve Mutation Semantics

A future backend path may:

1. commit graph mutation
2. return canonical delta to the initiating client
3. publish the same delta to other connected clients

That future path **MUST NOT** require a different mutation semantic model.

---

## 14. Minimum Backend Requirements for the Frontend Rewrite

### 14.1 Required Now

1. stable graph read endpoints by resource
2. stable explicit mutation endpoints for the initial operation set
3. canonical mutation delta envelopes
4. workflow revision in mutation responses
5. machine-readable error codes
6. clean idempotent refetch behavior

### 14.2 Strongly Recommended Now

1. revision included in read responses
2. full canonical entities returned for created and updated items
3. consistent delta shape across all mutation operations
4. optional meta fields for debugging and future collaboration

### 14.3 May Be Deferred

1. expected revision supplied on every mutation request
2. push/broadcast transport
3. presence endpoints/events
4. fine-grained concurrency policy beyond basic revision conflict handling

---

## 15. Acceptance Criteria

This contract is sufficient for the frontend rewrite only if all of the following are true:

1. the frontend can bootstrap a workflow graph page by fetching split graph resources
2. the frontend can normalize those resources independently
3. a user intent such as `delete node` maps to one backend command
4. the backend returns canonical resulting deletions, updates, and creations
5. the frontend does not need to infer authoritative cascades
6. mutation responses include workflow revision
7. error responses allow the frontend to distinguish rollback vs refetch vs validation feedback
8. the same mutation delta envelope can later be reused for realtime fan-out

---

## 16. Immediate Follow-Up

The next follow-up document **SHOULD** be a short implementation spec for the initial mutation set:

* rename node
* move node
* create edge
* delete edge
* delete node

That follow-up **SHOULD** define:

* final endpoint URIs
* request payload fields
* response payload fields
* exact response examples aligned with backend implementation
