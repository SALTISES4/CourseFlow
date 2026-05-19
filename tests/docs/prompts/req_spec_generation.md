use .cursorprompt

You are working on **requirements normalization for AI-assisted test generation**, not on Playwright spec generation.

Your task is to produce a **scope-limited normalized requirements document** from the provided source materials.

## Objective

Using the supplied:

* original Google Doc requirement content
* Figma links / design evidence
* existing normalized requirement template
* ADR: `tests/docs/requirements/adr_requirement_normalization_for_test_generation.md`

generate or extend a normalized requirements file for the requested feature scope.

This phase is only about producing a **clean normalized requirement artifact** that will later be used for test-case generation and spec generation.

Do **not** generate Playwright tests.
Do **not** generate spec files.
Do **not** generate POM classes.
Do **not** hardcode fixture IDs, localhost URLs, or environment-specific selectors unless explicitly provided as confirmed implementation mappings in the locator mapping section.

## Required governing document

You must follow the ADR:

* `tests/docs/requirements/adr_requirement_normalization_for_test_generation.md`

Treat that ADR as the authoritative rule for:

* what this phase is responsible for
* what the normalized artifact must contain
* what it must not contain
* how to handle ambiguity
* how to record uncertainty
* how to use canonical UI object identifiers
* how to use `uiObjectDefinitions`, `locatorMappings`, and `openQuestions`

## Output target

Write or update a normalized requirements document in the project template style.

Use this structure:

```yaml
uiObjectDefinitions:
  ...

locatorMappings:
  ...

requirements:
  - id: ...
    title: ...
    designEvidence: ...
    actors: ...
    uiObjects: ...
    preconditions: ...
    trigger: ...
    mainFlow: ...
    roleBehavior: ...
    acceptanceCriteria: ...
    openQuestions: ...
```

## Rules

### 1. Stay in requirements normalization

You are producing an intermediate source-of-truth artifact between raw requirements/design and downstream test generation.

Do not drift into implementation of:

* Playwright specs
* test steps
* code
* page object models
* helper functions

### 2. Use canonical UI object identifiers

Use variable-friendly `camelCase` object names such as:

* `workflowView`
* `workflowSectionContainer`
* `workflowSectionRow`
* `sectionHeader`
* `rightSidebar`
* `editSectionForm`

Do not rely on vague prose-only labels like:

* `Section`
* `Workflow View`
* `Sidebar`

unless they are immediately converted into canonical object identifiers.

### 3. Separate semantics from locator mappings

For each canonical UI object:

* define its meaning in `uiObjectDefinitions`
* add a locator mapping only if grounded by implementation knowledge or confirmed source material

If the locator mapping is uncertain, include it with a confidence marker or leave it unresolved.

Example:

```yaml
locatorMappings:
  workflowSectionContainer:
    strategy: "[data-week-id]"
    confidence: confirmed
  sectionHeader:
    strategy: "{workflowSectionContainer} > header"
    confidence: inferred
  editSectionForm:
    strategy: null
    confidence: unresolved
```

### 4. Do not invent missing facts

If the source materials do not clearly define:

* role behavior
* object boundaries
* sidebar states
* entry paths
* control presence
* title/copy behavior
* locator mappings

then do not guess silently.

Instead:

* add an `openQuestions` entry
* or interrogate the user if the missing information materially affects the normalized requirement

### 5. Interrogate the user when needed

If a missing detail would materially change the normalized output, ask the user targeted clarification questions.

Use interrogate mode only for meaningful gaps such as:

* conflicting requirement language
* ambiguous object meaning
* unclear role-specific behavior
* missing design evidence
* unresolved entry path differences
* uncertainty about whether a control is canonical, optional, or conditional

Do **not** interrogate the user for trivial wording polish.

### 6. Preserve traceability

Every normalized requirement must preserve traceability to:

* the original FR identifier if available
* the relevant Figma design evidence IDs

### 7. Normalize, do not paraphrase loosely

Your job is not to rewrite the requirement into prettier prose.
Your job is to convert it into a more precise structured artifact.

## Workflow

1. Read the ADR.
2. Read the provided source requirement content.
3. Read the provided Figma references / design evidence.
4. Extract the in-scope requirement(s) only.
5. Define or extend canonical UI object identifiers.
6. Define `uiObjectDefinitions`.
7. Add `locatorMappings` only where justified.
8. Normalize the requirement into the structured schema.
9. Add `openQuestions` for unresolved issues.
10. If critical gaps remain, interrogate the user with a short, concrete list.

## In-scope task for this run

Scope for this run:

* [FILL IN FEATURE SCOPE HERE]

Source requirement document(s):

* [FILL IN GOOGLE DOC / SOURCE DOC HERE]

Figma design evidence:

* [FILL IN FIGMA LINKS / NODE IDS HERE]

Output file target:

* [FILL IN TARGET FILE PATH HERE]

## Expected quality bar

The output should be:

* precise
* structured
* machine-friendly
* traceable
* explicit about ambiguity
* suitable as upstream input for later test-case generation

## Deliverable

Produce the normalized requirement content only.

If there are unresolved issues that materially affect correctness, end with a short `openQuestions` section and interrogate the user before making unsupported assumptions.

You should replace these placeholders before handing it to the engineer:

* `[FILL IN FEATURE SCOPE HERE]`
* `[FILL IN GOOGLE DOC / SOURCE DOC HERE]`
* `[FILL IN FIGMA LINKS / NODE IDS HERE]`
* `[FILL IN TARGET FILE PATH HERE]`
