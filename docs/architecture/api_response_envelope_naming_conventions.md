# ADR: API Response Envelope and Naming Conventions

- **Status:** Accepted
- **Date:** 2026-03-30
- **Decision owners:** Backend / Frontend architecture
- **Scope:** Headless API contracts for CourseFlow v2

## Context

We need a consistent response contract style for headless API endpoints.

We want to avoid vague RPC-style wrappers such as:

```ts
type ExampleResponse = {
  message: string
  dataPackage: {
    ...
  }
}
````

These shapes are weak for several reasons:

1. `message` is usually not part of the machine-readable domain contract for successful CRUD responses.
2. `dataPackage` is semantically empty and does not communicate resource meaning.
3. Generic wrappers obscure whether an endpoint returns:

   * one canonical resource
   * a homogeneous collection
   * a UI-oriented projection
4. The frontend benefits from predictable naming that reflects the actual response semantics.

We therefore need a simple naming system that distinguishes:

* singular resource responses
* collection responses
* projection responses

---

## Decision

### 1. Do not use generic success wrappers

For successful API responses, do **not** use generic fields such as:

* `message`
* `dataPackage`

Example to avoid:

```ts
type CreateProjectResp = {
  message: string
  dataPackage: {
    id: string
  }
}
```

These wrappers are not domain-semantic and should not be part of the standard API contract style.

---

### 2. Singular CRUD responses should return the resource at the root by default

For simple singular CRUD endpoints, prefer returning the resource directly at the root.

Preferred:

```ts
type GetProjectResp = ProjectDetail
type CreateProjectResp = ProjectDetail
type UpdateProjectResp = ProjectDetail
```

Example:

```ts
type ProjectDetail = {
  id: string
  uuid: string
  title: string
  description: string | null
  isPublished: boolean
  isTemplate: boolean
  ownerId: string
  dateCreated: string
  modifiedOn: string
}
```

This is the default for:

* `GET /project/:uuid`
* `POST /project`
* `PUT /project/:uuid`
* similar singular resource endpoints

---

### 3. `item` is optional and only justified when a real envelope is needed

Use `item` only when there is a deliberate reason to maintain an envelope.

Valid reasons include:

* a consistent API-wide envelope convention
* the need to include sibling metadata alongside the resource
* a command-style or augmented response contract

Example where `item` is justified:

```ts
type GetProjectResp = {
  item: ProjectDetail
  permissions: {
    canEdit: boolean
    canDelete: boolean
  }
}
```

Do **not** add `item` merely as an unnecessary extra wrapper around a single resource.

---

### 4. Use `items` only for one homogeneous collection

Use `items` when the response is a single top-level list of the same kind of resource.

Preferred:

```ts
type ListProjectsResp = {
  items: ProjectSummary[]
}
```

If needed, add `meta` for machine-readable auxiliary data such as pagination or counts:

```ts
type ListProjectsResp = {
  items: ProjectSummary[]
  meta: {
    total: number
  }
}
```

Use `items` for canonical collection endpoints such as:

* `GET /project`
* `GET /workflow`
* `GET /project/:uuid/nodes`

when the endpoint is returning one collection of one resource type.

#### Paginated list endpoints (mandatory)

If the UI needs page-based navigation (or any bounded page of rows), **pagination is always server-side**:

* The handler accepts paging inputs as query parameters (this repo uses **`page`** and **`page_size`** unless an endpoint-specific ADR says otherwise).
* **`page` and `meta.current_page` are 1-based** and must stay consistent across the API and clients (including MUI `Pagination`).
* The database query applies `LIMIT` / `OFFSET` (or equivalent), not “load all rows then slice in Python or TypeScript”.
* The response stays a homogeneous collection: **`{ items: [...], meta: { ... } }`**. Pagination fields live in **`meta`**, for example:
  * `total` — total rows matching the query (for the current user / filters)
  * `total_pages`
  * `current_page` — effective page after any clamping
  * `page_size`
* Additional list-level fields (e.g. `unread_count` for an inbox) also belong in **`meta`** when they describe the collection, not a single row.

The frontend **must not** fetch the full list and use `Array.prototype.slice` (or equivalent) to simulate pages.

Cursor-based pagination, if added later, should still use **`meta`** for cursors and related flags, not ad-hoc top-level fields.

Reference implementation: `GET /api/user/me/notifications`.

---

### 5. Do not use `item` or `items` for grouped projection responses

If an endpoint returns a categorized, bucketed, or UI-oriented projection, do not force it into `item` or `items`.

Example of a grouped projection:

```ts
type ListProjectsQueryResp = {
  ownedProjects: ELibraryObject[]
  editProjects: ELibraryObject[]
  deletedProjects: ELibraryObject[]
}
```

This is neither:

* one singular resource (`item`)
* nor one homogeneous collection (`items`)

It is a **projection**.

Such endpoints must use **domain-specific naming**.

Preferred:

```ts
type ProjectLibraryResp = {
  owned: ELibraryObject[]
  editable: ELibraryObject[]
  deleted: ELibraryObject[]
}
```

Acceptable wrapped form if needed:

```ts
type ProjectLibraryResp = {
  projects: {
    owned: ELibraryObject[]
    editable: ELibraryObject[]
    deleted: ELibraryObject[]
  }
}
```

Prefer adjectives or stable category names such as:

* `owned`
* `editable`
* `deleted`

Avoid awkward verb-like names such as:

* `editProjects`

Use `editable` instead.

---

## Naming rules

### Rule A: singular canonical resource

For a singular detail response that uses an envelope, **`item` is required**.

```ts
type GetProjectResp = {
  item: ProjectDetail
}
```

Name domain payload types with an `Out` suffix and enveloped responses with an `OutResp` suffix (for example `ProjectDetailOut` and `ProjectDetailOutResp`), not vague names such as `ProjectDetailEnvelopeOut`.

---

### Rule B: homogeneous collection

Use `items`.

```ts
type ListProjectsResp = {
  items: ProjectSummary[]
}
```

---

### Rule C: grouped or categorized projection

Use domain-specific field names.

```ts
type ProjectLibraryResp = {
  owned: ELibraryObject[]
  editable: ELibraryObject[]
  deleted: ELibraryObject[]
}
```

Do not wrap this as:

```ts
type BadResp = {
  items: {
    owned: ELibraryObject[]
    editable: ELibraryObject[]
    deleted: ELibraryObject[]
  }
}
```

because `items` incorrectly suggests a single homogeneous collection.

---

### Rule D: auxiliary non-resource metadata

Use `meta` for machine-readable metadata (counts, pagination, flags). JSON field names follow the Python/Ninja schema (**`snake_case`**), for example:

```ts
type ListProjectsResp = {
  items: ProjectSummary[]
  meta: {
    total: number
  }
}
```

Do not use `message` for successful CRUD metadata.

---

### Rule E: paginated homogeneous collection

Combine Rule B and Rule D: **`items`** is only the current page; **`meta`** carries pagination and any list-level aggregates.

```ts
type ListNotificationsResp = {
  items: NotificationRow[]
  meta: {
    total: number
    total_pages: number
    current_page: number
    page_size: number
    unread_count: number
  }
}
```

Pagination is implemented in the backend query. Clients change `page` / `page_size` query parameters and refetch; they do not download all rows and paginate in memory.

---

## Examples

### Preferred singular CRUD response

```ts
type CreateProjectResp = ProjectDetail
```

### Preferred collection response

```ts
type ListProjectsResp = {
  items: ProjectSummary[]
  meta?: {
    total: number
  }
}
```

### Preferred projection response

```ts
type ProjectLibraryResp = {
  owned: ELibraryObject[]
  editable: ELibraryObject[]
  deleted: ELibraryObject[]
}
```

---

## Rejected alternatives

### Rejected: generic RPC-style wrapper

```ts
type Resp = {
  message: string
  dataPackage: ...
}
```

Reason:

* semantically vague
* inconsistent with resource-oriented contracts
* adds noise without clarifying response meaning

### Rejected: using `item` for everything

```ts
type Resp = {
  item: ...
}
```

Reason:

* useful only for singular resource envelopes
* misleading when the response is a grouped projection
* unnecessary for simple root-level singular CRUD responses

### Rejected: using `items` for grouped projections

```ts
type Resp = {
  items: {
    owned: ...
    editable: ...
    deleted: ...
  }
}
```

Reason:

* `items` should mean one homogeneous list
* grouped buckets are projections and should be named explicitly

---

## Consequences

### Positive

* API contracts become easier to read and reason about.
* Frontend types better reflect endpoint semantics.
* CRUD endpoints remain simple and direct.
* Projection endpoints are explicit rather than disguised as generic collections.
* Avoids proliferation of weak wrapper names such as `message` and `dataPackage`.

### Negative

* The API will not have one single envelope shape for every endpoint.
* Callers must understand the difference between canonical resource endpoints and projection endpoints.

This tradeoff is acceptable because semantic clarity is more important than artificial wrapper uniformity.

---

## Practical guidance

### Use root-level resource responses for:

* `GET /resource/:id`
* `POST /resource`
* `PUT /resource/:id`

### Use `items` for:

* canonical list endpoints returning one resource collection

### Use domain-specific names for:

* dashboard payloads
* grouped library views
* categorized access buckets
* composite projections
* UI convenience endpoints

---

## Final rule summary

1. Do not use `message` or `dataPackage` for successful standard API responses.
2. Prefer root-level resource responses for simple singular CRUD operations.
3. Use `item` only when a real response envelope is justified.
4. Use `items` only for one homogeneous collection.
5. Use domain-specific names for grouped or projected response shapes.
6. Use `meta` for auxiliary machine-readable metadata.
7. For paginated lists, paginate in the backend; return pagination fields in `meta`; use **1-based** `page` / `current_page` unless an ADR states otherwise; never fetch the full collection and slice on the client for page navigation.

````

A stricter companion rule would be:

```md
When naming a response field, choose the narrowest term that truthfully describes the payload shape.
Do not use generic wrappers when the endpoint semantics can be expressed directly.
````
