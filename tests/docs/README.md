# Documentation Index

This documentation set is divided into three areas:

- `requirements/`: upstream product, feature, and UI intent
- `testing/`: test-generation policy, Playwright authoring rules, browser-tooling guidance, and review standards
- `runbooks/`: operational how-to guides for running browser tests locally (not product requirements)

This separation is intentional.

Requirement documents describe **what the product should do**.
Testing documents describe **how tests are generated, authored, validated, and reviewed**.

These two domains are related, but they must not be conflated.

## Folder map

### `requirements/`
Use this folder for requirement and design-adjacent documents, including:

- functional requirement authoring guidance
- FR-to-UI terminology mapping
- feature-specific requirement documents in `requirements/features/` — see [requirements/features/README.md](requirements/features/README.md)
- legacy or draft requirement references as needed

This folder contains the upstream inputs that browser tests consume.

### `testing/`
Use this folder for testing policy and authoring guidance, including:

- AI-assisted test generation policy
- Playwright authoring rules
- repository layout and folder conventions for `tests/` ([testing/test_suite_layout.md](testing/test_suite_layout.md))
- locator contract policy
- generation workflow guidance
- browser-tooling guidance for generation/review/debugging
- generated test review standards

This folder defines how tests are created from the requirement inputs.

### `runbooks/`
Operational guides for executing browser tests (install, env, database setup, troubleshooting):

- [runbooks/playwright_execution_guide.md](runbooks/playwright_execution_guide.md) — local Playwright E2E execution

## Recommended usage

- Product and design authors primarily work from `requirements/`
- Engineers and reviewers use `testing/` when generating, editing, or reviewing Playwright tests
- Generated browser tests should be traceable back to the relevant requirement document

## Precedence

When documents overlap, use this order:

1. feature-specific requirement documents in `requirements/`
2. testing policy in `testing/adr_ai_test_generation.md`
3. testing standards and review documents in `testing/`
4. example-only guides or illustrative snippets

## Structural rule

Use this decision rule when adding new docs:

- if the document defines product or feature intent, place it in `requirements/`
- if the document defines how tests should be generated or written, place it in `testing/`

# Prompting
make sure to include
"Follow tests/docs/testing/adr_ai_test_generation.md and locator_contract_policy.md"
