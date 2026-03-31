# API Spec Export

The API spec should be generated from Django Ninja endpoint declarations.

## Principle

The code is the source of truth.

Routes plus request/response schemas must generate the OpenAPI artifact.

## Development Workflow

1. add or update an endpoint
2. add or update request schema
3. add or update response schema
4. confirm the route appears in generated docs
5. export OpenAPI JSON only from the generated source

## Tooling Use Cases

Generated OpenAPI may be used for:

- Swagger inspection
- Postman import
- client SDK generation
- test fixture generation later

## Rule

Do not manually maintain a separate contract file unless a future tool absolutely requires a derived export artifact.
