# Generated Test Review Checklist

Use this checklist when reviewing AI-generated Playwright tests.

## 1. Requirement traceability

- [ ] The test maps to a specific requirement ID.
- [ ] The test title describes requirement behavior, not implementation trivia.
- [ ] The test includes relevant design evidence IDs where practical.
- [ ] The assertions align with the requirement's acceptance criteria.

## 2. Setup and environment

- [ ] The test states or clearly implies the required user role.
- [ ] The test's initial data assumptions are visible and credible.
- [ ] Hard-coded IDs or routes are justified by the test environment contract.
- [ ] The test would be understandable to a reviewer without hidden setup knowledge.

## 3. Selector legitimacy

- [ ] Selectors appear grounded in real DOM behavior, not invented from design artifacts.
- [ ] Stable project-owned selector contracts are used where available.
- [ ] Mutable text is not used as a selector without justification.
- [ ] Structural selectors are not used when a better contract exists.
- [ ] The selector choice is appropriate for this project, not just generic Playwright guidance.

## 4. Assertion quality

- [ ] The test asserts expected behavior directly.
- [ ] Assertion-driven waiting is used instead of arbitrary sleeps.
- [ ] The test avoids indirect proof when direct proof is available.
- [ ] The failure mode would be informative to a maintainer.

## 5. Helper quality

- [ ] Helpers are narrow and semantically meaningful.
- [ ] No helper returns `null` unless absence is a valid product state.
- [ ] No helper uses `count()` as guard logic for a single expected element.
- [ ] Helpers do not hide important assertions or uncertainty.
- [ ] One-off behavior has not been abstracted prematurely.

## 6. Robustness

- [ ] The test does not rely on arbitrary timing.
- [ ] The test is not brittle against incidental layout changes.
- [ ] The test does not silently branch around expected UI state.
- [ ] The test reflects stable product behavior rather than a transient implementation accident.

## 7. Review decision

A generated test should usually be rejected or revised if any of the following are true:

- selectors are ungrounded
- setup assumptions are hidden
- helper logic is overengineered
- the test masks uncertainty with sleeps or probes
- the test is not clearly traceable to a requirement
- a missing selector contract or product ambiguity is being papered over
