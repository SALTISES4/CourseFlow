# Locator Contract Policy

## Purpose

This document defines which selector strategies are acceptable for Playwright tests in this project and how generated tests should choose among them.

The goal is to ensure selector choice reflects a stable project contract rather than incidental DOM structure.

## Core principle

Selectors are not merely implementation details. They are part of the testability contract of the UI.

A generated test must prefer selectors that remain stable across routine copy, styling, or layout changes.

## Selector hierarchy

Use selectors in the following order **when the contract is actually stable in this project**.

### 1. Project-owned explicit test contracts

Examples:

- `data-testid`
- `data-test-id`
- other project-approved testing attributes

Use these when they are intentionally provided for test stability.

These are the preferred selectors for complex or repeated UI interactions.

### 2. Accessible role/name selectors

Examples:

- `getByRole('button', { name: 'Delete section' })`
- `getByRole('tab', { name: 'Comments' })`

Use these when the accessible role and name are stable parts of the product contract.

Do **not** assume they are always more stable than explicit test IDs. They are preferred only when the label is intentionally stable and under product control.

### 3. Label, placeholder, and text selectors

Use these only when the test is intentionally verifying user-visible copy or when no better project-owned contract exists.

These are weak selectors when copy is mutable, localized, or owned by content/design teams.

### 4. Structural or CSS selectors

Use these only as a last resort and only when accompanied by a clear justification.

Examples that should be treated with caution:

- descendant chains based on layout structure
- generated class names
- sibling-order selectors
- selectors tied to presentational wrappers rather than semantic controls

## Project-specific guidance

### Explicit disagreement with generic folklore

This project does **not** accept the blanket rule that role/label/placeholder selectors are always preferable to test IDs.

Where the project has established explicit testing contracts, those may be more stable than:

- mutable copy
- translated labels
- placeholder text
- content-managed strings

Therefore, generated tests should not demote explicit test IDs merely because a generic public style guide prefers user-facing selectors.

## Acceptable use of copy selectors

Copy-based selectors are acceptable when:

- the requirement explicitly verifies the copy
- the UI string is a locked product contract
- there is no more stable selector and the string is not expected to vary by environment or localization

Copy-based selectors are not acceptable when:

- the text is likely to change during iteration
- localization is in play and the test does not control locale
- the copy is incidental rather than semantically contractual

## Attribute selectors

Stable domain attributes such as entity IDs may be useful in exploratory debugging or controlled seeded environments.

Examples:

- `[data-week-id="62"]`
- `[data-drop-target-for-element="true"]`

However, these should be used carefully in durable tests.

Questions to answer before accepting them:

1. Is the ID stable across environments and seed runs?
2. Is the attribute an intentional external contract or an implementation detail?
3. Is the test verifying a domain concept or simply anchoring itself to current markup?

## Missing selector contract

If no stable selector exists, the generated test must not quietly fall back to brittle structure and pretend the problem is solved.

Instead, one of the following should happen:

- add a project-approved testing attribute
- centralize the fallback selector with a note about fragility
- flag the feature as needing a testability contract before merge

## Anti-patterns

The following are considered poor locator practice unless justified:

- generated class names
- deeply nested structural selectors
- nth-child selectors tied to layout only
- text selectors for content that is not contractually stable
- selectors inferred from Figma element names without DOM validation
- selectors invented by the generator without evidence in the live app

## Review rules

A selector should be rejected in review if:

- it cannot be traced to a live DOM observation or stable contract
- it depends on styling or layout structure only
- it depends on mutable copy without reason
- a clearer project-owned contract exists and was ignored
- it was chosen because a generic style guide said so, rather than because it fits this project
