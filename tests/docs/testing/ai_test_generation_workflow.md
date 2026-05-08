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

Before finalizing test code, validate the flow against the implemented app.

The generator should confirm:

- the route exists
- the required seeded or setup state exists
- the selectors are real
- the interaction path matches the implemented DOM
- the requirement has not drifted from the UI

The QA-supported browser automation tooling available for this stage includes:

- Playwright MCP
- `playwright-cli`

Use these tools when they materially improve selector validation, flow verification, review quality, or debugging quality.

The exact mechanism is less important than the requirement that selectors be validated against the real UI before authored tests are accepted.

## 5. Test generation

Generate the durable Playwright test code.

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

For a requirement such as `FR-SEC-006 Delete Section (modal)`, the workflow should look like this:

1. Read the FR and identify the deletion flow.
2. Confirm which role is allowed.
3. Confirm the starting workflow route and section state.
4. Validate the actual section hover affordance in the DOM.
5. Validate the delete action and confirmation dialog.
6. Generate a test that deletes the section and asserts its absence.
7. Review whether the selector choices and assumptions are durable.

## Output quality bar

A generated test is acceptable only when another engineer can read it and understand:

- what requirement it verifies
- why the selectors are valid
- why the setup is legitimate
- what observable behavior is being asserted
- why the code is not brittle by design
