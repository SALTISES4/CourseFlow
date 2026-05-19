use .cursorprompt

You are working on **Playwright test spec generation** from an already-normalized requirement artifact.

Your task is to generate a **first version of Playwright test specs** for the requested requirement scope.

## Objective

Using the supplied:

- normalized requirement document
- original requirement document(s) for traceability only
- Figma design evidence for intent verification only
- project testing policy documents under `tests/docs/testing/`

generate Playwright test spec files that are consistent with:

- the normalized requirement structure
- the project's locator contract policy
- the Playwright authoring standard
- the AI-assisted test-generation workflow
- the generated test review checklist

This phase is **downstream of requirement normalization**.

Do **not** re-normalize the requirement unless the normalized input is clearly incomplete or contradictory.
Do **not** invent product behavior.
Do **not** silently repair requirement ambiguity by guessing.

## Required governing documents

You must follow these files:

- `tests/docs/testing/adr_ai_test_generation.md`
- `tests/docs/testing/playwright_authoring_standard.md`
- `tests/docs/testing/locator_contract_policy.md`
- `tests/docs/testing/ai_test_generation_workflow.md`
- `tests/docs/testing/generated_test_review_checklist.md`
- `tests/docs/testing/browser_automation_tooling_guide.md`

You must also use:

- `docs/requirements/adr_requirement_normalization_for_test_generation.md`

for understanding the structure and intent of the normalized requirements input.

## Input priority

Use sources in this order:

1. normalized requirement document for the in-scope feature
2. project testing-policy docs in `docs/testing/`
3. original requirement document(s) for traceability and clarification only
4. Figma design evidence for intended UI semantics only
5. live implemented UI / DOM validation

The normalized requirement document is the primary source for:

- canonical UI object names
- semantic object definitions
- locator mappings and their confidence
- requirement structure
- acceptance criteria
- open questions

## Scope boundary

You are generating **durable Playwright test code**.

You are not generating:

- new normalized requirement docs
- new ADRs
- page object model architecture unless the repo already has a stable pattern that should be reused
- broad testing-framework abstractions
- speculative helpers
- test code that depends on MCP or CLI-specific runtime behavior

Exploratory browser tooling may be used during generation and debugging, but the final output must be normal Playwright test code.

## Inputs required for this run

You will be given:

- normalized requirement file path
- original requirement file path(s), if needed
- Figma evidence IDs / links, if needed
- requirement ID scope
- output file path

If any of these are missing and materially affect correctness, interrogate the user.

## Required output

Generate one or more `.spec.ts` files that:

- trace back to the in-scope requirement IDs
- reflect the normalized requirement semantics
- use acceptable selectors according to project policy
- make setup assumptions visible
- use direct assertions on expected behavior
- avoid overengineered helper logic
- are suitable for human review against `generated_test_review_checklist.md`

## Required workflow

Follow this sequence:

1. Read the normalized requirement input.
2. Extract:
   - requirement ID
   - title
   - design evidence
   - actors
   - uiObjects
   - preconditions
   - trigger
   - mainFlow
   - roleBehavior
   - acceptanceCriteria
   - openQuestions
3. Check whether `openQuestions` or unresolved locator mappings block reliable spec generation.
4. Consult the project testing docs.
5. Validate candidate selectors and interaction paths against the implemented UI.
6. Generate Playwright spec code.
7. Keep test structure and selectors consistent with the project's authoring and locator policies.
8. If a critical ambiguity remains, interrogate the user instead of guessing.

## Selector rules

### 1. Prefer normalized requirement vocabulary

When possible, work from canonical UI object names defined in the normalized requirement file, such as:

- `workflowSectionContainer`
- `workflowSectionRow`
- `sectionHeader`
- `rightSidebar`
- `editSectionForm`

Use `uiObjectDefinitions` to understand what the object is supposed to mean.

### 2. Use locator mappings deliberately

Use `locatorMappings` as the first source for implementation-aware selector choices.

Respect mapping confidence:

- `confirmed`: may be used directly if still valid in the implemented UI
- `inferred`: validate against the live DOM before finalizing
- `unresolved`: do not invent silently; either validate and promote with justification or interrogate the user

### 3. Follow project locator policy

Use `tests/docs/testing/locator_contract_policy.md`.

In particular:

- prefer project-owned explicit test contracts where available
- use role/name selectors only when the accessible contract is stable
- do not assume public Playwright folklore outranks project policy
- do not invent selectors from Figma alone
- do not rely on brittle structure if a better contract exists

## Assertion and helper rules

Follow `tests/docs/testing/playwright_authoring_standard.md`.

In particular:

- assert expected behavior directly
- use assertion-driven waiting
- do not use arbitrary sleeps
- do not use `count()` as control-flow guard for a single expected element
- do not return `null` from helpers unless absence is a valid business state
- do not create abstractions prematurely

## Relationship to original requirement docs

The original requirement docs are not the primary source for this phase.

Use them only to:

- verify traceability
- resolve wording drift
- confirm the original product intent if the normalized file appears incomplete

Do not revert to raw bracket-term parsing as the main generation strategy when a normalized requirement artifact already exists.

## Relationship to Figma

Figma is supporting design evidence, not the selector source of truth.

Use it to confirm:

- intended role/surface variants
- expected visible affordances
- whether a control is hidden / visible / disabled / read-only
- whether a modal/sidebar/tab should exist for a given role or state

Do not derive final selectors from Figma alone.

## Browser tooling usage

The following tools are available during generation, review, and debugging:

- Playwright MCP
- `playwright-cli`

Use them when they materially improve:

- selector validation
- flow verification
- modal / hover / sidebar inspection
- debugging failing candidate tests

Do not make them part of the committed Playwright test artifact.

## Interrogate mode rules

If any of the following would materially affect correctness, interrogate the user with a short, targeted list:

- normalized requirement input is missing
- required locator mappings are unresolved and cannot be confidently validated
- requirement behavior is contradictory across normalized doc and original doc
- role behavior is unclear
- preconditions/setup assumptions are missing
- output path or spec scope is unclear

Do **not** interrogate the user for trivial style preferences.

## Required structure of generated tests

Where practical, generated tests should include traceability comments such as:

```ts
// FR: FR-SEC-006 (tests/docs/requirements/original/workflow_delete_section_requirements_v1.yaml)
// Design evidence: FIGMA_SEC_OE_HOVER, FIGMA_SEC_DEL_WARN, FIGMA_SEC_OE_EDIT
// Role: owner
```

Test titles should describe observable behavior, for example:

* `owner can delete a section from the modal`
* `viewer can open edit section form in read-only mode`

Avoid titles based on implementation trivia.

## Missing requirement handling

If a required behavior is missing from the normalized requirement input and cannot be resolved safely:

* do not invent it
* add a short comment in the generated output if necessary
* or stop and interrogate the user, depending on severity

## In-scope task for this run

Normalized requirement input:

* [FILL IN NORMALIZED REQUIREMENT FILE PATH HERE]

Original requirement input(s), if needed:

* [FILL IN ORIGINAL REQUIREMENT FILE PATH HERE]

Requirement ID scope:

* [FILL IN REQUIREMENT IDS HERE]

Figma evidence:

* [FILL IN FIGMA LINKS OR IDS HERE]

Output spec file path:

* [FILL IN OUTPUT FILE PATH HERE]

## Deliverable

Produce the Playwright spec file(s) only.

If generation is blocked by missing or contradictory inputs, do not guess. Interrogate the user with a concise list of blocking questions.
