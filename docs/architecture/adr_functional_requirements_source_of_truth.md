# ADR: Functional requirements live in `tests/docs/requirements`

**Status:** Accepted  
**Scope:** Product behavior, refactoring, debugging, AI-assisted implementation, test generation

## Context

The project maintains architecture ADRs and guides under `docs/architecture/` for:

- API contracts and OpenAPI workflow
- Backend layout, graph mutations, concurrency
- Frontend client generation and graph/editor state ownership

Those documents intentionally describe **implementation and structural decisions**, not complete **end-user functional behavior** (permissions, sidebar tabs, drag-and-drop rules, form fields, error messages, etc.).

Functional behavior has been authored and maintained under `tests/docs/requirements/` as the upstream input for Playwright and QA. That corpus was treated as “test input,” but it is effectively the **only consolidated specification of what the application should do** in the UI.

Without an explicit ADR and agent instructions, refactoring and debugging tasks tend to rely on reading implementation code or guessing intent, which diverges from the requirement documents the team already maintains.

## Decision

1. **`tests/docs/requirements/` is the source of truth for product / UI functional behavior** when determining correct behavior during implementation, refactoring, and debugging—not only when generating browser tests.

2. **`docs/architecture/` remains the source of truth for technical architecture** (HTTP shape, persistence, graph canonical model, codegen policy). It must not be used to infer unspecified UI behavior.

3. **`tests/docs/testing/` governs test authoring and generation policy only.** It does not define product requirements.

4. **Cursor / agent workflows** must consult `tests/docs/requirements/` per [`.cursor/rules/functional-requirements-source-of-truth.mdc`](../../.cursor/rules/functional-requirements-source-of-truth.mdc) and [docs/cursor_prompt.md](../cursor_prompt.md).

### Document precedence (functional behavior)

1. Feature-specific documents in `tests/docs/requirements/` (e.g. `original/*_requirements_v1.yaml`)
2. `tests/docs/requirements/guidelines_functional_requirements.md`
3. Normalized requirement examples where they exist for the feature
4. Architecture docs and code (only to the extent they do not contradict (1)–(3); if code disagrees with FRs, treat it as a bug or outdated implementation until requirements are updated)

### What belongs in `tests/docs/requirements/`

- Observable user and system behavior
- Roles, permissions, preconditions, triggers, acceptance criteria
- UI-domain terminology and feature scope

### What does not belong there (use `docs/architecture/` instead)

- Debounce timings, Redux slice layout, OpenAPI field naming
- Repository boundaries, migration strategy, optimistic-op overlay design

See `tests/docs/README.md` for the split between `requirements/` and `testing/` folders.

## Consequences

**Positive**

- Refactors and bug fixes can be validated against written intent instead of code archaeology.
- Test specs and implementation work share one behavioral baseline.
- AI agents have an explicit, searchable location for “what should happen.”

**Discipline**

- When behavior changes by product decision, update the relevant requirement document (and changelog/traceability within that doc), not only code.
- When requirements are wrong or obsolete, update the FR before “fixing” code to match old tests.
- New features should add or extend requirement artifacts under `tests/docs/requirements/` before large implementation deltas are considered complete.

## References

- Index: [`tests/docs/README.md`](../../tests/docs/README.md)
- FR authoring: [`tests/docs/requirements/guidelines_functional_requirements.md`](../../tests/docs/requirements/guidelines_functional_requirements.md)
- Normalization (test pipeline): [`tests/docs/requirements/adr_requirement_normalization_for_test_generation.md`](../../tests/docs/requirements/adr_requirement_normalization_for_test_generation.md)
- Agent rule: [`.cursor/rules/functional-requirements-source-of-truth.mdc`](../../.cursor/rules/functional-requirements-source-of-truth.mdc)
