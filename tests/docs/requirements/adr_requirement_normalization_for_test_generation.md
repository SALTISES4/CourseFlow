# ADR: Requirement Normalization for AI-Assisted Test Generation

This ADR governs the normalization phase that produces canonical input for downstream test generation governed by docs/testing/adr_ai_test_generation.md.


## Status

Proposed

## Date

2026-04-10

## Context

The project is using AI assistance to help transform upstream design and requirement material into a durable Playwright test suite.

The upstream inputs currently include:

- original functional requirement documents from Google Docs
- Figma frames and design evidence
- implementation knowledge discovered through UI inspection
- engineering and QA clarification during review

These source materials are useful, but they are not yet in a form that is reliable enough to drive automated or semi-automated test generation directly.

The current problems are:

1. **Upstream requirement language is often too ambiguous**
   - Terms such as `Section`, `Workflow`, `Sidebar`, or `Header` are frequently used in prose without being defined as explicit UI-domain objects.
   - This creates ambiguity for AI systems and for engineers trying to derive testable scenarios.

2. **Generated outputs become too implementation-specific too early**
   - When ambiguity is not resolved at the requirement layer, the next generation step tends to invent or overfit:
     - hardcoded URLs
     - hardcoded IDs
     - brittle DOM selectors
     - environment-specific assumptions
   - This produces artifacts that are more precise, but precise in the wrong layer.

3. **There is no stable intermediate representation**
   - The project needs a normalized form between:
     - raw requirements and design inputs
     - downstream Playwright spec generation
   - Without this layer, the generation pipeline mixes product intent, UI semantics, locator assumptions, and test implementation details.

4. **Terminology drift exists between product semantics and implementation semantics**
   - A user-facing concept such as `section` may map to a rendered object that uses implementation naming such as `data-week-id`.
   - Without a documented mapping layer, AI-generated outputs cannot reliably infer what DOM object corresponds to the requirement term.

5. **Interactive clarification is sometimes required**
   - Engineers using Cursor or similar tooling may need to use interrogate mode to resolve uncertainty.
   - The process needs a formal place to record unresolved questions and inferred mappings instead of silently inventing answers.

The project therefore needs a normalized requirement format suitable for AI-assisted transformation into test cases and later into Playwright spec files.

## Decision

The project will introduce a **normalized requirement artifact** as the canonical intermediate representation between upstream requirement/design sources and downstream test-generation outputs.

This normalized requirement artifact will:

- preserve product and design intent
- use canonical machine-friendly UI object identifiers
- explicitly define UI-domain objects
- explicitly define locator mappings where they are known
- explicitly record uncertainty and open questions
- avoid embedding raw test implementation details such as hardcoded environment URLs or instance-specific IDs unless those are intentionally fixture-bound and documented elsewhere

The normalized artifact is the required output of the first generation phase.

### Required generation pipeline

The intended pipeline is:

1. **Upstream sources**
   - Google Doc requirements
   - Figma design evidence
   - implementation inspection
   - QA / engineering clarification

2. **Normalized requirement artifact**
   - canonical object naming
   - UI object definitions
   - locator mappings
   - structured requirement entries
   - open questions / confidence markers

3. **Downstream outputs**
   - test case generation
   - scenario expansion
   - Playwright spec generation

The project is explicitly choosing **not** to generate Playwright spec files directly from raw prose requirements.

## Normalized Requirement Format

The normalized requirement artifact must use structured fields rather than informal free prose wherever possible.

At minimum, it must support the following top-level sections:

- `uiObjectDefinitions`
- `locatorMappings`
- `requirements`

### `uiObjectDefinitions`

This section defines canonical UI-domain objects using explicit variable-like identifiers.

- Each object must define its meaning in a single-sentence functional definition, not a description of behavior. Behavior belongs strictly in the requirements section.
- Each object must be defined only once. If used in multiple files, reference the original canonical description.
- Do not use mainFlow or acceptanceCriteria to restate the uiObjectDefinitions. If an object is listed in uiObjects, its functional existence is assumed; focus only on the state change or interaction.

These identifiers must be:

- machine-friendly
- stable
- unambiguous
- reusable across requirements

Examples:

- `workflowView`
- `workflowSectionContainer`
- `workflowSectionRow`
- `workflowSectionHeader`
- `workflowRightSidebar`
- `workflowEditSectionForm`

These identifiers are not raw selectors.
They are canonical semantic objects that the requirement depends on.


Example:

```yaml
uiObjectDefinitions:
  workflowSectionContainer:
    meaning: Container for one section (ordered segment of the workflow); a workflow may list many sections; sections can be empty or contain one or many workflowNodes; nodes in section are ordered horizontally based on workflowChannels and vertically by workflowSectionRow.
  workflowSectionRow:
    meaning: Horizontal layout band inside a workflowSectionContainer spanning all workflowChannels; workflowSectionRows stack top-to-bottom; at most one workflowNode per workflowChannel occupies a given row at that vertical level; Row insert mode uses full-width row hit targets (upper and lower halves) for vertical insertion relative to existing nodes.
```

### `locatorMappings`

This section documents how canonical UI-domain objects map to the current implementation when known.

Locator mappings must:

* reference canonical object names
* describe current locator strategy
* indicate confidence or uncertainty when applicable

Example:

```yaml
locatorMappings:
  workflowSectionContainer:
    strategy: "[data-week-id]"
    confidence: confirmed
  workflowSectionRow:
    strategy: null
    confidence: unresolved
  workflowSectionHeader:
    strategy: "{workflowSectionContainer} header region including week title row"
    confidence: inferred
```

Locator mappings are allowed to be unresolved.

Example:

```yaml
workflowEditSectionForm:
  strategy: null
  confidence: unresolved
```

### `requirements`

Each requirement must be normalized into explicit structured fields.

At minimum, each requirement must include:

* `id`
* `title`
* `designEvidence`
* `actors`
* `uiObjects`
* `preconditions`
* `trigger`
* `mainFlow`
* `roleBehavior`
* `acceptanceCriteria`
* `openQuestions`

Example structure:

```yaml
requirements:
  - id: FR-SEC-001
    title: Open Edit Section Form
    designEvidence:
      - FIGMA_SEC_OE_EDIT
      - FIGMA_SEC_CV_EDIT
    actors:
      - owner
      - editor
      - viewer
      - commenter
    uiObjects:
      - workflowView
      - workflowSectionContainer
      - workflowSectionHeader
      - workflowRightSidebar
      - workflowEditSectionForm
    preconditions:
      - workflowView is open
      - at least one workflowSectionContainer exists
    trigger:
      - user clicks workflowSectionHeader while workflowRightSidebar is closed
    mainFlow:
      - system identifies the selected workflowSectionContainer from the clicked workflowSectionHeader
      - system renders workflowEditSectionForm in workflowRightSidebar
    roleBehavior:
      owner:
        workflowEditSectionForm: editable
      viewer:
        workflowEditSectionForm: readOnly
    acceptanceCriteria:
      - given workflowRightSidebar is closed, when user clicks workflowSectionHeader, then workflowRightSidebar opens and renders workflowEditSectionForm
    openQuestions: []
```

## Naming Rules

The project adopts the following naming rules for normalized requirement artifacts.

### Canonical object naming

Canonical UI object identifiers must:

* use variable-friendly naming
* be written in `camelCase`
* describe one stable UI-domain concept
* avoid generic prose-only nouns where ambiguity exists

Examples of preferred names:

* `workflowView`
* `workflowSectionContainer`
* `workflowSectionRow`
* `workflowSectionHeader`
* `workflowSectionDeleteDialog`
* `workflowEditSectionFormDuplicateButton`

Examples of discouraged names:

* `Workflow View`
* `Section`
* `Header`
* `Sidebar`

The issue with the discouraged forms is not readability.
The issue is ambiguity.

For example, the term `section` may refer to:

* a backend domain entity
* a rendered visual container
* a clickable header region
* a current sidebar binding
* an implementation element using a non-obvious internal locator

The normalized format must not rely on that ambiguity.

### Requirement language

Requirement content must refer to canonical object identifiers where relevant.

This is intentional.
The requirement layer is expected to be more formal and more explicit than natural-language feature prose.

### Literal strings (user-visible copy)

When describing a specific label or piece of text, always use single quotes (for example, `'Type'`).

Whenever a requirement includes **exact user-visible text** (for example button labels, dialog titles, headings, snackbar or inline messages, placeholder copy, or any string that must match the product UI), that literal **must be wrapped in single quotes** (`'...'`). This distinguishes exact copy from descriptive prose and keeps downstream generation unambiguous.

**Good:**

* `projectForm presents projectFormCancelButton and projectFormSubmitButton with submit label 'Create project'`

**Avoid:**

* `... with submit label Create project` (unclear whether words are exact copy or paraphrase)

Apply this in `mainFlow`, `acceptanceCriteria`, `preconditions`, and any other field where literal copy appears.

### Interaction vocabulary (clicks)

Do not use **activate**, **activation**, or **activated** to mean a **click** on a control (button, link, icon, menu item, list row, or similar pointer primary action). In `trigger`, `mainFlow`, and `acceptanceCriteria`, use **click** (e.g. `user clicks homeNavItem`, `user clicks workflowSectionDeleteDialogConfirmButton`) or another precise verb when the interaction is not a click (e.g. **types**, **hovers**, **drags**). If you must describe system follow-on behavior, prefer **selected**, **open**, **visible**, or **submitted** over “activated” unless the word is used in a non-click domain sense and is unambiguous in context.

## What the normalized artifact must not contain

The normalized requirement artifact must not become a disguised Playwright test spec.

The following are not allowed in the normalized requirement layer unless explicitly justified as fixture-bound metadata in a separate layer:

* hardcoded localhost URLs
* hardcoded workflow IDs
* hardcoded section instance IDs
* test-only seed references embedded as if they were business rules
* raw Playwright code
* direct test steps written as implementation scripts
* environment-specific commands

Examples of discouraged content:

```text
WORKFLOW_URL=http://localhost:8001/course-flow/workflow/11/workflow
SECTION_WRAP_LOCATOR=[data-week-id="62"]
```

These may be useful during debugging or fixture-specific test authoring, but they are not appropriate as canonical normalized requirement content.

## Uncertainty Handling

When normalization cannot confidently determine a semantic object, behavior rule, or locator mapping, the generator must not invent an answer silently.

Instead, the normalized artifact must use one or both of:

* `confidence` markers on mappings
* `openQuestions` entries on requirements

Examples of legitimate uncertainty:

* whether a control exists for all roles
* whether a sidebar control is always present or conditionally rendered
* whether a title string is locale-invariant
* whether a locator mapping is confirmed by implementation or only inferred

The first generation phase is allowed to produce unresolved questions.
That is preferable to false certainty.

## Use of Interrogate Mode

Engineers using Cursor or similar tooling may use interrogate mode during normalization.

Interrogate mode should be used to resolve:

* missing object definitions
* ambiguous role behavior
* inconsistent or incomplete requirement language
* missing locator mappings
* design-to-implementation mismatches

Interrogate mode should not be used to bypass structured output.
The goal remains to produce a normalized artifact in the required schema.

## Relationship to Test Generation

The normalized requirement artifact is the output of **prompt 1**.

Its purpose is to support, but not replace, later phases such as:

* test case synthesis
* coverage matrix generation
* Playwright spec generation

Prompt 1 is therefore focused on:

* normalization
* semantic precision
* explicit mapping
* uncertainty capture

It is not responsible for generating final Playwright specs.

## Consequences

### Positive consequences

* Reduces ambiguity at the requirement layer
* Gives AI systems a stable semantic bridge between product requirements and implementation
* Prevents early overfitting to brittle DOM selectors and fixture IDs
* Enables more consistent prompt design for requirement-to-test workflows
* Makes terminology drift visible and correctable
* Provides a formal place to record unresolved questions

### Negative consequences

* Adds one more artifact type to maintain
* Requires editorial discipline to keep canonical object names consistent
* May feel more formal or less natural than traditional prose requirements
* Requires some upfront work before downstream spec generation becomes smooth

## Alternatives considered

### 1. Generate spec files directly from prose requirements

Rejected.

Reason:
Raw prose requirements are too ambiguous and lead to inconsistent or brittle outputs.

### 2. Convert requirements directly into test-case docs with hardcoded URLs and selectors

Rejected as canonical approach.

Reason:
This creates precision in the wrong layer and over-couples requirements to one current implementation instance.

### 3. Use only human-readable UI labels in requirements

Rejected.

Reason:
Labels such as `Section` or `Workflow View` are too ambiguous unless formally defined as canonical objects.

## Implementation Notes

The project may place the normalization template in a shared templates folder, for example:

```text
templates/requirements.md
```

Supporting docs may live under:

```text
docs/requirements/
docs/testing/
```

The normalized artifact is expected to evolve as the project refines:

* locator policies
* UI object vocabulary
* test-generation prompts
* downstream Playwright standards

## Follow-up Work

The following follow-up items are expected:

1. Create and maintain a reusable normalized requirement template.
2. Create the prompt for phase 1 normalization.
3. Define review criteria for normalized requirement artifacts.
4. Refine the downstream prompt for converting normalized artifacts into test cases and later Playwright spec files.
5. Maintain consistency between `uiObjectDefinitions`, `locatorMappings`, and downstream locator policy.

```
