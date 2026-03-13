# CourseFlow Backend Repository Layout

This structure separates **transport, application logic, domain logic, and infrastructure**.
The goal is to keep business logic independent of Django while still using Django for routing, ORM, and platform services.

---

# Top-Level Structure

```
courseflow/
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
