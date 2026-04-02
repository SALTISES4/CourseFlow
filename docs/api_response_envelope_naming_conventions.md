# API response and public identifier conventions (CourseFlow v2)

This document records naming decisions for headless / OpenAPI-facing contracts.

## Public resource identity

- **UUID** is the canonical public identifier for domain entities that have one (project, workflow, node, user, etc.).
- **Do not** expose integer database primary keys (`id`) on those JSON response models unless there is a specific, documented exception.
- **Edges** have no UUID column; the public edge key remains the integer primary key exposed as `id` in graph payloads (and as `edgeId` in client code where disambiguation helps).

## Routes

- Path segments use explicit names (`:uuid`, `:nodeUuid`, `:workflowUuid`, `:edgeId`) matching `generatePath` parameter objects in clients.

## Paginated collections

Paginated list endpoints use query parameters (typically **`page`** and **`page_size`**, **1-based** `page`) and return **`{ items, meta }`** with pagination fields in **`meta`**. Pagination is always **server-side**; clients must not load the entire collection and paginate in memory. See [architecture/api_response_envelope_naming_conventions.md](architecture/api_response_envelope_naming_conventions.md).

## Related fields

- Foreign keys such as `owner_id` and `project_id` may still appear as integers until replaced by UUID-based user/project references in a later change.
