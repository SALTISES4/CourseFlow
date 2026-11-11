"""
Define API naming and resource-layer conventions for CourseFlow V2.

JSON transport:
- Python services, ORM models, handler parameters, and DTOs use snake_case.
- Public request and response bodies use camelCase.
- Request and response models inherit from CamelSchema, which supplies the
  Pydantic alias generator. Use explicit field aliases only for exceptions.
- Prefer typed schemas over raw dictionaries for frontend-facing contracts.
- Query and path parameters remain snake_case unless a route documents an
  exception.

Entity resources:
- Primary CRUD routes return only fields belonging to the persisted resource.
- Related graphs and editor-specific joins belong in dedicated read models.

Graph views:
- Graph view routes return flat top-level collections linked by UUID references.
- Thread UUIDs and comment counts may appear in graph views, but comment bodies
  remain behind thread and comment endpoints.

Schema placement and route naming under course_flow.api enforce these conventions.
"""
