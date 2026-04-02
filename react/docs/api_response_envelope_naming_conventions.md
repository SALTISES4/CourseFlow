# API Response Envelope Naming Conventions

## Public contract intent

- Successful responses should be semantically legible without generic transport wrappers.
- Avoid vague keys like `message` and `dataPackage` in headless API contracts.
- Use resource-shaped responses for singular CRUD endpoints.

## Shapes

### Rule A: singular canonical resource

For a singular detail response, the payload must use envelope form.

#### Envelope form

`item` is required, not optional.

```ts
type GetProjectResp = {
  item: ProjectDetail
}
```

There is no valid singular detail shape where `item` is skipped.
- **Homogeneous collection**: return `{ items: [...] }`, optionally with `meta`.
  - `meta` is only for machine-readable auxiliary data (counts, pagination, cursors).
- **Grouped/projection payloads**: use domain-specific keys at the root.
  - Example: `{ owned: [...], editable: [...], deleted: [...] }`.

## Naming constraints

- Do not use `message` for successful transport metadata.
- Do not use generic wrapper names (`dataPackage`, `payload`, etc.) when a specific shape is known.
- Prefer explicit domain keys (`items`, `owned`, `editable`, `deleted`, `workflow`, `nodes`, etc.).
