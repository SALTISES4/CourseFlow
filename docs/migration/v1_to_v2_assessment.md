# CourseFlow v1 to v2 content migration: assessment and phased plan

**Status:** Discovery draft  
**Date:** 2026-11-06  
**Scope:** User-initiated import of legacy projects and workflows into CourseFlow v2.  
**Not authorized by this document:** Live database access, deployment changes, worker infrastructure, or production data mutation.

## Executive assessment

A robust import is feasible, but it is not a thin wrapper around the existing v1 export feature. The existing exporter is intended to produce human-readable Excel and CSV documents. It flattens or omits data required to reconstruct a v2 graph and therefore is not a safe migration contract.

The recommended design is:

```text
read-only v1 source
    -> legacy source adapter
    -> versioned canonical snapshot
    -> validation and mapping report
    -> transactional v2 aggregate writer
    -> persisted import item result and provenance
```

The direct-database and file-based approaches should share the canonical snapshot, validator, and writer. This prevents a second migration implementation if database connectivity changes later.

Do not import the v1 Django models into the v2 Django process. Both applications own incompatible Django model graphs and settings. The v1 boundary should be an infrastructure adapter using explicit read-only queries or a separately generated snapshot bundle.

## Evidence reviewed

### CourseFlow v1

- `course_flow/models.py`: legacy projects, multi-table workflow types, weeks, columns, nodes, outcome relations, permissions, and live-project entities.
- `course_flow/export_workflow.py`: presentation-oriented workflow Excel/CSV export.
- `course_flow/export_functions.py`: outcomes, nodes, frameworks, matrices, and analytics exports.
- `course_flow/tasks.py` and `course_flow/celery.py`: Celery tasks and synchronous fallback behavior.
- `course_flow/import_functions.py`: spreadsheet-oriented node and outcome imports.

### CourseFlow v2

- `course_flow/core/models/`: canonical v2 persistence model.
- `docs/architecture/repository_layout.md`: intended API/application/infrastructure boundaries.
- `docs/architecture/adr_workflow_hierarchy_and_linked_nodes.md`: workflow and node type invariants.
- `docs/architecture/adr_node_and_workflow_typed_meta.md`: typed metadata ownership.
- `tests/docs/requirements/features/workflow/workflow_duration_requirements_v1.yaml`: accepted duration rules and unresolved legacy-duration policy.
- `course_flow/application/services/workflow_copy_service.py`: useful graph-copy mechanics, but currently coupled directly to Django ORM and not a legacy import boundary.

### Non-production sample database

The repository's December 2023 SQLite sample contains 3 users, 2 projects, and 17 workflows. Ten workflows have no project. This is not evidence of production distributions, but it confirms that standalone workflows are a real shape that the catalog and destination rules must support.

## Major risks and failure modes

| Risk | Severity | Why it matters | Required control |
| --- | --- | --- | --- |
| Email-only account matching authorizes the wrong user | Critical | v1 uses the stock Django user email field, which is not unique by default; v2 does not currently record verified-email state | Persist an explicit legacy-account link; block blank, duplicate, or ambiguous normalized emails; require an administrative or equivalent trusted linking procedure until verified email is implemented |
| Unsupported duration values are silently changed | Critical | v1 stores `time_required` as free-form text and supports units that the accepted v2 duration contract does not | Inventory production values; classify exact mappings; block incompatible values unless a product-approved transformation exists |
| Presentation export loses graph data | Critical | Excel/CSV output is not a complete or versioned representation of the v1 aggregate | Use a canonical machine-readable snapshot with an explicit schema version |
| Duplicate imports create indistinguishable copies | High | retries, double clicks, and worker redelivery can repeat destination writes | Persist source provenance and an item-level idempotency key; make retry resume or return the prior result |
| One bad workflow rolls back a large batch | High | projects can contain many workflows and source data may contain isolated corruption | Commit one top-level item per transaction; retain partial batch results; retry failed items independently |
| Cross-workflow links target unselected content | High | v1 nodes can link to another workflow | Preflight dependencies; remap links within a project import; define an explicit sever/resolve policy for individual workflow imports |
| Source data changes during extraction | High | a project could be read across multiple inconsistent queries | Read from a stable clone/snapshot or use a read-only repeatable-read transaction and record a source fingerprint |
| Source schema drifts from the reference checkout | High | the running v1 database and `cfv1/staging` code may not be at the same migration level | Record and validate the legacy schema/migration version before enabling imports |
| Worker/broker is treated as the source of job truth | High | broker results expire and workers can restart | Store batch/item status and progress in PostgreSQL; the queue only delivers work |
| Live source connectivity increases blast radius | High | v2 staging is intentionally isolated from legacy infrastructure | Prefer a read-only clone in an approved network boundary or signed snapshot bundles; do not expose the legacy production database to a public host |
| Unsupported legacy domains are imported accidentally | Medium | permissions, comments, live assignments, notifications, and deleted content have different or absent v2 semantics | Define an explicit initial exclusion list and report exclusions to the user |

## Existing exporter assessment

The current v1 `get_workflows_export()` output is useful for a visual archive, not restoration. It primarily emits workflow title/description/ponderation, weeks, node display text, columns, and flattened outcome text. It does not provide a stable, complete contract for:

- project and workflow provenance;
- workflow subtype and typed metadata fidelity;
- node-local versus linked-workflow metadata;
- a complete outcome tree and horizontal-link graph;
- node-outcome link semantics;
- edge identity and full relationship mapping;
- project tag/object-set definitions and assignments;
- legacy relationship anomalies and validation errors;
- idempotent re-import.

The v1 exporter and serializers remain useful for discovering display transformations, legacy default colours, and effective-value behavior. They should be reference inputs to mapping tests, not runtime dependencies.

## Recommended boundaries

### 1. Legacy account linking

Create an explicit link between one v2 user and one v1 user for a named source system. Store the legacy user primary key, normalized email observed at link time, link status, who established the link, and timestamps.

Automatic linking is permitted only when all approved identity conditions hold. A case-insensitive email match alone is insufficient with the current authentication model.

### 2. Legacy catalog gateway

Expose lightweight, read-only project and workflow summaries for the linked legacy identity. This gateway owns v1 schema knowledge and returns application-owned data objects. It must not return v1 ORM instances.

The initial eligibility policy should be conservative:

- include active content the linked v1 user authored;
- show workflows nested under their legacy project and standalone workflows separately;
- do not include shared-only content until the ownership/permission policy is approved;
- do not include strategies, live-project state, assignments, deleted content, comments, notifications, or favourites in the initial phase.

Project ownership does not automatically settle whether collaborator-authored workflows inside that project may be copied. That requires a product/data-governance decision.

### 3. Canonical snapshot contract

Use a versioned, machine-readable snapshot independent of v1 ORM and v2 ORM types. A project snapshot contains its workflow snapshots; an individual workflow snapshot uses the same workflow shape.

The snapshot should contain:

- source-system identifier, schema version, source IDs/hashes, and extraction timestamp;
- project/workflow metadata and legacy flags needed by validation;
- ordered weeks/sections, columns/channels, and placement relations;
- nodes, typed values, linked-workflow source identity, and tags/object sets;
- edges;
- the outcome tree, horizontal relationships, and node assignments;
- a deterministic content fingerprint.

Keep raw legacy values in the snapshot. Mapping happens after extraction so validation can explain an unsupported value without losing evidence.

### 4. Validator and mapper

The validator returns structured blockers, warnings, and informational exclusions. It must detect at least:

- unknown or ambiguous account link;
- source schema/version mismatch;
- missing or multiple project membership where destination semantics require one;
- orphan or multiply placed nodes;
- missing/deleted columns or weeks referenced by active nodes;
- outcome cycles, invalid parentage, duplicate sibling positions, or over-deep legacy shapes;
- edges with missing endpoints or unsupported port values;
- links to workflows outside the selected import closure;
- title/code values exceeding v2 limits;
- unknown classifications or time units;
- non-numeric, ranged, fractional, or otherwise incompatible duration values;
- disciplines that cannot be mapped to the fixed v2 catalogue.

Warnings must not be used for data loss. Any value that would be discarded or materially changed is a blocker until a documented policy says otherwise.

### 5. V2 aggregate writer

The writer owns destination invariants and is accessed through an application port. It creates a private, active project/workflow owned or authored by the importing v2 user and writes one top-level item atomically.

The importer should not call HTTP endpoints internally. It should share destination-domain creation primitives with normal v2 use cases, or introduce a dedicated repository that enforces the same invariants.

### 6. Job and provenance persistence

Persist the business state independently of the queue implementation.

Proposed records:

- `LegacyAccountLink`: trusted v2-to-v1 identity link.
- `LegacyImportBatch`: requester, lifecycle status, totals, timestamps, and source contract version.
- `LegacyImportItem`: selected source identity/type, destination option, status, attempts, warnings/errors, and resulting v2 UUIDs.
- `LegacyProjectImport` and `LegacyWorkflowImport` (or equivalent typed provenance): source identity/hash, destination identity, snapshot fingerprint, and import version.

Avoid a generic unvalidated JSON status blob as the only record. Structured columns are required for querying, constraints, support, and retry decisions; JSON may supplement them with diagnostic detail.

## Initial mapping assessment

| V1 source | V2 target | Confidence | Initial rule or unresolved issue |
| --- | --- | --- | --- |
| `Project` | `Project` | High | New UUID; importing user becomes owner; import as private, active, non-template |
| `Workflow` + `Activity`/`Course`/`Program` subtype | `Workflow` + `Graph` + typed meta | High | Derive `workflow_type` from the actual subtype; do not copy publication/public-link state |
| `WorkflowProject.rank` | No current equivalent | High | Workflow order cannot currently be preserved; report this as an intentional exclusion or add a destination concept first |
| `Week` + `WeekWorkflow.rank` | `Section.position` | High | Preserve order/title; v1 `week_type` and description have no direct v2 fields |
| `Column` + `ColumnWorkflow.rank` | `Channel.position` | High | Preserve title/order/colour; map known legacy column types to stable system-label codes; validate malformed colours |
| `Node` + `NodeWeek.rank` | `Node` | High | Place by section and channel; derive v2 `node_type` from parent workflow hierarchy rather than copying the legacy integer label |
| `NodeLink` | `Edge` | Medium | Map dashed to `line_type`, title/text position, and legacy numeric ports to approved v2 port identifiers |
| `OutcomeWorkflow` + `OutcomeOutcome` | `Outcome.parent` + `order` | High | Reconstruct and validate one tree per workflow |
| `OutcomeNode` | `NodeOutcome` | Medium | v1 stores derived ancestor links and `degree`; determine which links are canonical before dropping `degree` |
| `OutcomeHorizontalLink` | `Horizontaloutcome` grouping | Low | Semantics are not one-to-one; requires fixture-based mapping and product verification |
| `ObjectSet` + assignments | `Tag` + assignments | Medium | Likely mapping, but v1 `term`, `title`, and plural fields do not align exactly with v2 label/plural fields |
| workflow/node time and classification fields | typed meta tables | Medium | Numeric classifications have known mappings; duration conversion remains blocked by accepted FR-WF-DURATION rules |
| `linked_workflow` | `Node.linked_workflow` | High for project import | Remap to imported target; individual workflow behavior requires an approved dependency policy |
| comments, permissions, favourites, notifications | Excluded initially | High | These are not content-fidelity fields and have different identity/authorization consequences |
| live projects and assignments | Excluded initially | High | No equivalent v2 runtime domain is currently in scope |

## Background execution assessment

Batch import needs asynchronous execution eventually, but choosing Celery is not the first architectural decision.

Facts about the current v2 repository:

- no production worker or broker is configured;
- local and AWS Docker Compose define Django and PostgreSQL but no queue service;
- staging runs Django and Caddy on one EC2 host;
- Django 6's task API is installed, but its built-in backends in this environment are immediate and dummy backends, not a production worker;
- v1's `try_async` decorator can fall back to running work synchronously in the request process, which is unacceptable for large imports.

Recommendation:

1. Define an application-owned task-dispatch port and persist import state first.
2. Build deterministic single-item execution that can run from tests and a management command.
3. Size real source data and measure representative imports.
4. Select and document a production backend (Celery with an approved broker is a reasonable candidate, but it adds deployment, health, retry, and observability responsibilities).
5. Never use synchronous fallback in a user request when the async backend is unavailable; return a service-unavailable response and leave the persisted item safely queueable.

If Celery is selected, use late acknowledgement only with idempotent item execution, bounded retries with backoff, explicit time limits, worker health checks, and graceful shutdown behavior. Celery result storage must not replace PostgreSQL import records.

## Proposed API surface (not yet ratified)

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/legacy-import/catalog` | List eligible v1 projects and workflows plus prior-import state |
| `POST` | `/api/legacy-import/preflight` | Validate a proposed selection and destination options without creating v2 content |
| `POST` | `/api/legacy-import/batches` | Persist a batch and enqueue its items |
| `GET` | `/api/legacy-import/batches/{uuid}` | Read progress and item-level results |
| `POST` | `/api/legacy-import/batches/{uuid}/items/{itemUuid}/retry` | Retry one failed item without duplicating successful items |

The API layer should remain thin. Catalog, preflight, submission, execution, and retry are separate application use cases.

## Phased delivery plan

### Phase 0: Production inventory and policy decisions

Deliverables:

- read-only, aggregate-only inventory queries against a clone or approved source;
- v1 schema/migration version confirmation;
- normalized-email collision and blank-email counts;
- counts and size distributions for projects, standalone workflows, workflows per project, sections, channels, nodes, edges, outcomes, horizontal links, object sets, and linked workflows;
- anomaly counts for orphan/multiply linked data;
- complete duration/classification/unit value distributions without exposing authored text;
- written decisions for the blocking questions below.

Exit gate: no critical mapping category remains unknown, and no implementation assumes the small repository sample represents production.

### Phase 1: Contract, fixtures, validator, and deterministic writer

Deliverables:

- canonical snapshot schema v1;
- golden legacy fixtures covering activity, course, program, standalone workflow, linked workflow, outcomes, edges, tags, and corrupt-data cases;
- pure mapping tests for every enum and relationship;
- preflight report contract;
- single-item writer exercised against a test v2 database;
- reconciliation report comparing source counts/relations with destination counts/relations.

Exit gate: repeated execution of the same import item cannot create duplicates, and all intentional exclusions are visible in the result.

### Phase 2: Read-only source catalog and trusted account links

Deliverables:

- account-link persistence and administration workflow;
- source gateway configured with least-privileged credentials;
- catalog and preflight API endpoints;
- audit logging and rate/size limits;
- failure behavior when the legacy source is unavailable.

Exit gate: a user can see only content authorized by the approved eligibility policy, and source access performs no writes.

### Phase 3: Controlled single-item import

Deliverables:

- feature-flagged import of one workflow or project;
- persisted provenance and destination links;
- per-item atomicity and support diagnostics;
- manual/management-command execution path for controlled rollout.

Exit gate: representative production-clone items reconcile successfully, including restart and retry tests.

### Phase 4: Durable batch execution and user progress

Deliverables:

- selected production task backend and infrastructure;
- multi-item batches with bounded concurrency;
- item-level progress, partial-success presentation, and safe retry;
- worker health, queue depth, duration, failure, and stale-job observability;
- deployment and rollback runbooks.

Exit gate: worker termination/redelivery testing proves that completed items are not duplicated and interrupted items resume or retry safely.

### Phase 5: Rollout and optional fidelity expansion

Deliverables:

- limited cohort rollout and reconciliation sampling;
- operational support process;
- decisions on shared content, comments, contributors, live-project data, and any re-import/update feature;
- retirement plan for legacy access only after migration objectives are met.

## Blocking product and operational decisions

1. What proves a v1-to-v2 account link: administrator approval, a one-time code delivered through the legacy account, verified email in both systems, or another identity source?
2. Does "my content" mean authored content only, content the user can edit, or any content the user can view? For project imports, may the project owner import collaborator-authored workflows?
3. When importing an individual workflow, must the user choose an existing v2 project, create a new project, or may a v2 workflow remain projectless?
4. When an individual workflow links to an unselected workflow, should preflight require importing the dependency, sever the link with explicit warning, or block the import?
5. Are repeated imports prohibited, allowed only as explicit copies, or expected to update an earlier imported object? Update-in-place is materially more complex than copy-once.
6. What is the approved transformation for v1 free-form/ranged durations and unsupported units? The current accepted duration requirements explicitly prohibit silent rounding or truncation.
7. Are archived/deleted content, strategies, shared permissions, collaborators, comments, favourites, notifications, and live-project/assignment state intentionally excluded from the first release?
8. Will v2 read a live legacy database, a read-only replica/clone, or versioned snapshot bundles? Where will that source reside relative to the isolated v2 VPC?
9. What retention and deletion rules apply to source snapshots, validation reports, errors, and provenance records?
10. Which production task backend and broker are acceptable operationally, and what import size/latency target should it meet?

## Immediate next work

The next safe implementation step is Phase 0 inventory tooling against an approved clone, followed by the canonical snapshot schema and golden fixtures. Adding Celery, UI routes, or destination ORM models before the identity and data-loss policies are resolved would create rework and could make an unsafe design appear complete.
