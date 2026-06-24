# AI Test Generation Workflow

## Purpose

This document defines the operational workflow for generating Playwright tests with AI assistance.

It is intended for use by engineers and coding agents.

## Workflow overview

AI-generated tests must move through the following stages.

1. Requirement ingestion
2. Requirement decomposition
3. UI vocabulary mapping
4. Live DOM validation
5. Test generation
6. Execution and refinement
7. Human review
8. Merge or return for clarification

## 1. Requirement ingestion

The generator must start from the approved feature requirement document.

Minimum inputs:

- requirement ID(s)
- actor/role
- preconditions
- trigger
- main flow
- acceptance criteria
- design evidence IDs where available

If these are missing or ambiguous, generation should stop or explicitly surface the ambiguity.

## 2. Requirement decomposition

The generator should convert the requirement into a concrete test model.

Required extraction:

- user role under test
- starting route or setup entry point
- domain entity under test
- relevant UI surfaces
- expected state before interaction
- expected state after interaction
- role variants or permission restrictions

## 3. UI vocabulary mapping

Use `tests/docs/requirements/mapping_fr_ui.md` and project conventions to map FR terms to UI semantics.

Examples:

- `Section header`
- `Right sidebar`
- icon/action names
- dialog titles and confirmation controls

This mapping step is a translation aid only. It does not replace live DOM verification.

## 4. Live DOM validation

Before finalizing test code, validate the flow against the implemented app on `courseflow_e2e`.

### Environment prerequisites

Prepare the same stack committed specs use. See `tests/docs/runbooks/playwright_execution_guide.md`.

1. E2E database seeded (`just django-seed-e2e-tests` or `just rebuild-e2e-db`)
2. Django running against `courseflow_e2e` (`just django-run-e2e`)
3. React app on `:3000`
4. Auth storage state (`cd tests && yarn test-setup`)
5. Fixture manifest when routes depend on seeded UUIDs (`just e2e-prepare`)

### Validation checklist

The generator should confirm:

- the route exists
- the required seeded or setup state exists
- the selectors are real
- the interaction path matches the implemented DOM
- the requirement has not drifted from the UI

### Browser automation tooling

The QA-supported browser automation tooling available for this stage includes:

- **Playwright MCP** — preferred when flows are ambiguous (tabs, modals, hover menus, sidebars)
- **`playwright-cli`** — preferred for narrow selector or single-step checks

See `browser_automation_tooling_guide.md` for setup, the requirement-field validation table, committed artifact rules, and the agent prompt pattern.

### Per-requirement validation

| Requirement input | Validate in live app |
| --- | --- |
| `preconditions` / route | Open manifest or seeded URL |
| `uiObjects` / `locatorMappings` | Confirm selector exists in DOM |
| `trigger` / `mainFlow` | Walk the interaction path |
| `acceptanceCriteria` | Confirm post-action state |
| `inferred` mappings | Verify before writing `*.locators.ts` |
| `unresolved` mappings | Stop or interrogate — do not invent |
| No allowed selector after MCP | Escalate per `locator_contract_policy.md` § When to add `data-test-id` — React + registry, not XPath/MUI |

### Selector escalation (after MCP)

1. Use an existing acceptable contract if one exists.
2. If MCP shows only forbidden anchors (MUI, XPath, layout wrappers), **add `data-test-id`** (or block the slice).
3. Do not commit structural fallbacks as a substitute for testability work.

See `locator_contract_policy.md` § When to add `data-test-id`.

### Outputs of this stage

- Confirmed selectors → colocated `tests/e2e/<domain>/*.locators.ts` (shared canonical objects imported/re-exported per `adr_ai_test_generation.md`)
- No MCP or CLI code in committed artifacts
- No forbidden structural/MUI/XPath selectors — see `locator_contract_policy.md` § Explicitly forbidden selectors
- Implementation drift → note in spec comments or return for clarification

The exact mechanism is less important than the requirement that selectors be validated against the real UI before authored tests are accepted.

## 5. Test generation

Generate the durable Playwright test code in `tests/e2e/<domain>/*.spec.ts`.

The output should include:

- requirement traceability
- explicit role/setup assumptions
- stable selectors
- direct assertions of behavior
- minimal, justified helpers only

The test should not include speculative branches that were added merely to make generation feel robust.

## 6. Execution and refinement

Run the generated test in the target environment.

Refine based on:

- real locator failures
- timing issues tied to actual UI state
- missing preconditions
- requirement/implementation mismatches

Do not "fix" a failing test by adding arbitrary waits or defensive branching unless the underlying product behavior genuinely requires it.

## 7. Human review

Use `generated_test_review_checklist.md`.

The reviewer should verify:

- requirement traceability
- selector legitimacy
- assertion quality
- helper simplicity
- environment assumptions
- absence of hidden brittleness

## 8. Merge or clarify

If the generated test reveals one of the following, do not silently patch around it:

- FR ambiguity
- design mismatch
- missing selector contract
- unstable environment assumptions
- implementation drift

Instead, return the issue for clarification or remedial work.

## Practical generation rules

### The generator should do

- prefer asserting expected state over probing and branching
- validate selectors in the live app
- preserve requirement language in test naming and comments
- keep helper functions narrow and semantic
- document assumptions clearly

### The generator should not do

- invent selectors from Figma alone
- use `count()` as guard logic for a single expected element
- return nullable helper results when the element is required
- add `waitForTimeout` to make uncertainty disappear
- over-abstract one-off actions into framework-like helper layers

## Example application to a requirement

For a requirement such as `FR-SEC-006 Delete Section (modal)` in `tests/docs/requirements/features/workflow/workflow_delete_section_requirements_v1.yaml`, the workflow should look like this:

1. Read the FR and identify the deletion flow.
2. Confirm which role is allowed.
3. Prepare E2E env and confirm the starting workflow route and section state from `workflow.json`.
4. Use Playwright MCP to validate the section hover affordance in the DOM.
5. Validate the delete action and confirmation dialog in the live app.
6. Write confirmed selectors to `edit-section.locators.ts`.
7. Generate a spec that deletes the section and asserts its absence.
8. Run `yarn test` and review whether selector choices and assumptions are durable.

## Output quality bar

A generated test is acceptable only when another engineer can read it and understand:

- what requirement it verifies
- why the selectors are valid
- why the setup is legitimate
- what observable behavior is being asserted
- why the code is not brittle by design
