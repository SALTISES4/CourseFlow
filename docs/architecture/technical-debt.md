# Architecture technical debt

This register records known architectural weaknesses that are not yet resolved by
an accepted ADR or implementation. It is not a delivery-status tracker. Issue
priority, assignment, and release status belong in the project-management system.

## TD-0001 — Workflow Overview rollups repeatedly traverse linked hierarchies

**Status:** Open

**Recorded:** 2026-11-26

**Affected area:** Workflow detail reads and updates; automatic Time,
Ponderation, Credits, and Classification rollups

**Risk:** Potentially high for wide or deeply linked workflow hierarchies;
production impact has not been measured

### Problem

Workflow Overview automatic values are calculated synchronously while a workflow
detail DTO is constructed. The calculated result is not a persisted projection.
Every detail request that reaches `DjangoWorkflowRepository` calls
`_overview_metadata()` again.

For a program workflow with every automatic field enabled, the current
implementation traverses the program's nodes separately for:

1. total Time;
2. Theory ponderation;
3. Practical ponderation;
4. Individual ponderation;
5. Credits; and
6. General/Specific Classification.

Each traversal creates and evaluates a new node query. When a node has a linked
workflow, `_effective_node_values()` recursively calculates the linked workflow's
Overview metadata. A linked course may in turn calculate Time from linked
activities, and an activity may calculate Time from its task nodes.

The `calculated_workflow_ids` set prevents infinite recursion along the active
call stack, but it is not a result cache. An identifier is removed when that call
returns, so the same linked workflow can be recalculated:

- for each enabled aggregate pass;
- when multiple nodes link to it; and
- when frontend views request the parent and linked workflow details separately.

The update path compounds the cost. `PATCH /api/workflow/{uuid}` loads the
workflow for authorization, `WorkflowService.update_by_workflow_uuid()` loads it
again, and `DjangoWorkflowRepository.update()` constructs a calculated detail DTO
for the response.

Workflow list and relationship-list queries explicitly use
`calculate_overview=False`; the debt applies to detail construction, including
authenticated and public workflow detail responses.

### Evidence boundary

The behavior above is established by static source inspection and existing
functional tests. No production query profile, hierarchy-size distribution,
latency measurement, or failure incident is currently attached. This entry must
not be cited as proof that current production requests are slow.

Relevant implementation:

- `course_flow/infrastructure/repositories/django_workflow_repository.py`
  (`_overview_metadata`, `_effective_node_values`, `_sum_effective_node_value`,
  `_to_dto`, and `update`)
- `course_flow/application/services/workflow_service.py`
  (`update_by_workflow_uuid`)
- `course_flow/api/routers/workflows.py` (`get_workflow` and `update_workflow`)
- `course_flow/tests/test_workflow_overview_api.py`
  (`test_program_automatic_fields_use_local_and_linked_course_metadata`)

### Failure modes and operational concerns

- **Query amplification:** work grows with enabled aggregate count, hierarchy
  width, hierarchy depth, and repeated links rather than with unique workflows
  alone.
- **Repeated computation:** linked workflow values are recalculated instead of
  reused within one request.
- **Read latency variance:** the cost of a nominally simple workflow-detail read
  depends on the size and configuration of the entire reachable linked hierarchy.
- **Database load:** repeated ORM traversals can turn concurrent Overview or node
  loads into disproportionate database traffic.
- **Inconsistent read snapshots:** separate aggregate passes can observe different
  committed states when concurrent edits occur, producing totals that never
  existed together in one logical snapshot.
- **Poor observability:** there is no rollup-specific query count, traversal depth,
  unique-workflow count, duration metric, or budget.
- **Weak performance regression protection:** current tests establish calculated
  values but do not bound query count or repeated traversal.

### Recommended direction

Move calculation out of DTO mapping into a dedicated request-scoped Overview
rollup service that:

1. traverses a workflow's effective nodes once and accumulates all enabled totals
   together;
2. memoizes calculated metadata by workflow identity for the duration of the
   request;
3. keeps cycle detection separate from memoization;
4. reuses a linked workflow's calculated value while still contributing it once
   for every referencing node, preserving current sum semantics;
5. bulk-loads or prefetches the required hierarchy metadata rather than issuing a
   fresh node query for every aggregate pass; and
6. exposes bounded metrics for calculation duration, queries, depth, visited
   workflows, and contributing nodes.

Do not introduce persisted/materialized rollups as the first fix. Materialization
would require an explicit invalidation contract covering node edits, link and
unlink operations, linked-workflow edits, archive behavior, imports, copies, and
concurrent updates. It should be considered only if a single-pass, request-scoped
implementation remains too expensive after measurement.

### Closure criteria

This debt can be closed only when all of the following are true:

- each unique reachable workflow is calculated at most once per detail request;
- each calculated workflow scans its effective nodes at most once per request;
- all enabled automatic fields retain exact integer-minute and credit results;
- multiple references to one linked workflow reuse its calculation but still
  contribute once per referencing node;
- cycle handling terminates deterministically and has focused regression tests;
- workflow update authorization and response construction avoid redundant full
  rollups;
- query-count and hierarchy-depth regression tests cover a program → course →
  activity → task hierarchy and a repeated-link case;
- rollup metrics or structured diagnostics make request cost observable; and
- the requirements and any ADR introduced by the remediation document whether
  calculations are read-time projections or persisted values.

### Non-goals

- Changing the product rules for Time, Ponderation, Credits, or Classification.
- Changing canonical duration storage from integer minutes.
- Treating frontend query caching as a substitute for backend request efficiency.
- Reintroducing or otherwise coupling General/Specific bucket selection to the
  retired legacy classification string; bucket correctness is governed by the
  node-local `specific_education` boolean independently of this performance debt.

## TD-0002 — Staging image publication depends on incomplete ECR authorization

**Status:** Open — temporary runner rollback active

**Recorded:** 2026-11-26

**Affected area:** CircleCI `deploy-aws` job; staging backend image publication;
AWS ECR deployment policy

**Risk:** Medium operational and security risk until the IAM policy is corrected
and the deploy job returns to a current, explicitly dated runner image

### Problem

The CircleCI principal used by the staging deployment can upload backend image
layers to ECR, but its identity-based policy does not allow
`ecr:BatchGetImage`. That action is part of AWS's documented ECR image-push
permission set. The omission became deployment-blocking after the CircleCI
`ubuntu-2404:current` alias moved the `deploy-aws` job from the last known-good
`ubuntu-2404:2025.09.1` image to `ubuntu-2404:2026.11.1`.

The failed job uploaded every reported layer, then failed while publishing the
image metadata with:

> `is not authorized to perform: ecr:BatchGetImage ... because no
> identity-based policy allows the ecr:BatchGetImage action`

The newer runner exposed an authorization defect that was already present. It
did not make the missing IAM permission optional, and rolling the runner back
does not repair the policy.

### Evidence boundary

CircleCI job logs establish the following:

- the previous successful `deploy-aws` job used
  `ubuntu-2404:2025.09.1`;
- the failed job used `ubuntu-2404:2026.11.1`;
- the failed build exported an attestation manifest and manifest list;
- all reported layers were pushed before ECR denied `ecr:BatchGetImage`; and
- the job exited before the later staging deployment and database-rebuild
  commands could run.

This evidence supports the runner transition as the trigger and the missing IAM
action as the direct failure. It does not establish which Docker or BuildKit
component version first changed the registry request sequence.

### Temporary mitigation

Pin only the `deploy-aws` machine executor to the last known-good dated image,
`ubuntu-2404:2025.09.1`. Do not roll back unrelated test or build jobs.

This is a time-limited availability workaround. The older image carries an
increasingly stale operating-system and container-tooling baseline, so it must
not become the permanent deployment environment.

### Failure modes and operational concerns

- **Blocked deployments:** backend image publication can fail after layer upload,
  preventing the remaining staging deployment workflow from running.
- **Floating-runner drift:** using `ubuntu-2404:current` permits an unreviewed
  runner change to alter deployment behavior.
- **Latent authorization coupling:** a deployment succeeds only while the client
  happens not to exercise an ECR action required by the supported push contract.
- **Stale deployment toolchain:** retaining the rollback accumulates security and
  compatibility risk as the dated runner ages.
- **Weak diagnostics:** the job does not currently record Docker engine, Buildx,
  and storage-driver versions needed to compare runner transitions directly.

### Recommended direction

1. Add `ecr:BatchGetImage` to the repository-scoped ECR statement used by the
   CircleCI application-deploy principal in the infrastructure stack.
2. Review the CloudFormation update change set before execution and confirm that
   the intended managed-policy change does not replace or modify unrelated
   staging resources.
3. Move `deploy-aws` to a supported, explicitly dated CircleCI image rather than
   back to the floating `current` alias.
4. Record `docker version`, `docker buildx version`, and the Docker storage driver
   at the start of the deploy job so future runner changes are diagnosable.
5. Remove the rollback only after an image publish and full staging deployment
   succeed with the corrected policy and selected current runner.

### Closure criteria

This debt can be closed only when all of the following are true:

- the deployed CircleCI policy permits `ecr:BatchGetImage` only for the intended
  CourseFlow staging backend repository;
- the infrastructure update is verified not to replace or mutate unrelated
  staging resources;
- `deploy-aws` uses a supported, explicitly dated runner image;
- the job records the Docker and Buildx versions used for publication;
- a staging backend image is published successfully by the CircleCI principal;
- the remaining deployment workflow, including the expected staging database
  rebuild, completes successfully; and
- the temporary `ubuntu-2404:2025.09.1` rollback is removed.
