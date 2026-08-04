# Testing Documentation Index

This folder contains the policy and operating documents for AI-assisted test generation and Playwright authoring.

These documents are intended to sit alongside the project's requirement documents under `tests/docs/requirements/`.

## Relationship to documentation structure

The repository documentation is divided into:

- `tests/docs/requirements/`: feature intent, requirement guidance, terminology mapping, and feature-specific requirement documents
- `tests/docs/testing/`: test-generation policy, Playwright authoring rules, locator policy, workflow guidance, and review standards

This folder defines the testing side of that split.

## Document map

### 1. ADR: AI-Assisted Test Generation
- File: `adr_ai_test_generation.md`
- Purpose: defines architectural decisions, scope, source-of-truth hierarchy, and the required workflow for generating Playwright tests with AI assistance.

### 2. Playwright Authoring Standard
- File: `playwright_authoring_standard.md`
- Purpose: defines how tests should be written, including locator rules, waiting rules, helper design, assertions, and debugging expectations.

### 3. Locator Contract Policy
- File: `locator_contract_policy.md`
- Purpose: defines which selector types are acceptable, when `data-test-id` hooks should be added (existing contract → MCP validate → escalate), when `data-*` contracts are required, and when generated tests must reject unstable selectors.

### 4. AI Test Generation Workflow
- File: `ai_test_generation_workflow.md`
- Purpose: defines the end-to-end workflow from requirement review through live DOM validation, generation, execution, and human review.

### 5. Generated Test Review Checklist
- File: `generated_test_review_checklist.md`
- Purpose: provides a practical acceptance rubric for reviewing generated Playwright tests before merge.

### 6. Browser Automation Tooling Guide
- File: `browser_automation_tooling_guide.md`
- Purpose: explains how Playwright MCP and `playwright-cli` should be used during test generation, review, and debugging — including E2E environment prerequisites, per-requirement DOM validation, committed artifact rules, and the agent prompt pattern — while keeping authored Playwright tests as the final artifact.

### 7. Test suite layout
- File: `test_suite_layout.md`
- Purpose: defines where specs, setup, helpers, and locators live under `tests/`.

### 8. E2E harness roadmap
- File: [adr_e2e_harness_roadmap.md](adr_e2e_harness_roadmap.md)
- Purpose: accepted architecture for seed assets, manifest IDs, disposable workflows, and CI ownership.

### 9. Playwright execution runbook
- File: [../runbooks/playwright_execution_guide.md](../runbooks/playwright_execution_guide.md)
- Purpose: how to install dependencies, configure env, run headless/UI/debug modes, prepare deterministic fixtures, and troubleshoot local browser test execution.

## Relationship to requirement docs

These documents assume the continued use of requirement documents under `tests/docs/requirements/`.

Those requirement documents remain the upstream source of product intent, but they do **not** define the project's test-generation architecture. This folder closes that gap.

## Recommended precedence

When these documents appear to overlap, use this precedence:

1. Feature-specific requirement documents in `tests/docs/requirements/`
2. `adr_ai_test_generation.md`
3. `locator_contract_policy.md`
4. `playwright_authoring_standard.md`
5. `ai_test_generation_workflow.md`
6. [adr_e2e_harness_roadmap.md](adr_e2e_harness_roadmap.md) (harness phases — fixtures, generation, CI)
7. [playwright_execution_guide.md](../runbooks/playwright_execution_guide.md) (local run commands and env — not product requirements)
7. Example-only guidance and illustrative snippets

## Expected usage

- Requirement authors work from `tests/docs/requirements/`
- Engineers and AI agents use this folder when generating or reviewing tests
- QA-supported browser automation tooling may be used during generation, review, and debugging as described in `browser_automation_tooling_guide.md`
- PR reviewers use the review checklist to decide whether a generated test is acceptable
