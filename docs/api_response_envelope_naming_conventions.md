# API response and public identifier conventions (CourseFlow v2)

This document records naming decisions for headless / OpenAPI-facing contracts.

## Public resource identity

- **UUID** is the canonical public identifier for domain entities that have one (project, workflow, node, user, etc.).
- **Do not** expose integer database primary keys (`id`) on those JSON response models unless there is a specific, documented exception.
- **Edges** have no UUID column; the public edge key remains the integer primary key exposed as `id` in graph payloads (and as `edgeId` in client code where disambiguation helps).

## Routes

- Path segments use explicit names (`:uuid`, `:nodeUuid`, `:workflowUuid`, `:edgeId`) matching `generatePath` parameter objects in clients.

## Related fields

- Foreign keys such as `owner_id` and `project_id` may still appear as integers until replaced by UUID-based user/project references in a later change.
