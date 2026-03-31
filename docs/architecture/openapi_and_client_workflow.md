# OpenAPI and Client Workflow

The API specification must be generated from the actual Django Ninja endpoints and schemas.

Do not maintain a second hand-written API specification in parallel.

## Goal

One source of truth:

- routes declared in Django Ninja
- request/response schemas declared in code
- OpenAPI generated automatically from those declarations

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
- a usable artifact for Postman import or client generation

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

## Postman / Client Workflow

Preferred workflow:

1. implement or update endpoint
2. declare request schema
3. declare response schema
4. verify endpoint in Swagger / docs UI
5. export OpenAPI JSON if needed
6. import generated OpenAPI into Postman or generate clients from it

## Do Not Do This

- do not maintain a separate manual OpenAPI file as the primary source
- do not document endpoints in markdown first and code second
- do not leave schemas undeclared and try to reconstruct the spec later

## Future Extension

If client SDK generation becomes a requirement later, it should consume the generated OpenAPI artifact rather than a separately curated contract file.
