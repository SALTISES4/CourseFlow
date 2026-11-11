# Project snapshot export and import

## Purpose and boundary

Project snapshots are the machine-readable, versioned transfer format for one
complete CourseFlow project closure. They are used to preserve selected UAT data
across destructive rebuilds and are the destination-side foundation for future
v1 migration and general import/export.

This is not a Django fixture. Snapshot references are independent of database
primary keys, the payload is validated before writes, and import is one database
transaction.

## Export a v2 project

```bash
uv run python manage.py cf_export_project_snapshot \
  193cfbb1-3abc-42f2-a80c-a5c068a80460 \
  --source-system courseflow-v2-uat \
  --output course_flow/project_snapshots/project_for_templates.v1.json
```

The command refuses to overwrite an existing file unless `--overwrite` is
passed. It also refuses to export a project whose linked-workflow closure or tag
ownership cannot be represented without loss.

The source adapter records counts for intentionally excluded collaboration and
operational state:

- comments;
- team membership;
- project/workflow favourites;
- workspace edit locks.

User identity is not stored in the snapshot. The destination owner is an import
policy supplied separately.

## Import a project

The repository-level shortcuts use the checked-in snapshot and canonical E2E
owner by default:

```bash
just io::import-project
just io::import-project-copy
```

The first preserves snapshot UUIDs; the second regenerates them. Override the
snapshot and owner positionally when needed:

```bash
just io::import-project custom/project.json owner@example.com
```

The underlying management command is:

```bash
uv run python manage.py cf_import_project_snapshot \
  course_flow/project_snapshots/project_for_templates.v1.json \
  --owner-email teacher@courseflow.com
```

The default identity policy preserves source UUIDs and refuses any collision
before creating content. This is the correct policy for an empty environment
rebuild. Use `--regenerate-identities` only for copy-style imports where new
destination identities are required.

Import prerequisites:

- the destination owner already exists;
- every discipline code in the snapshot exists in reference data;
- the whole snapshot passes schema, fingerprint, and aggregate validation.

The writer creates the project, workflows, typed metadata, graph layout, nodes,
edges, outcomes, tag relations, linked workflows, and horizontal outcome groups
in one transaction. It does not create comments, contributors, favourites, edit
locks, or public/user session state.

## UAT rebuild integration

`cf_rebuild_uat_database` performs these steps in order:

1. drop the guarded UAT application schema;
2. migrate;
3. create canonical E2E users and reference data;
4. invoke `cf_import_project_snapshot` for
   `course_flow/project_snapshots/project_for_templates.v1.json`, owned by
   `teacher@courseflow.com`.

The UAT Compose overlay disables entrypoint migrations. This command is the
single owner of the migrate, seed, and import sequence; Django startup only
serves the already rebuilt database.

The imported source project is private, active, and **not** flagged as a template,
because that is its authoritative UAT state. Its title does not override those
flags. Change template/publication state through an explicit product decision
and a reviewed snapshot update.

## Contract maintenance

The application contract lives in
`course_flow/application/project_transfer/contract.py`; its generated JSON Schema
is `docs/schemas/project_snapshot_v1.schema.json`. A test requires the checked-in
schema to exactly match the model.

The future v1 extractor must be a separate source adapter that emits
`ProjectSnapshotBundle`. It must reuse the validator and `ProjectImportService`.
Do not import v1 Django models into v2 and do not add a legacy-only destination
writer.

Current limitations are intentional: there is no update/merge operation,
persisted import provenance/idempotency key, batch/job model, user-facing API, or
background worker. Preserved UUID collision rejection prevents accidental
duplicates for rebuild imports, but it is not a substitute for the provenance
model required by general user imports.
