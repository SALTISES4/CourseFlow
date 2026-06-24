# Locator Contract Policy

## Purpose

This document defines which selector strategies are acceptable for Playwright tests in this project and how generated tests should choose among them.

The goal is to ensure selector choice reflects a stable project contract rather than incidental DOM structure.

This policy is **binding** for all committed Playwright locator code. It is referenced by `adr_ai_test_generation.md` and must be read before generating or reviewing `*.locators.ts` files. Coding agents do not retain policy across sessions automatically — reload this document each generation run.

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

## Locator file organization

Requirement uiObjects are registered in `tests/docs/requirements/features/shared/canonical_locators.yaml`. TypeScript locator modules implement those contracts under `tests/`.

| Situation | Where to define |
| --- | --- |
| Canonical uiObject used in **two or more** e2e domains | Owning domain `tests/e2e/<domain>/*.locators.ts` or `tests/shared/locators/` — import/re-export elsewhere; **do not duplicate selector strings** |
| Canonical uiObject used in **one** domain only | `tests/e2e/<domain>/*.locators.ts` |
| One-off selector, not a canonical uiObject, used in **one** spec | Inline in that `*.spec.ts` is acceptable |
| New canonical uiObject needed | Add to `canonical_locators.yaml` (requirements) and implement in the appropriate `*.locators.ts` |

Function names should match canonical uiObject names where practical (`projectTitle`, `libraryFilterToolbar`, …).

See `test_suite_layout.md` and `adr_ai_test_generation.md` § Locator file organization.

## Relationship to canonical_locators.yaml

`canonical_locators.yaml` records **semantic** locator strategies and confidence (`confirmed`, `inferred`, `unresolved`).

- Use it to choose **which** uiObject you are implementing and **what** it means.
- Do **not** transliterate strategy prose into XPath or MUI class selectors when policy forbids them.
- `inferred` and `unresolved` entries require live DOM validation or escalation before commit.
- When the YAML strategy implies structure (e.g. `{projectHeader} favourite toggle`), implement with allowed selector tiers — role/name, `data-test-id`, or an added product contract — not forbidden structural fallbacks.

## Explicitly forbidden selectors

The following are **rejected in review** and must not be added in new locator code:

| Pattern | Example | Why |
| --- | --- | --- |
| XPath axes | `xpath=ancestor::div[...]`, `xpath=following-sibling::footer[1]` | Layout-coupled; breaks on DOM refactors |
| MUI / generated CSS classes | `MuiStack-root`, `MuiToolbar-root`, `MuiInputBase-root`, `MuiSkeleton-root` | Generated presentational classes, not product contracts |
| App layout wrappers as primary anchor | `.main-block`, `.main-wrapper` | Shell layout, not feature semantics |
| Chaining through h1 into ancestors | `page.locator('h1').locator('xpath=ancestor::div...')` | Structural probe disguised as semantic heading use |

**Example — forbidden:**

```ts
return page.locator('h1').locator('xpath=ancestor::div[contains(@class,"MuiStack-root")]').first();
```

**Preferred directions when no `data-test-id` exists yet:**

1. `getByRole` / accessible name when the label is a stable product contract.
2. Project `data-test-id` from Menu/uuid patterns (e.g. `edit-project-button` from menu item uuid).
3. Scope by **semantic content** the requirement names (e.g. `getByText('Disciplines', { exact: true })` inside overview), not MUI wrappers.
4. Escalate: add `data-test-id` to React and register in `canonical_locators.yaml`.

## When to add `data-test-id`

This section defines **when** to add a new testing attribute to React vs use an existing selector. It complements § Missing selector contract and the selector hierarchy above.

### Decision flow (per uiObject)

Use this order during generation (including after Playwright MCP DOM inspection):

1. **Check existing contracts first**
   - `canonical_locators.yaml` strategy already `confirmed` with `[data-test-id="…"]`
   - Existing project `data-test-id` in React (grep `react/src` and Menu uuid patterns, e.g. `edit-project-button`)
   - Stable `getByRole` / accessible name when the label is a locked product contract
   - Intentional copy selector when the FR **asserts that copy**

2. **Validate in live DOM (Playwright MCP / test run)**
   - Confirm the candidate selector resolves to exactly the intended surface
   - Confirm it remains stable across the interaction path (open menu, switch tab, hover, etc.)
   - If only forbidden selectors (XPath, MUI classes, layout wrappers) would work → **do not commit those**; proceed to step 3

3. **Add `data-test-id` when appropriate** (React change + registry update)
   - No acceptable selector from step 1–2
   - The uiObject is named in `canonical_locators.yaml` or will be added there
   - The surface is a **container, compound control, or repeated interaction target** (sidebar, form region, card grid, filter toolbar, hover menu host)
   - Role/name/copy would be brittle (mutable label, missing accessibility, duplicate labels on page, third-party widget such as Notistack)
   - Multiple specs or domains will target the same surface (shared uiObject)

4. **Do not add `data-test-id` when**
   - A stable role/name or existing `data-test-id` already suffices
   - The test's purpose is to assert specific user-visible copy and `getByRole`/`getByText` is the assertion
   - The need is one-off, trivially reachable via allowed tier-2/3 selectors, and not a canonical uiObject
   - The only motivation is to avoid writing a proper role/name selector that already exists

### Prefer `data-test-id` over new CSS classes

Do **not** add new CSS classes (or lean on `.main-block`, MUI classes, styled-component classes) solely as test hooks.

| Approach | When |
| --- | --- |
| **`data-test-id`** | Default escalation when a new testability hook is needed |
| **Existing semantic `data-test-id` patterns** | Menu items: `` `${uuid}-button` `` via `Menu.tsx`; nav panels: `panel-library`, etc. |
| **CSS class** | Only when the class is already an intentional, stable product contract unrelated to testing — never MUI/generated/layout classes for test anchoring |

### Implementation checklist (when adding)

A new `data-test-id` is a **product/testability contract**, not a test-only workaround. In the same change set (or a preceding PR that lands before the spec):

1. Add `data-test-id` to the React component (kebab-case, match canonical uiObject where practical)
2. Update `canonical_locators.yaml` entry: `strategy: "[data-test-id=\"…\"]"`, `confidence: confirmed`
3. Implement `tests/e2e/<domain>/*.locators.ts` using the attribute
4. Do not leave parallel brittle selectors in locators “as backup”

**Naming conventions** (follow existing React usage):

- kebab-case: `workflow-edit-section-form`, `workflow-right-sidebar`, `panel-library`
- Prefer the canonical uiObject name: uiObject `projectWorkflowsFilterToolbar` → `data-test-id="project-workflows-filter-toolbar"` when adding new hooks
- Menu-driven actions: reuse `` `${menuItemUuid}-button` `` pattern — do not invent a second id

### MCP's role

Playwright MCP is used to **discover** whether steps 1–2 succeed. It does not replace step 3 when the only alternatives are forbidden selectors. MCP snapshots that show `MuiToolbar-root` or ancestor XPath paths are signals to **add `data-test-id`**, not to commit those selectors.

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

Follow § **When to add `data-test-id`**:

1. Exhaust existing contracts and allowed role/name/copy selectors
2. Validate candidates in live DOM (MCP / test run)
3. Add `data-test-id` to React + `canonical_locators.yaml` when the decision flow says to escalate
4. Otherwise flag the uiObject as blocked pending testability work — do not merge forbidden fallbacks

Legacy options (discouraged for new work):

- centralize a temporary fallback selector with an explicit fragility comment and a linked issue to add `data-test-id`
- block the spec until a testability contract exists

## Anti-patterns

The following are considered poor locator practice unless justified:

- generated class names (including MUI `Mui*` fragments)
- XPath `ancestor::`, `descendant::`, `following-sibling::`, and similar axes
- deeply nested structural selectors
- nth-child selectors tied to layout only
- text selectors for content that is not contractually stable
- selectors inferred from Figma element names without DOM validation
- selectors invented by the generator without evidence in the live app
- duplicating a canonical shared selector in a second domain file instead of importing/re-exporting
- copying `canonical_locators.yaml` strategy prose into XPath/CSS verbatim

## Review rules

A selector should be rejected in review if:

- it matches any pattern in **Explicitly forbidden selectors**
- it cannot be traced to a live DOM observation or stable contract
- it depends on styling or layout structure only
- it depends on mutable copy without reason
- a clearer project-owned contract exists and was ignored
- it was chosen because a generic style guide said so, rather than because it fits this project
- a shared canonical uiObject was reimplemented with a different selector instead of re-exported from the owning module
