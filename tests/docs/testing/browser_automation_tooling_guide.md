# Browser Automation Tooling Guide for Test Generation

## Purpose

This document explains how to use browser automation tooling during **test generation, review, and debugging**.

These tools are available to the test-generation workflow and should be used deliberately when they materially improve selector validation, flow verification, or debugging quality.

## Scope boundary

These tools are available for:

- test generation
- generated test review
- generated test debugging
- validating selectors and interaction paths against the implemented UI

These tools are **not** part of the committed Playwright test suite itself.

The final durable artifact remains normal Playwright test code that follows the project's Playwright standards and Playwright best practices.

## Available tooling

The following browser-automation tools are available during test generation workflows:

- **Playwright MCP** — interactive browser session exposed to the coding agent (Cursor, JetBrains AI, etc.)
- **`playwright-cli`** — fast command-line browser checks during generation or debugging

Use them as operational aids while generating or repairing tests.

Do not treat them as substitutes for authored Playwright tests.

## Playwright MCP setup

Playwright MCP is configured outside the committed test suite. Typical project or IDE config:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

| IDE | Config location |
| --- | --- |
| Cursor | `~/.cursor/mcp.json` or project `.cursor/mcp.json` |
| JetBrains (PyCharm, etc.) | project `.ai/mcp/mcp.json` |

After adding or changing MCP config, restart the IDE or toggle the server in MCP settings before starting a generation session.

Playwright MCP exposes **tools** (navigate, snapshot, click, etc.), not MCP resources. An empty resource list does not mean the server failed.

## Environment prerequisites

Before using Playwright MCP or `playwright-cli` for requirement-driven generation, prepare the same stack the committed specs expect. See `tests/docs/runbooks/playwright_execution_guide.md` for full detail.

Minimum local stack:

1. **Deterministic fixtures** — `just e2e-prepare` on the local database
2. **Django** — `just django-run` (`:8000`)
3. **React app** — Vite dev server (`:3000`)
4. **Auth storage state** — `cd tests && yarn test-setup` → `tests/playwright/.auth/user.json`
5. **Fixture manifest** (workflow/project routes) — `just e2e-prepare` → `tests/.playwright-fixtures/workflow.json`

Re-run `just e2e-prepare` before validation if prior browser tests or development work may have mutated fixture rows.

## Role in the generation workflow

Playwright MCP belongs at **stage 4 — Live DOM validation** in `ai_test_generation_workflow.md`:

```
Requirement YAML → decompose → map UI vocabulary → Playwright MCP / CLI → write locators + spec → yarn test → review
```

MCP is for exploration by the engineer or agent. Committed output is always normal `@playwright/test` code in `tests/e2e/**/*.spec.ts` and colocated `*.locators.ts`.

## What to validate with Playwright MCP

For each in-scope requirement slice, validate against the live app before writing locators or assertions:

| Requirement input | MCP validation |
| --- | --- |
| `preconditions` / route | Navigate to the manifest or seeded route (e.g. `/project/{uuid}`) |
| `uiObjects` / `locatorMappings` | Snapshot DOM; confirm role, name, text, or `data-test-id` exists |
| `trigger` / `mainFlow` | Step through the interaction path |
| `acceptanceCriteria` | Confirm post-action observable state |
| `locatorMappings` with `confirmed` | Re-check in live DOM if UI may have changed |
| `locatorMappings` with `inferred` | Must be verified live before promotion to `*.locators.ts` |
| `locatorMappings` with `unresolved` | Do not invent; stop or interrogate |

MCP confirms what the implemented UI actually renders. **Selector choice must still comply with `locator_contract_policy.md`** — do not adopt XPath, MUI class, or layout-wrapper selectors just because they appear in the DOM snapshot.

When MCP reveals no acceptable selector, follow § **When to add `data-test-id`** in `locator_contract_policy.md` (existing contract → MCP validate → add `data-test-id` or block).

## Committed artifacts

| Artifact | Source |
| --- | --- |
| `tests/e2e/<domain>/*.locators.ts` | Selectors confirmed via MCP (or existing project contracts), per `locator_contract_policy.md` |
| `tests/e2e/<domain>/*.spec.ts` | Requirement IDs, setup, assertions per `playwright_authoring_standard.md` |
| Requirement YAML | Unchanged unless MCP reveals implementation drift — then flag in spec comments or return for clarification |

Do not embed MCP calls, CLI scripts, or agent-specific runtime behavior in committed tests. Specs must pass in CI without Cursor or MCP.

## When to use Playwright MCP

Playwright MCP is useful when generation or debugging benefits from a richer interactive browser session.

Recommended use cases:

- exploring an unfamiliar flow before generating a test
- confirming the actual rendered DOM for a candidate selector
- inspecting a modal, hover state, menu, or sidebar interaction that may be difficult to infer from static files alone
- stepping through a failing or ambiguous flow during review
- checking whether the implemented UI matches the functional requirement and design evidence

Use MCP when the generator needs a high-fidelity understanding of the page state and interaction path.

## When to use `playwright-cli`

`playwright-cli` is useful for fast, low-overhead browser interaction during generation or debugging.

Recommended use cases:

- quickly validating whether a locator is real
- replaying a short interaction path before writing the final test
- checking whether a control is reachable or visible in the current UI state
- validating a route, modal, or action sequence with minimal setup overhead
- iterating quickly during debugging when the test failure is clearly tied to the browser flow

Use `playwright-cli` when the task is narrow and the goal is fast operational confirmation.

## Tool-selection guidance

Use the lightest tool that answers the question.

### Prefer `playwright-cli` when:

- the question is narrow
- the interaction path is short
- the primary need is validating a selector or single flow step
- speed matters more than richer inspection

### Prefer Playwright MCP when:

- the flow is ambiguous
- the page has complex state transitions
- hover or modal behavior must be inspected closely
- the generated test appears to disagree with the actual UI in a way that needs investigation
- review/debugging requires a more interactive examination of the UI

## Required generation behavior

When selectors or interactions are not already project-authoritative, the generator should use available browser automation tooling to validate them against the implemented application before finalizing test code.

At minimum, generation should confirm:

- the route exists
- the target UI surface is present
- the candidate selector is real
- the interaction path is actually possible
- the observable result matches the intended behavior in the requirement

## Recommended generation workflow with tooling

1. Read the normalized or approved functional requirement and `tests/docs/requirements/mapping_fr_ui.md`.
2. Extract actors, route, `uiObjects`, preconditions, trigger, `mainFlow`, and acceptance criteria.
3. Prepare the E2E environment (local fixtures, API, app, auth, manifest).
4. Review Figma/design evidence as intent only.
5. Use Playwright MCP (or `playwright-cli` for narrow checks) to inspect the implemented UI.
6. Validate candidate selectors and flow steps against the live DOM; respect `locatorMappings` confidence.
7. Write or update colocated `*.locators.ts` with confirmed selectors only.
8. Generate the durable `*.spec.ts` with requirement traceability comments.
9. Run the real test (`cd tests && yarn test <spec-path>`).
10. If it fails ambiguously, use the tooling again for debugging rather than patching the test blindly.
11. Review against `generated_test_review_checklist.md`.

## Agent prompt pattern (Cursor / JetBrains)

When starting a generation run, include explicit MCP instructions alongside `tests/docs/prompts/test_spec_generation.md` inputs:

```text
Generate Playwright specs per tests/docs/prompts/test_spec_generation.md.

Normalized requirement: [PATH]
Requirement IDs: [IDS]
Output spec: tests/e2e/[domain]/[file].spec.ts
Locators: tests/e2e/[domain]/[file].locators.ts

Before writing locators or assertions:
1. Confirm the E2E stack is up (see playwright_execution_guide.md).
2. Use Playwright MCP to navigate to the seeded route from workflow.json (or stated preconditions).
3. Validate each in-scope uiObject and locatorMapping against the live DOM.
4. Promote only confirmed selectors into *.locators.ts.
5. Flag inferred or unresolved mappings as open questions — do not guess.

Do not commit MCP calls. Output durable Playwright test code only.
```

## Review workflow with tooling

During generated test review, use available tooling when needed to confirm:

- a selector really exists
- a hover/menu/modal path is real
- a role or accessible name is stable enough to be part of the selector contract
- the generated code matches the implemented UI rather than a guessed structure

The reviewer should not approve a generated test solely because the code looks plausible.

## Debugging workflow with tooling

When a generated test fails:

1. Determine whether the failure is a requirement issue, selector issue, environment issue, or product issue.
2. Use available tooling to inspect the actual browser behavior.
3. Confirm whether the generated selector path is valid.
4. Confirm whether the requirement and implementation agree.
5. Revise the Playwright test only after the real cause is understood.

Do not use the tooling to justify adding arbitrary sleeps, speculative branching, or brittle fallback selectors.

## Anti-patterns

Do not use Playwright MCP or `playwright-cli` to:

- replace the final authored Playwright test
- justify selectors that are still unstable or copy-fragile
- skip explicit assertions in the real test
- silently resolve requirement/implementation mismatches
- keep exploratory scripts as a substitute for durable browser tests

## Relationship to other documents

This document is operational guidance.

It works alongside:

- `adr_ai_test_generation.md`
- `ai_test_generation_workflow.md`
- `locator_contract_policy.md`
- `playwright_authoring_standard.md`
- `generated_test_review_checklist.md`

Use this guide when browser tooling is helpful during generation, review, or debugging.
Use the other documents to decide what the final Playwright test code must look like.
