# Cursor / agent instructions (project)

Use this file as a **paste-in appendix** for Cursor chat or cloud prompts. **Authoritative machine-readable rules** for the workspace also live under [`.cursor/rules/`](../.cursor/rules/).

## Functional behavior vs architecture

| Layer | Source of truth | Path |
| ----- | ----------------- | ---- |
| **What the app should do** (UI, workflows, permissions, forms) | Functional requirements | [`tests/docs/requirements/`](../tests/docs/requirements/) |
| **How the system is built** (API, graph state, repos, OpenAPI) | Architecture ADRs | [`docs/architecture/`](architecture/) |
| **Workflow / node / link terminology** (parent workflow vs `node_type` vs `linked_workflow`) | ADR + FR glossary | [`docs/architecture/adr_workflow_hierarchy_and_linked_nodes.md`](architecture/adr_workflow_hierarchy_and_linked_nodes.md), [`tests/docs/requirements/terminology_workflow_hierarchy_and_nodes.md`](../tests/docs/requirements/terminology_workflow_hierarchy_and_nodes.md) |
| **Typed meta tables** (`*meta` on workflow vs node; no `programmeta` on nodes) | ADR | [`docs/architecture/adr_node_and_workflow_typed_meta.md`](architecture/adr_node_and_workflow_typed_meta.md) |
| **How browser tests are written** | Testing policy | [`tests/docs/testing/`](../tests/docs/testing/) |

When refactoring or debugging behavior, **read the relevant feature requirement under `tests/docs/requirements/`** (start with `original/*_requirements_v1.yaml` and `guidelines_functional_requirements.md`) before inferring intent from code alone.

See: [ADR: Functional requirements source of truth](architecture/adr_functional_requirements_source_of_truth.md) and [`.cursor/rules/functional-requirements-source-of-truth.mdc`](../.cursor/rules/functional-requirements-source-of-truth.mdc).

## Preserve developer comments

- **Do not delete or remove** developer comments, questions, uncertainty notes (e.g. “not sure about this”), TODOs, or FIXMEs—unless the user **explicitly** asks to remove or rewrite them.
- **Do not** assume such comments are obsolete or irrelevant.
- **Allowed:** add new comments when useful; **edit comments only** when a code change makes the old wording factually wrong (e.g. after a rename). When in doubt, **keep the comment** or ask the user.

See also: [`.cursor/rules/preserve-developer-comments.mdc`](../.cursor/rules/preserve-developer-comments.mdc).
