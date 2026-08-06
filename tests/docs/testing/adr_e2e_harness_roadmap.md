# ADR: E2E harness, seed assets, and test isolation

## Status

Accepted

## Date

2026-06-23

Amended 2026-07-31 to adopt one local database, one seed path, stable asset IDs,
and disposable workflow isolation.

## Context

CourseFlow browser tests exercise a real browser, Vite, Django, and Postgres. Local
development and Playwright intentionally use the same `courseflow` database. CI/CD
will eventually provide a temporary Docker database owned by the job.

The earlier harness exposed seeded rows through positional manifest fields and let
multiple specs mutate the same workflow. `serial` groups protected only one describe
block, while other files could still mutate the workflow concurrently. Guards then
converted polluted prerequisites into skipped tests. Fixture purpose and consumers
were distributed across seed code, requirement documents, and specs.

## Decision

### One seed path

`course_flow/e2e_seed/` is the only local content generator. `just e2e-prepare`
migrates the local database, replaces only `E2E FIXTURE -` project trees, writes the
runtime manifest, and refreshes the asset dependency CSV.

There is no local test database, database switch, dev seed, or grouped reseed
workflow.

### Stable asset catalog

`course_flow/e2e_seed/assets.json` is the committed authority for stable asset IDs,
purpose, lifecycle, builder ownership, and capabilities. Examples:

- `actor.teacher`
- `project.primary`
- `workflow.standard_activity`
- `workflow.navigation_course`
- `workflow.restricted_activity`

The runtime manifest records the UUIDs and routes produced for those IDs. Tests must
resolve seeded content by stable ID, never by array position.

`tests/docs/testing/e2e-seed-asset-dependencies.csv` is generated from the catalog
and Playwright declarations. It is the spreadsheet-friendly bird's-eye view of asset
consumers, requirement IDs, actors, and access modes. Edit the catalog or spec
declaration and regenerate the CSV; do not hand-edit the CSV.

`just e2e-assets-check` fails when the generated view is stale or a spec declares an
unknown asset.

### Immutable canonical workflows

Seeded workflow assets are canonical sources. Tests that only navigate or assert may
declare `seedAccess: 'read-only'`; fixture teardown verifies that the graph revision
did not change.

Tests that edit workflow content declare `seedAccess: 'disposable-copy'`. Before the
test, the fixture copies the requested canonical workflow through the production copy
API and rebuilds its handle from the copied Graph View payload. Teardown archives and
permanently deletes the copy with the primary actor's captured token.

Cleanup controls database hygiene only. Correctness does not depend on cleanup because
the next test receives a different copy.

```ts
test.use({
  seedAsset: 'workflow.standard_activity',
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});
```

Tests needing additional workflow types declare `seedAssets`. Non-workflow specs use
`seedDependencies` to make their content dependencies visible in the generated CSV.

### Independent tests

One test may contain a complete destructive lifecycle. Separate tests must not depend
on state created by previous tests, cleanup tests, file order, or retries. Required
fixture corruption is a failure, not a skip. `test.skip` or `test.fixme` is reserved
for explicitly deferred product behaviour.

Alternate users are reserved for permission and team-management requirements. User
allocation is not a content-isolation mechanism.

## Consequences

- Workflow specs import the extended `test` from `tests/fixtures/`.
- Mutating workflow specs can run in parallel without sharing their mutation target.
- Disposable copies can appear briefly in the fixture project during a run.
- Same-project copies preserve project-scoped tags and workflow links.
- Tests must declare assets when they depend on seeded content.
- Seed additions require a catalog entry and a manifest contract assertion.
- CI database provisioning remains separate from test-data isolation.

## Commands

| Purpose | Command |
| --- | --- |
| Prepare local fixtures and manifest | `just e2e-prepare` |
| Regenerate dependency CSV | `uv run cf-check-e2e-assets` |
| Verify catalog and CSV | `just e2e-assets-check` |
| Rebuild the complete local database | `just rebuild-dev-db` |

## Related documents

- [playwright_execution_guide.md](../runbooks/playwright_execution_guide.md)
- [playwright_authoring_standard.md](playwright_authoring_standard.md)
- [ai_test_generation_workflow.md](ai_test_generation_workflow.md)
- [test_suite_layout.md](test_suite_layout.md)
