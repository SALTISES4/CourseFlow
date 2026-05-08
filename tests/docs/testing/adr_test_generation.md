# ADR: Test Generation for Playwright

This ADR assumes that requirements have already been normalized according to docs/requirements/adr_requirement_normalization_for_test_generation.md.

## Status

Proposed

## Date

2026-04-10

## Context

The project currently has:

- functional-requirement authoring guidance
- feature-level requirement documents
- a lightweight FR-to-UI mapping file
- a small set of example AI-generated test guides

However, it does **not** have a governing architecture document for AI-assisted test generation.

As a result, AI-generated Playwright tests currently risk:

- inventing selectors from Figma or wording rather than the implemented DOM
- using generic public Playwright heuristics that do not match project conventions
- producing overly defensive helper logic that obscures intent
- conflating exploratory browser automation with durable authored tests
- writing tests that are not grounded in a stable selector contract
- drifting away from functional requirements during generation

## Decision

The project will maintain a **project-local test generation policy** for AI-assisted Playwright authoring.

This policy is defined by the documents in `tests/docs/testing/` and is binding for both human authors and AI agents generating or revising Playwright tests.

### Core decision points

#### 1. Playwright Test is the durable artifact

The committed source of truth for browser tests is Playwright test code in the repository.

Generation support tooling may assist authoring, but it does not replace authored Playwright tests.

#### 2. Feature requirements define intended behavior

Approved feature-level functional requirements define what behavior the test must verify.

Tests must be traceable back to requirement IDs and, where available, Figma evidence IDs.

#### 3. Live DOM is authoritative for locator reality

Figma and requirement language may suggest intended UI semantics, but the rendered application is authoritative for:

- selector viability
- role exposure
- actual control names
- structure and interaction paths

Generated tests must validate selectors against the live application before code is considered acceptable.

#### 4. AI must not invent product behavior

If implementation, requirement text, and design evidence disagree, the generator must not silently resolve the discrepancy by inventing behavior.

Instead, the discrepancy must be surfaced as one of:

- implementation drift
- requirement ambiguity
- missing testability contract
- design mismatch

#### 5. Stable selector contracts are preferred over incidental structure

The project will prefer intentional selector contracts over incidental DOM structure.

This means generated tests should prioritize stable, project-owned selectors where available and should treat brittle structural or copy-derived selectors as a fallback of last resort.

#### 6. Tests must express expected behavior directly

Generated tests must use direct assertions on expected behavior rather than speculative branching or generic probing patterns.

The project explicitly discourages patterns such as:

- counting elements before interacting with a single expected element
- returning `null` from helper functions unless absence is a valid business state
- using arbitrary sleeps instead of assertion-driven waiting
- wrapping straightforward interactions in over-general helper abstractions

## Source-of-truth hierarchy

When documents or artifacts disagree, use the following order.

### Level 1: approved functional requirements

Feature-specific approved FRs define intended user-visible behavior.

### Level 2: explicit project testing policy

The documents in `tests/docs/testing/` define how tests must be generated, validated, and reviewed.

### Level 3: live implemented UI

The live UI is authoritative for whether a selector or route currently exists and how the interaction actually behaves.

### Level 4: Figma design evidence

Figma frames provide design intent and role/surface expectations, but they are not sufficient on their own to justify a selector or interaction path in authored code.

### Level 5: example generation guides

Example test guides and prompt packs are illustrative only. They must not override the above sources.

## Scope

This ADR applies to:

- AI-assisted Playwright test generation
- AI-assisted test repair
- AI-authored helper functions used by Playwright tests
- review of generated Playwright tests before merge

This ADR does **not** define:

- the full organizational testing taxonomy outside browser test generation
- backend contract testing standards
- visual-regression policy in detail
- non-browser performance or load testing

Those may be covered by separate documents.

## Required generation workflow

Every AI-generated Playwright test must follow this sequence.

1. Read the approved functional requirement.
2. Extract actor, preconditions, trigger, main flow, role variants, and acceptance criteria.
3. Map requirement vocabulary to known UI semantics and locator contracts.
4. Inspect the live DOM before finalizing selectors.
5. Generate the Playwright test.
6. Execute the test or otherwise validate the flow against the live app.
7. Revise the test against actual behavior.
8. Submit the generated test to human review using the review checklist.

Skipping the live DOM validation step is not acceptable when selectors or flows are not already project-authoritative.

## Consequences

### Positive

- fewer invented or non-existent selectors
- clearer distinction between product intent and implementation reality
- less brittle Playwright code
- more consistent generated tests across features and authors
- a stable basis for internal generation guidance
- more efficient human review of generated tests

### Negative

- generation becomes more constrained and may feel slower
- authors must maintain project-local policy documents
- some tests will be blocked on missing selector contracts or unclear requirements instead of being generated optimistically
- feature teams may need to add explicit testability hooks to the UI when no stable contract exists

## Enforcement

A generated Playwright test should be rejected in review if any of the following are true:

- selectors appear invented or unvalidated
- the test is not traceable to a requirement ID
- helper logic hides product intent behind generic abstractions
- the test branches around expected UI state instead of asserting it
- the test depends on mutable copy without justification
- the test uses unstable structural selectors where a better contract is available
- the test silently resolves design/implementation mismatch without documenting it

## Related documents

- `playwright_authoring_standard.md`
- `locator_contract_policy.md`
- `ai_test_generation_workflow.md`
- `generated_test_review_checklist.md`
- existing FR guidance and feature-level requirement documents
