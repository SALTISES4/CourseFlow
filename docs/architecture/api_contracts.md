# API Contract Rules

This file defines how HTTP contracts should be modeled in the rebuild.

## Goals

- explicit request and response shapes
- automatic OpenAPI generation from real endpoint declarations
- no second manually maintained API specification
- clean separation between transport, application, and persistence layers

## Contract Layers

## 1. Ninja Request Schemas

Request schemas describe the payload accepted by an endpoint.

They should include:

- field names
- field types
- nullability
- optional validation rules
- nested request structures only when truly required

They should not include:

- persistence methods
- business orchestration
- ORM references

These schemas should be Django Ninja `Schema` classes.
They are Pydantic-backed.

## 2. Ninja Response Schemas

Response schemas describe what the API returns to clients.

They should be stable, intentional contracts.

They should not simply dump internal ORM objects by default.

These schemas should also be Django Ninja `Schema` classes.

## 3. Application-Level Result Shapes

The application layer may return structured result objects where needed.

Use them when:

- the application service should return a shape not tied directly to HTTP
- multiple endpoints may reuse the same use-case output
- the shape is useful outside direct endpoint serialization

Do not create separate DTO classes automatically for every endpoint.
Only add them when they clarify the application boundary.

## Recommended Conventions

### Schema location

```text
src/schemas/requests/
src/schemas/responses/
src/schemas/shared/
```

### Application result shape location

```text
src/application/
```

Place command/query/result objects near the use case or in a clearly scoped application module.

### Naming

Use explicit names such as:

- `CreateGraphRequest`
- `UpdateGraphRequest`
- `GraphResponse`
- `GraphListItemResponse`
- `CreateGraphCommand`
- `GraphResult`

## API Endpoint Pattern

Recommended endpoint flow:

```python
@router.post("/graphs", response=GraphResponse)
def create_graph(request, payload: CreateGraphRequest):
    command = CreateGraphCommand(
        title=payload.title,
        project_id=payload.project_id,
        actor_id=request.user.id,
    )
    result = graph_service.create_graph(command)
    return GraphResponse.model_validate(result)
```

## Rules

- every non-trivial endpoint should declare request and response schemas explicitly
- avoid untyped dict-shaped payloads
- avoid returning raw ORM models directly
- avoid reusing one schema for every purpose
- split list item responses from detail responses when needed
- keep pagination contracts explicit
- prefer Ninja `Schema` for API transport contracts

## Validation Ownership

Transport validation belongs in schemas.

Examples:

- required field presence
- simple type constraints
- basic format constraints

Business validation belongs in application/domain layers.

Examples:

- whether a graph can be created under a given project
- whether a node transition is valid
- whether the actor has permission to perform a domain action

## Error Contract Guidance

The API should eventually standardize error payloads.

Initial shape may include:

- machine-readable code
- message
- optional field-level validation details
- correlation or request id if adopted later

Do not invent a full error taxonomy unless needed for the current implementation slice.
