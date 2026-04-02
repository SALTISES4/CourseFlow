# OpenAPI and Client Workflow

The API specification must be generated from the actual Django Ninja endpoints and schemas.

Do not maintain a second hand-written API specification in parallel.

## Goal

One source of truth:

- routes declared in Django Ninja
- request/response schemas declared in code
- OpenAPI generated automatically from those declarations

That OpenAPI document is the **authoritative contract** for HTTP clients, documentation, and **frontend code generation**.

## Expected Output

The backend should expose:

- interactive Swagger UI or equivalent docs UI
- OpenAPI JSON
- optionally OpenAPI YAML if needed for tooling export

## Preferred Mechanism

Use Django Ninja's built-in OpenAPI generation from declared routes and Ninja Schemas.

That gives:

- live docs from real endpoints
- schema consistency with request and response models
- a usable artifact for Postman import or **machine-driven client generation**

## Working Rule

After request/response schemas and endpoint contracts exist, nobody should have to author a second API document manually just to support:

- Swagger UI
- Postman import
- client generation
- contract inspection

## Implementation Guidance

The API router should be configured so that:

- endpoints are registered through Ninja
- request and response schemas are declared on the endpoint
- generated docs are enabled in development
- OpenAPI is exportable as JSON

## Suggested Development Targets

Examples only; adapt to actual project wiring:

- API docs UI available at a route such as `/api/docs`
- OpenAPI JSON available at a route such as `/api/openapi.json`

## Postman / manual workflow

Preferred workflow:

1. implement or update endpoint
2. declare request schema
3. declare response schema
4. verify endpoint in Swagger / docs UI
5. export OpenAPI JSON if needed
6. import generated OpenAPI into Postman or drive client generators from it

---

## Selected client workflow (frontend)

This is the **current, firm decision** for the React app. It is not an optional future experiment.

1. **Django Ninja** — endpoints and Ninja Schemas define routes and shapes; **OpenAPI is generated** from those declarations.
2. **Hey API** — consumes the OpenAPI artifact (JSON from the running API or a checked-in export, per project convention).
3. **Hey API generates** (exact outputs follow Hey API configuration, typically including):
   - TypeScript types aligned with schemas
   - **Fetch-based** API client / SDK functions
   - **TanStack Query** query and mutation **option helpers** for conventional server-state usage
4. **Frontend usage policy**
   - **TanStack Query** — default for **ordinary server-state** (lists, detail views, standard CRUD, search) where data is naturally modeled as cached queries and mutations.
   - **Generated SDK / fetch functions** — use **directly** inside graph/editor **orchestration** (e.g. thunks, command flows): bootstrap, multi-request hydration, and mutation flows that apply **canonical deltas into normalized Redux**, not into a query cache.
   - **Redux normalized slices** — remain the **canonical client-side store** for workflow graph/editor domain state; TanStack Query is **not** the primary owner of that graph (see [adr_frontend_api_client.md](adr_frontend_api_client.md)).

Strategic direction: **not** RTK Query codegen or RTK Query as the long-term default API surface for new work.

### Paginated list queries

For UIs with **page-based** navigation, the backend paginates in the database and returns **`{ items, meta }`** with machine-readable pagination in **`meta`** (`total`, `total_pages`, `current_page`, `page_size`, etc., plus list-level fields such as counts when needed). See [api_response_envelope_naming_conventions.md](api_response_envelope_naming_conventions.md).

On the frontend, pass `page` and `page_size` through the generated query options (for example `listMyNotificationsOptions({ query: { page, page_size } })`) so **each page is a distinct query**. After mutations, invalidate every variant of that list query (same `_id`) or otherwise refetch the current page. **Do not** download the full list and paginate with `slice` in the component.

---

## Do not do this

**OpenAPI / contracts**

- do not maintain a separate manual OpenAPI file as the primary source
- do not document endpoints in markdown first and code second
- do not leave schemas undeclared and try to reconstruct the spec later

**Frontend / clients**

- do **not** **manually edit** **`react/src/api`** or other paths emitted by **Hey API**; regenerate from OpenAPI after backend or config changes (see [adr_frontend_api_client.md](adr_frontend_api_client.md))
- do **not** maintain **duplicated handwritten** TypeScript DTOs or interfaces for endpoints when **generated types** from the same OpenAPI already exist—extend or wrap generated types only when there is a clear, reviewed reason
- do **not** create **feature-local bespoke transport wrappers** that reimplement the same paths and payloads as the **generated client** without justification (prefer shared generated SDK calls)
- do **not** treat **RTK Query** or **@rtk-query/codegen-openapi** as the **strategic** client-generation or server-state path for **new** features; use **Hey API + Fetch + TanStack Query** per this document and [adr_frontend_api_client.md](adr_frontend_api_client.md)
- do **not** implement paginated screens by fetching an unpaginated full list and slicing it in React; use server-side pagination and `meta` as in [api_response_envelope_naming_conventions.md](api_response_envelope_naming_conventions.md)
- do **not** model the **graph editor’s canonical graph** primarily as a **TanStack Query cache**; normalized Redux remains the graph store; generated fetch is for I/O, not a second canonical copy of the graph

---

## Related

- Architecture decision record: [adr_frontend_api_client.md](adr_frontend_api_client.md)
- Backend stack context: [backend_stack.md](backend_stack.md)
