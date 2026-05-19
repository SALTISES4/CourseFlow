# Playwright Authoring Standard

## Purpose

This document defines how Playwright tests should be authored for this project, especially when generated or revised by AI.

It complements the ADR by specifying concrete coding rules.

## General principles

1. A Playwright test should read like a direct verification of a requirement.
2. A test should assert expected user-visible behavior, not implementation trivia.
3. A helper function should simplify repeated domain behavior, not hide uncertainty.
4. Waiting should be driven by expectations and actionability, not sleeps.
5. Selector choice is part of the product contract, not an incidental implementation detail.

## Test structure

### Required header information

Where practical, each generated test should include traceability comments with:

- FR ID
- feature name
- relevant Figma evidence IDs
- role under test

Example:

```ts
// FR: FR-SEC-006 — tests/docs/requirements/original/workflow_delete_section_requirements_v1.yaml
// Design evidence: FIGMA-SEC-OE-HOVER, FIGMA-SEC-DEL-WARN, FIGMA-SEC-OE-EDIT
// Role: Owner/Editor
```

### Test titles

Test titles should describe observable behavior, not implementation mechanism.

Preferred:

- `owner can delete a section from the modal`
- `commenter sees comment tab but cannot edit section title`

Avoid:

- `click delete button should remove section`
- `data-week-id section deletion test`

## Selector usage

Follow `locator_contract_policy.md`.

At a minimum:

- prefer intentional selector contracts
- use role and accessible-name selectors when they are truly stable product contracts
- avoid brittle structure-only CSS selectors
- avoid selecting by incidental copy unless the requirement verifies that copy

## Assertions and waiting

### Preferred patterns

Use assertion-driven waiting:

- `await expect(locator).toBeVisible()`
- `await expect(locator).toHaveText(...)`
- `await expect(locator).toHaveCount(...)`
- `await expect(locator).not.toBeVisible()`

These are preferred over manual polling and arbitrary delays.

### Forbidden or discouraged patterns

#### 1. Arbitrary sleeps

Do not use:

```ts
await page.waitForTimeout(1000)
```

unless there is a documented exception and no better state signal exists.

#### 2. Probe-then-branch for expected elements

Do not guard a single expected element with generic probing logic such as:

```ts
const el = page.locator('[data-week-id]').first();
if ((await el.count()) === 0) return null;
```

If the element is expected to exist, assert that expectation directly.

Preferred:

```ts
const el = page.locator('[data-week-id]').first();
await expect(el).toBeVisible();
```

#### 3. Nullable helpers for non-optional state

Do not return `null` from a helper unless the business requirement explicitly allows absence.

Bad:

```ts
async function firstSectionId(page: Page): Promise<string | null> { ... }
```

when the test requires a section to exist.

Preferred:

```ts
async function firstSectionId(page: Page): Promise<string> { ... }
```

with explicit assertions.

## Helper-function design

### When to create a helper

Create a helper only when it does one of the following:

- eliminates repeated multi-step domain behavior
- encodes a stable project concept used across tests
- improves readability without hiding assertions or uncertainty

### When not to create a helper

Do not create a helper merely to wrap one locator click or attribute lookup unless it serves a stable semantic purpose.

Bad:

- `clickDeleteButton()` when used in one test only
- `findFirstThingMaybe()` when the thing is expected to exist

### Helper rules

A helper should:

- have a narrow semantic purpose
- expose failure clearly
- avoid internal speculative branching
- avoid generic fallback behavior
- use project vocabulary where possible

## State and data usage

### Stable test data

Generated tests should prefer stable, intentional fixtures or setup over hard-coded implementation IDs unless the test harness explicitly guarantees those IDs.

Hard-coded route IDs or data IDs may be acceptable in:

- exploratory generation
- local scaffolding examples
- controlled seeded environments

They should not be assumed acceptable for long-lived regression tests unless the environment contract explicitly supports them.

### Environment assumptions

Every generated test should make its assumptions obvious:

- authenticated user role
- seeded workflow/project state
- feature flags or route availability
- any required pre-existing section/node/comment

## Page object and abstraction policy

Page objects are allowed when they improve consistency across many tests, but they must not become a dumping ground for hidden control flow.

If page objects are used, they should:

- expose feature-level actions
- keep locators centralized where this improves maintenance
- avoid absorbing assertions that belong in the test unless the assertion itself is a repeated semantic contract

## Debugging artifacts

Generated tests should assume standard Playwright diagnostics are available during development and CI, including:

- trace
- screenshot on failure
- video on failure where configured
- console and network inspection when relevant

Tests should not implement their own ad hoc logging unless there is a specific feature reason.

## Example: acceptable vs unacceptable

### Unacceptable

```ts
async function firstWeekId(page: Page): Promise<string | null> {
  const el = page.locator('[data-week-id]').first();
  if ((await el.count()) === 0) return null;
  return el.getAttribute('data-week-id');
}
```

Problems:

- branches around expected state
- uses `count()` as control-flow probe
- returns nullable value without business justification
- obscures why absence would be acceptable

### Acceptable

```ts
async function firstWeekId(page: Page): Promise<string> {
  const el = page.locator('[data-week-id]').first();
  await expect(el).toBeVisible();
  const id = await el.getAttribute('data-week-id');
  expect(id).not.toBeNull();
  return id!;
}
```

## Review expectation

A reviewer should be able to answer all of the following by reading the test:

- which requirement is being verified
- which role is under test
- why the selectors are acceptable
- why the waits are correct
- why the setup is valid
- why the helper abstractions, if any, are justified
