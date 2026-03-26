# CourseFlow Backend Repository Layout

This structure separates **transport, application logic, domain logic, and infrastructure**.
The goal is to keep business logic independent of Django while still using Django for routing, ORM, and platform services.

---

# Top-Level Structure

# this is the legacy code base and is used for legacy reference / historic reference only
do not edit this folder or any files within this folder
do not use this folder for inferring architectural patterns unless explicitly asked

courseflow_v2/*

# the frontend written in react, do not edit this for now or consider it while designing or editing backend
react
```
courseflow_v2/
│
├── manage.py
├── pyproject.toml
├── docker/
├── scripts/
│
├── config/                      # Django configuration
│   ├── settings/
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   │
│   ├── urls.py
│   └── asgi.py
│
├── src/
│
│   ├── api/                     # Django Ninja API layer
│   │
│   │   ├── router.py
│   │   ├── dependencies.py
│   │
│   │   └── endpoints/
│   │       ├── workflows.py
│   │       ├── nodes.py
│   │       ├── comments.py
│   │       ├── projects.py
│   │       └── users.py
│   │
│   ├── application/             # Application use cases / orchestration
│   │
│   │   ├── services/
│   │   │   ├── workflow_service.py
│   │   │   ├── node_service.py
│   │   │   ├── comment_service.py
│   │   │   └── permission_service.py
│   │   │
│   │   ├── commands/            # Write operations
│   │   │   ├── create_workflow.py
│   │   │   ├── update_node.py
│   │   │   └── add_comment.py
│   │   │
│   │   └── queries/             # Read operations
│   │       ├── get_workflow.py
│   │       ├── list_project_workflows.py
│   │       └── search_nodes.py
│   │
│   ├── domain/                  # Pure business logic (NO Django imports)
│   │
│   │   ├── models/
│   │   │   ├── workflow.py
│   │   │   ├── node.py
│   │   │   ├── edge.py
│   │   │   ├── outcome.py
│   │   │   └── comment.py
│   │   │
│   │   ├── value_objects/
│   │   │   ├── workflow_id.py
│   │   │   ├── node_position.py
│   │   │   └── tag_name.py
│   │   │
│   │   ├── services/
│   │   │   ├── workflow_graph_service.py
│   │   │   └── outcome_link_service.py
│   │   │
│   │   └── exceptions.py
│   │
│   ├── infrastructure/          # Django and external systems
│   │
│   │   ├── orm/
│   │   │
│   │   │   ├── models/          # Django ORM models
│   │   │   │   ├── workflow_model.py
│   │   │   │   ├── node_model.py
│   │   │   │   ├── edge_model.py
│   │   │   │   ├── comment_model.py
│   │   │   │   └── outcome_model.py
│   │   │   │
│   │   │   ├── repositories/    # Persistence layer
│   │   │   │   ├── workflow_repository.py
│   │   │   │   ├── node_repository.py
│   │   │   │   └── comment_repository.py
│   │   │   │
│   │   │   └── mappers/         # Domain ↔ ORM conversions
│   │   │       ├── workflow_mapper.py
│   │   │       └── node_mapper.py
│   │   │
│   │   ├── cache/
│   │   │   └── redis_cache.py
│   │   │
│   │   └── messaging/
│   │       └── event_bus.py
│   │
│   ├── schemas/                 # Pydantic API schemas
│   │
│   │   ├── workflow_schema.py
│   │   ├── node_schema.py
│   │   ├── comment_schema.py
│   │   └── user_schema.py
│   │
│   ├── realtime/                # Websocket collaboration layer
│   │
│   │   ├── events/
│   │   │   ├── workflow_events.py
│   │   │   └── lock_events.py
│   │   │
│   │   ├── managers/
│   │   │   ├── connection_manager.py
│   │   │   └── workflow_channel_manager.py
│   │   │
│   │   └── websocket_router.py
│   │
│   └── utils/
│       ├── time.py
│       └── ids.py
│
└── tests/
    ├── api/
    ├── application/
    ├── domain/
    └── infrastructure/
```

---

# Django Boundary

Django appears only in two areas:

### 1. API Layer

```
src/api/
```

Contains:

- Django Ninja routers
- request parsing
- authentication hooks

---

### 2. Infrastructure Layer

```
src/infrastructure/orm/
```

Contains:

- Django ORM models
- repositories
- persistence mappings

---


# Non-Negotiable Boundary Rules

These rules define how Django is allowed to participate in the backend.

## Allowed Django Usage

Django is allowed only in the following concerns:

- HTTP transport
- authentication / authorization integration
- ORM persistence
- migrations
- admin
- framework bootstrapping and configuration

## Forbidden Django Leakage

The following are not allowed:

- domain code importing Django
- application services importing Django ORM models directly
- business rules implemented in Django models
- workflow orchestration implemented in views
- serializer `.save()` used as the primary application workflow
- ad hoc ORM queries scattered across endpoints

## Required Dependency Direction

Dependency direction must remain:

```text
api -> application -> domain
api -> application -> ports
infrastructure -> domain
infrastructure -> application ports

Never:

domain -> Django
domain -> ORM models
application -> Django views/serializers/models



Persistence Rule

All persistence access must be mediated through repository or gateway interfaces owned by the application layer and implemented in infrastructure.

Application code may depend on repository interfaces.
Application code must not depend on Django model classes.

Mapping Rule

ORM models are persistence shapes.
Domain models are business shapes.

Translation between them must happen in dedicated mappers or repository adapters.
Do not pass Django ORM instances into domain logic.

Endpoint Rule

API endpoints are transport adapters only.

They may:

parse requests
authenticate users
call application handlers
map results to response DTOs

They must not:

contain business rules
coordinate multi-step workflows inline
directly encode persistence strategy
become the source of truth for domain invariants


# Pure Python Layers

These layers must **never import Django**.

```
src/domain/
src/application/
```

This ensures:

- domain logic is framework-independent
- easier testing
- future portability

---

# Data Flow Example

```
HTTP Request
    ↓
API Endpoint (Ninja)
    ↓
Application Service
    ↓
Domain Model / Domain Service
    ↓
Repository
    ↓
Django ORM
    ↓
PostgreSQL
```

---

# Why This Layout Works Well for LLM Coding Tools

1. Files are small and focused.
2. Responsibilities are explicit.
3. Import paths reveal architecture.
4. Business logic is easy to locate.
5. Side effects are centralized in services.

This structure significantly improves **agent navigation and code generation reliability**.


# Example Vertical Slice: Create Workflow

This example shows the intended backend execution path for a normal write operation.

## Flow

```text
POST /api/workflows
    -> api/endpoints/workflows.py
    -> application/commands/create_workflow.py
    -> application/services/workflow_service.py
    -> domain/models/workflow.py
    -> application/ports/workflow_repository.py
    -> infrastructure/orm/repositories/workflow_repository.py
    -> infrastructure/orm/mappers/workflow_mapper.py
    -> Django ORM model
    -> PostgreSQL
Responsibility by Layer
API Layer

Receives the HTTP request and validates transport-level payload shape.

Example responsibilities:

parse request body
identify authenticated user
call application command handler
convert result to response schema

The API layer must not decide domain rules such as whether the workflow subtype is valid for a given project policy.

Application Layer

Coordinates the use case.

Example responsibilities:

construct the command object
invoke permission checks via ports/services
call domain factories or domain services
persist via repository interface
return a result DTO

The application layer owns workflow orchestration, not Django views and not serializers.

Domain Layer

Owns business meaning and invariants.

Example responsibilities:

validate workflow subtype invariants
enforce naming / status / structural rules
define aggregate behavior
expose domain methods, not persistence details

The domain layer must remain pure Python.

Infrastructure Layer

Implements persistence and framework integration.

Example responsibilities:

implement repository interfaces
map domain objects to ORM rows
execute transactions
integrate with Django ORM

Infrastructure must not become a second application layer.

Pseudocode Shape
# api/endpoints/workflows.py
def create_workflow(request, payload):
    command = CreateWorkflowCommand(
        title=payload.title,
        workflow_type=payload.workflow_type,
        project_id=payload.project_id,
        actor_id=request.user.id,
    )
    result = workflow_service.create_workflow(command)
    return WorkflowResponseSchema.model_validate(result)
# application/services/workflow_service.py
def create_workflow(command: CreateWorkflowCommand) -> WorkflowDTO:
    project = project_repository.get(command.project_id)
    workflow = Workflow.create(
        title=command.title,
        workflow_type=command.workflow_type,
        project_id=project.id,
    )
    saved = workflow_repository.save(workflow)
    return WorkflowDTO.from_domain(saved)
Anti-Pattern to Avoid

Do not collapse this into:

APIView -> Serializer -> Model.save()

That pattern hides business workflow inside transport and persistence layers and makes future extraction much harder.
