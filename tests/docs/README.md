# Documentation Index

This documentation set is divided into two primary domains:

- `requirements/`: upstream product, feature, and UI intent
- `testing/`: test-generation policy, Playwright authoring rules, browser-tooling guidance, and review standards

This separation is intentional.

Requirement documents describe **what the product should do**.
Testing documents describe **how tests are generated, authored, validated, and reviewed**.

These two domains are related, but they must not be conflated.

## Folder map

### `requirements/`
Use this folder for requirement and design-adjacent documents, including:

- functional requirement authoring guidance
- FR-to-UI terminology mapping
- feature-specific requirement documents
- legacy or draft requirement references as needed

This folder contains the upstream inputs that browser tests consume.

### `testing/`
Use this folder for testing policy and operating guidance, including:

- AI-assisted test generation policy
- Playwright authoring rules
- repository layout and folder conventions for `tests/` ([testing/test_suite_layout.md](testing/test_suite_layout.md))
- locator contract policy
- generation workflow guidance
- browser-tooling guidance for generation/review/debugging
- generated test review standards

This folder defines how tests are created from the requirement inputs.

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

## Source of truth for implementation work

This folder is not only input for Playwright generation. It is the **authoritative specification of product and UI behavior** for the CourseFlow application.

Engineers and AI agents should consult `requirements/` when:

- Debugging incorrect or regressed UI behavior
- Refactoring features where expected behavior is not obvious from code
- Deciding whether a change is a bug fix or a spec change

Technical architecture (HTTP contracts, Redux graph model, repository layout) lives in `docs/architecture/`, not here. See [docs/architecture/adr_functional_requirements_source_of_truth.md](../../docs/architecture/adr_functional_requirements_source_of_truth.md).

## Structural rule

Use this decision rule when adding new docs:

- if the document defines product or feature intent, place it in `requirements/`
- if the document defines how tests should be generated or written, place it in `testing/`
