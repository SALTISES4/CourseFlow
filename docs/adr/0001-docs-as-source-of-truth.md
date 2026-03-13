# ADR 0001: Documentation as a First-Class Source of Truth for Humans and Coding Agents

## Status

Proposed

---

## Context

CourseFlow is a large full-stack system composed of:

- a Django backend
- a React frontend
- websocket-based realtime collaboration
- a complex workflow / micro-step authoring model
- permission and locking systems
- several layers of DTOs, serializers, and API contracts

Much of the architectural intent of the system is currently **implicit in the codebase** rather than documented in a structured form.

As a result:

### For Humans

Engineers onboarding to the project must reverse-engineer:

- where workflow logic lives
- which APIs own which data transformations
- how websocket events interact with REST persistence
- which serializers represent external contracts vs internal DTOs
- how workflow invalidation propagates through parent/child relationships

This slows onboarding and increases the risk of accidental architectural drift.

### For Coding Agents (Cursor, Copilot, Codex, etc.)

LLM coding assistants perform significantly worse when architecture is not explicitly documented.

Without a structured documentation context, coding agents frequently:

- place logic in the wrong architectural layer
- introduce duplicate workflow mutation paths
- misunderstand serializer / DTO boundaries
- break websocket synchronization assumptions
- add state to the frontend that should remain server-authoritative

These mistakes create **hidden architectural debt** that accumulates over time.

Experience from prior projects indicates that providing a **structured documentation pack designed explicitly for coding agents** materially improves implementation quality.

---

## Decision

CourseFlow will maintain a **first-class `docs/` directory** that serves as the canonical architectural reference for:

- human developers
- LLM coding assistants
- future maintainers of the platform

The documentation structure will intentionally expose:

### 1. Architecture

High-level system structure.

Examples:

- backend service map
- frontend architecture
- realtime event graph
- data model relations

### 2. Data Contracts

Explicit definitions of:

- API request/response DTOs
- serializer boundaries
- persistence models

This reduces accidental contract drift between backend and frontend.

### 3. Runtime Flows

Operational flows through the system.

Examples:

- workflow editing lifecycle
- websocket update propagation
- workflow invalidation events
- locking and presence mechanics

These flows clarify **what triggers what** inside the system.

### 4. Conventions

Rules for:

- naming patterns
- where new logic belongs
- serializer usage
- DTO creation
- websocket event handling
- frontend state ownership

These rules exist to prevent architectural entropy.

### 5. Runbooks

Operational documentation for:

- deployments
- websocket troubleshooting
- realtime sync debugging
- cache invalidation
- migration handling

### 6. Architecture Decision Records (ADRs)

Significant design decisions will be recorded as ADRs.

Examples include:

- websocket collaboration architecture
- workflow persistence model
- serializer boundary design
- permission enforcement strategy

ADRs prevent future developers from unknowingly reversing intentional decisions.

### 7. LLM Context Pack

A subset of documentation designed specifically for coding agents, typically including:

- `architecture_overview.md`
- `backend_service_map.md`
- `frontend_state_and_dataflow.md`
- `api_endpoint_matrix.md`
- `serializer_dto_contracts.md`
- `data_model_relations.md`
- `realtime_event_graph.md`
- `llm_editing_rules.md`

These files are intentionally structured to improve **LLM context retrieval and reasoning** during code generation tasks.

---

## Consequences

### Positive

- Faster onboarding for new developers.
- Reduced architectural drift.
- Better code placement decisions during feature development.
- Stronger context for AI coding assistants.
- Easier debugging of realtime collaboration issues.
- Clearer separation between persistence, API contracts, and frontend state.

### Negative

- Documentation must now be actively maintained.
- Outdated documentation can mislead both humans and coding agents.
- PRs that change system architecture will require documentation updates.

---

## Enforcement

Documentation updates are expected when a pull request:

- introduces a new architectural component
- modifies a core workflow flow
- changes API request/response contracts
- alters websocket event behavior
- introduces new domain models or relations

PRs that significantly affect architecture should include updates to the relevant documents in `docs/`.

Failure to update documentation in these cases should be treated as incomplete implementation.

---

## Notes

The documentation structure is not intended to replace inline code documentation.

Instead, it provides **system-level context** that is difficult to reconstruct purely from code navigation.

Maintaining this context ensures that both humans and AI tooling can operate within the intended architecture of CourseFlow.
