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

- Playwright MCP
- `playwright-cli`

Use them as operational aids while generating or repairing tests.

Do not treat them as substitutes for authored Playwright tests.

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

1. Read the approved functional requirement.
2. Extract actor, preconditions, trigger, and acceptance criteria.
3. Review Figma/design evidence as intent only.
4. Use Playwright MCP or `playwright-cli` to inspect the implemented UI.
5. Validate candidate selectors and flow steps against the live DOM.
6. Generate the durable Playwright test.
7. Run the real test.
8. If it fails ambiguously, use the tooling again for debugging rather than patching the test blindly.

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
