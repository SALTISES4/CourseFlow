# UI localization migration plan

Status: implementation complete on 2026-09-02; automated verification in progress;
expanded French browser coverage and manual accessibility/visual release QA remain.

## Objective

Make English Canadian and French Canadian first-class UI locales. All system-owned
text visible in the React application must come from the client translation
catalogue or a locale-aware formatter. The backend must return stable semantic
codes and user-authored content, not English presentation labels.

This plan is deliberately resumable. Every phase has an explicit exit gate and the
checklist is the source of implementation status if work is interrupted.

## Confirmed scope and assumptions

- The supported locales are `en-CA` and `fr-CA` in the browser. The existing
  persisted values remain `en-ca` and `fr-ca`; the existing profile API contract
  remains the short values `en` and `fr`. Locale forms are normalized at explicit
  boundaries rather than leaking mixed representations through components.
- The authenticated user's persisted language preference controls the interface.
- English Canadian is the fallback before authentication and when a missing or
  invalid locale is encountered.
- CourseFlow currently has no backend-generated localized exports, email, PDF, or
  non-React presentation client. Therefore the backend does not need a second
  translation catalogue.
- User-authored content remains exactly as authored. Titles, descriptions,
  comments, tags, names, and imported text are not translated.
- Stable domain codes are not translated in storage or transport. They are mapped
  to localized labels only at the rendering boundary.
- This migration may change internal REST response shapes because the React client
  is the only presentation consumer. Backend unit/API tests and the generated
  TypeScript client must change atomically with each contract.

## Current-state evidence

The 2026-09-02 audit found:

- `Utility._t()` is an identity function, not a translation API.
- The TypeScript/TSX inventory contained 391 `_t()` calls: 352 string literals,
  15 template literals, and 24 other dynamic expressions.
- The same inventory found at least 45 raw JSX text nodes and 21 raw
  user-facing/accessibility attributes outside `_t()`.
- `/auth/me` and login user summaries omit `languagePreference`, and
  `mapCurrentUserToEUser` hard-codes English.
- The discipline model and reference APIs transport English `label` values;
  discipline plural text is also stored in the database.
- Activity context, course context, task classification, and time unit APIs
  transport English labels.
- Some expected backend error detail, profile validation text, notification
  messages, duplicate-project placeholder text, and default workflow graph names
  can be displayed as raw English.
- Date/relative-time rendering includes fixed `en-US` formatting and hand-built
  English phrases.
- The document language is fixed to `en`, the MUI date provider has no locale, and
  some component-library strings use English defaults.

The inventory counts are a baseline, not a completion metric by themselves. A
string can be removed from `_t()` and still remain uncontrolled if it is rendered
raw elsewhere.

## Architectural decisions

### Translation runtime

Use `i18next` with `react-i18next`; do not build a custom message parser.

- i18next owns lookup, fallback, interpolation, plural selection, and missing-key
  behavior.
- react-i18next supplies React hooks/components and rerenders on locale change.
- CourseFlow owns a thin adapter for supported-locale normalization, resource
  registration, document metadata, and non-React call sites.
- Translation keys are semantic and stable (`project.form.name.label`), not the
  English source sentence.
- Production fallback is English Canadian. Development/test must make missing
  keys observable and testable.

### Catalogue layout and typing

Use TypeScript resources under `react/src/i18n/locales/{en-CA,fr-CA}/` grouped by
domain. Initial namespaces:

- `common`: generic actions, statuses, pagination, validation, accessibility.
- `auth`: login, registration, password, access errors.
- `profile`: profile, account, notification settings.
- `project`: project forms, overview, archive, duplicate behavior.
- `workflow`: workflow editor, graph, comments, outcomes, system defaults.
- `library`: explore, favourites, filters, library cards.
- `reference`: disciplines, contexts, task classifications, time units.
- `notifications`: notification UI and structured notification templates.

English resources are the TypeScript source shape. French resources must satisfy
the same recursive structure at compile time. Avoid one monolithic JSON file and
avoid runtime-generated keys except for closed, typed code sets.

### Locale ownership and bootstrap

Locale resolution order:

1. Authenticated user's `languagePreference` from the current-user response.
2. A locally retained pre-authentication choice, if a locale switch is supported
   outside the authenticated shell.
3. `en-CA` fallback.

On locale change:

- call `i18n.changeLanguage()`;
- set `document.documentElement.lang` to `en-CA` or `fr-CA`;
- switch date-fns/MUI date-picker locale and MUI component locale text;
- invalidate/re-sort any memoized localized option lists;
- persist the profile preference when the change was initiated in settings.

The application must not briefly render a whole English authenticated shell before
switching to French. The bootstrap may show a locale-neutral loading surface until
the current-user locale is known.

### Domain/reference labels

The backend owns membership and stable codes. The frontend owns presentation.

- Discipline identity is `Discipline.code`; never key translations by database ID
  or English label.
- Remove `Discipline.label` and `Discipline.translation_plural` after every caller
  has been converted.
- Change discipline/reference DTOs to code/value-only responses.
- Localize with closed mappings such as
  `reference.discipline.<code>` and
  `reference.taskClassification.<value>`.
- Sort visible options with `Intl.Collator(activeLocale)` after translation.
  Backend/database English ordering is not a presentation contract.
- Unknown codes must render an explicit, non-crashing fallback and emit a
  development/test signal. Silently displaying an untranslated code is not the
  primary behavior.

### Backend errors and system messages

User interfaces must not use backend English prose as a lookup key or branching
contract.

- Expected errors use stable machine codes plus structured parameters and field
  association where applicable.
- The frontend maps those codes to translation keys and interpolates parameters.
- Backend `detail` may remain as diagnostic text during transition, but React must
  not render it for a recognized expected error.
- Unknown/unexpected failures render a localized generic message and remain
  observable through status/code/logging. Do not expose arbitrary server detail.
- Replace logic such as checking whether `detail` contains `"archived"` with a
  stable error code.
- Notifications generated by the system store a message code and JSON parameters,
  not a finalized English sentence. Existing legacy message rows need a safe
  display fallback; user-authored notification content, if introduced, remains
  content rather than a translation key.
- Persisted system defaults (default channel/category titles and copy suffixes)
  require semantic handling. New records should not bake the current UI language
  into a value that is intended to be a system label. User-renamed values remain
  authored content.

## Migration phases

### Phase 0 — Baseline, plan, and safeguards

- [x] Inventory `_t()` calls, raw JSX/attributes, backend label DTOs, raw error
  paths, persisted system strings, and locale-sensitive formatting.
- [x] Confirm that backend-localized presentation output and non-React clients are
  out of scope.
- [x] Record architectural decisions and resumable implementation phases here.
- [x] Capture baseline frontend build, focused frontend tests, backend unit/API
  tests, and OpenAPI generation status before contract edits.
- [x] Add a repeatable localization audit/check that ignores tests, generated code,
  and user-content fixtures while detecting newly introduced uncontrolled UI text.

Exit gate: the plan and baseline commands are committed alongside a reproducible
inventory/check.

Baseline note (2026-09-02): `yarn build` passed. The focused auth/user/reference/
project API test set reported 51 passed and 3 pre-existing failures in
`test_auth_api.py`; those three tests expect obsolete response-envelope shapes
(`item` around `/auth/me` and unwrapped project fields).

### Phase 1 — Install and bootstrap the client runtime

Primary files:

- `react/package.json`, `react/yarn.lock`
- `react/src/i18n/index.ts`
- `react/src/i18n/config.ts`
- `react/src/i18n/types.d.ts`
- `react/src/i18n/locales/en-CA/*`
- `react/src/i18n/locales/fr-CA/*`
- `react/src/app.tsx`
- `react/index.html`

Tasks:

- [x] Add `i18next` and `react-i18next` as production dependencies.
- [x] Define `SupportedLocale`, persisted-locale normalization, fallback locale,
  namespaces, and typed resources.
- [x] Initialize i18next before rendering localized application content.
- [x] Provide locale-aware date-fns, MUI date picker, and MUI component locale
  configuration from the same active locale.
- [x] Keep `<html lang>` synchronized with runtime locale.
- [x] Add automated tests for locale normalization, fallback, interpolation, plural
  selection, and catalogue parity.
- [x] Add a development/test missing-key reporting strategy.

Exit gate: a minimal component changes immediately between English and French,
including plural and formatted-date examples, with no reload and no stale MUI
locale.

### Phase 2 — Repair the authenticated locale contract

Primary files:

- `course_flow/api/schemas/auth.py`
- `course_flow/application/services/user_service.py`
- authentication/current-user API tests
- generated files under `react/src/api/gen/`
- `react/src/context/mapCurrentUserToEUser.ts`
- authentication bootstrap/context files
- profile settings form and tests

Tasks:

- [x] Add `languagePreference` to every current-user/login summary that can seed
  the authenticated client.
- [x] Remove the hard-coded English mapping.
- [x] Normalize persisted `en-ca`/`fr-ca` exactly once at the client boundary.
- [x] Apply a successful profile language update immediately and keep cached user
  state consistent with the server.
- [x] Ensure logout/login and token restoration resolve locale deterministically.
- [x] Regenerate the OpenAPI client and update handwritten projections.
- [x] Expand profile-setting tests from persistence-only coverage to actual UI
  language behavior.

Exit gate: a user stored as `fr-ca` starts in French and a settings change updates
the shell immediately and survives reload/login.

### Phase 3 — Migrate controlled frontend copy

Migrate in vertical slices so each namespace remains reviewable:

1. Global shell, navigation, generic actions, dialogs, snackbar fallbacks, empty
   states, loading states, and accessibility labels.
2. Authentication and account/profile/settings.
3. Project creation/edit/overview/archive/duplicate flows.
4. Library/explore/favourites/search/filter flows.
5. Workflow creation, header, tabs, sidebars, graph editing, outcomes, and comments.
6. Notifications and remaining deferred surfaces that are currently reachable.

For every slice:

- [x] Replace `_t("English source")` with a semantic `t("namespace:key")` call.
- [x] Replace dynamic/template translation keys with keyed interpolation.
- [x] Replace manual singular/plural branches with i18next plural rules using a
  numeric `count` parameter.
- [x] Move raw JSX text and attributes (`aria-label`, `title`, `placeholder`, image
  `alt`, tooltip content) into the catalogue.
- [x] Keep user-authored content outside `t()` and interpolate it only into
  system-owned templates.
- [x] Convert non-component call sites through the CourseFlow adapter or pass
  already-localized text from a component; do not call hooks illegally.
- [x] Add focused catalogue/contract and E2E coverage in both locales for behavior
  that depends on grammar/interpolation.
- [x] Delete `Utility._t()` after the final call site is gone.

Exit gate: production React source contains no `_t()` call and the audit allowlist
contains only documented non-user-facing literals or user-content paths.

### Phase 4 — Localize formatting and third-party UI

- [x] Replace fixed `en-US` date/time formatting with helpers driven by the active
  locale.
- [x] Replace hand-built relative-time English with `Intl.RelativeTimeFormat` or
  keyed plural messages where product phrasing requires it.
- [x] Localize number and percentage output where visible.
- [x] Configure MUI pagination, date pickers, and other MUI default copy.
- [x] Supply localized file-upload/dropzone validation and rejection messages.
- [x] Audit rich-text editor, graph controls, browser confirmation prompts, and
  validation libraries for embedded English.
- [ ] Verify French text expansion, wrapping, truncation, and mobile layouts.

Exit gate: there is no fixed English locale in UI formatting and no reachable
third-party control exposes its default English copy in French mode.

### Phase 5 — Make fixed reference APIs code-only

Primary backend areas:

- `course_flow/core/models/discipline.py`
- `course_flow/core/discipline_catalogue.py`
- discipline seed/migration code
- `course_flow/core/reference_data.py`
- `course_flow/api/schemas/reference_data.py`
- `course_flow/api/routers/reference_data.py`
- project, project-relations, and library DTO/service projections
- relevant API/unit/E2E seed tests

Primary frontend consumers:

- `react/src/hooks/useReferenceData.ts`
- project forms and project overview
- library filters/search
- node editor and workflow legend
- `reference` namespace resources and typed lookup helpers

Tasks:

- [x] Add complete English and French labels for every current discipline code.
- [x] Add complete label maps for context, task-classification, and time-unit codes.
- [x] Introduce typed lookup helpers with an explicit unknown-code policy.
- [x] Change reference/project/library contracts to return only stable code/value.
- [x] Translate and locale-sort options in React; ensure caches do not freeze a
  previous locale's labels/order.
- [x] Change discipline seed/catalogue definitions to codes only.
- [x] Add a Django schema migration removing discipline `label` and
  `translation_plural` after all backend reads are removed.
- [x] Regenerate OpenAPI TypeScript types and update contract tests.
- [x] Add catalogue-completeness tests comparing backend codes with both locale
  resources, so adding a code without translations fails CI.

Exit gate: no backend response or database discipline row owns a presentation
label, all current codes have two translations, and visible option ordering follows
the active locale.

### Phase 6 — Remove raw backend prose from UI contracts

- [x] Define the common expected-error payload (`code`, optional `params`, optional
  field errors) and document its compatibility rules.
- [x] Convert authentication expected failures to codes.
- [x] Convert profile/password validation responses to field error codes and
  parameters.
- [x] Convert project/workflow archived-state and conflict errors used by React;
  remove English substring branching.
- [x] Replace generic snackbar rendering of `response.message` with code-aware
  mapping and a localized unexpected-error fallback.
- [x] Replace duplicate-project placeholder prose with a structured state/result.
- [x] Inventory every remaining `.detail`, `.message`, and field-error renderer and
  classify it as expected structured error, user content, or forbidden raw prose.
- [x] Update backend and frontend contract tests for recognized and unknown codes.

Exit gate: React does not present arbitrary backend diagnostic text, and expected
errors preserve specific localized guidance.

### Phase 7 — Migrate persisted system-generated labels and notifications

- [x] Enumerate default channel/category/title values and copy suffixes that are
  currently persisted as English.
- [x] Separate system-default identity from user-authored override in the domain
  model. Do not infer identity forever from equality with an old English string.
- [x] Render untouched system defaults from translation keys; render overrides as
  authored content.
- [x] Define a conservative data migration/backfill for existing known defaults,
  including
  collision behavior when a user intentionally typed the same text.
- [x] Change system notifications to store `message_code` plus validated JSON
  parameters.
- [x] Preserve a legacy `message` display path only for existing rows, mark it as
  legacy content, and prevent new system producers from using it.
- [x] Add tests proving that switching locale changes system labels/notifications
  but not authored names/comments.

Exit gate: new system-owned persisted values are locale-neutral, existing data is
handled deterministically, and authored content is never accidentally translated.

### Phase 8 — Requirements, E2E, enforcement, and release gate

- [x] Add a canonical localization functional requirement covering locale source,
  fallback, immediate switching, persistence, system-owned text, authored content,
  formatting, accessibility copy, and unknown-code behavior.
- [x] Amend requirements that currently mandate English discipline labels or
  English alphabetical ordering to require localized labels and locale-aware
  collation.
- [x] Keep English E2E scenarios deterministic by setting the test user's locale
  explicitly rather than relying on defaults.
- [x] Add focused French E2E coverage for immediate profile switching, localized
  shell/profile copy, authored-value preservation, document language, and reload
  persistence.
- [ ] Expand the French E2E matrix to cover fresh login/bootstrap, discipline
  collation, workflow reference/system labels, date formatting, and expected
  errors.
- [x] Update selectors to prefer stable roles/test IDs where exact English text is
  not the behavior under test.
- [x] Run locale catalogue parity, forbidden `_t()`, and uncontrolled-UI-literal
  checks in the frontend CI build.
- [ ] Modernize the existing legacy backend CI job so backend-code coverage and
  generated OpenAPI drift are enforced there rather than only checked locally.
- [x] Run frontend TypeScript build, backend lint/unit/API tests,
  requirement/catalogue checks, migration drift, generated OpenAPI client, and
  Playwright test discovery locally. There is no configured frontend unit-test
  runner in this repository.
- [ ] Run the focused English/French browser suites against a migrated, prepared
  E2E database.
- [ ] Perform keyboard/screen-reader and responsive visual checks in both locales.

Exit gate: requirements, implementation, generated contracts, and automated tests
agree; both locales pass the release matrix; no undocumented allowlist violations
remain.

## Verification snapshot — 2026-09-02

Passed after the implementation:

- `yarn check-i18n`: uncontrolled-string audit, exact English/French catalogue
  parity, locale normalization, fallback, interpolation, plurals, system labels,
  authored interpolation, notification templates, and missing-key behavior.
- `yarn build`: TypeScript and production Vite build after regenerating the client.
- `yarn openapi-gen`: client regenerated from the live Django Ninja OpenAPI schema;
  generation completed with no errors (generator-owned lint warnings remain).
- `uv run pytest course_flow/tests -q`: 225 tests passed. The subsequently added
  conservative system-label migration test also passed in its three-test module.
- `uv run ruff check course_flow --exclude course_flow/tests/test_hierarchy.py`:
  passed. The excluded unchanged test contains one pre-existing unused import.
- `uv run python manage.py makemigrations --check --dry-run`: no model drift.
- Ruby YAML parse: all nine new or amended requirement files parsed.
- `yarn test-list`: all 795 Playwright tests in 55 files were discovered and
  transformed successfully.

Not executed locally:

- Browser execution. Vite and Django were not running, the development database
  has the three new migrations unapplied, and preparing it would replace shared
  deterministic E2E fixture trees. Do not mutate that database implicitly; run
  the checked-in browser scenarios after an explicit `just e2e-prepare` decision.
- Manual French responsive, keyboard, and screen-reader review.

## Testing strategy

### Unit and contract tests

- Locale normalization: accepted persisted/API values and fallback behavior.
- Catalogue parity: identical key shapes for English and French.
- Closed-code coverage: every backend enum/catalogue code has both labels.
- Translation semantics: interpolation escaping, zero/one/many plural forms, and
  unknown keys/codes.
- Locale helpers: dates, relative time, numbers, and collation.
- API contracts: current-user locale, code-only reference DTOs, structured errors,
  and notification templates.

### Component and integration tests

- Components render correct accessible names in both locales.
- A live language change rerenders text, dates, MUI controls, and sorted options.
- User-authored text remains unchanged across locale changes.
- Recognized server error codes render specific messages; unknown failures render a
  generic localized message without leaking server prose.

### E2E coverage

Do not duplicate the entire suite in French. Keep the main suite explicitly English
and add a focused French matrix for translation boundaries and the highest-value
flows. Exact copy assertions are appropriate where localization is the requirement;
otherwise use stable semantic selectors.

## Migration and rollout constraints

- Merge code and schema migrations in deployable order. A process running old code
  must not read removed discipline columns after the database migration.
- If zero-downtime mixed-version deployment is required, split discipline field
  removal into expand/migrate/contract releases. If deployments are atomic, the
  code/schema removal may ship together after tests.
- Generated API code is an artifact of the OpenAPI schema and must never be edited
  as the primary source.
- Do not let `useReferenceData` cache already-localized labels indefinitely. Cache
  semantic codes, derive labels/order from the active locale.
- Translation catalogue completion is a code-review requirement. Machine
  translation may assist drafting but is not accepted as unreviewed product copy.

## Principal risks and mitigations

| Risk | Failure mode | Mitigation |
| --- | --- | --- |
| Partial migration | English leaks into French through raw JSX, errors, or vendor defaults | Automated audit plus French boundary E2E |
| Dynamic `_t()` migration | A runtime-composed sentence becomes an invalid/missing key | Replace with semantic key and interpolation; review all 39 non-literal calls manually |
| Locale bootstrap race | French users see English or tests become flaky | Gate authenticated shell until current-user locale is applied |
| Backend label removal | Hidden code compares/orders by English label | Search all reads, add code-only contract tests, remove columns only after callers are gone |
| Unknown catalogue code | Blank or raw technical value in production | Explicit fallback plus development/test failure and code-coverage CI |
| Cached translated options | Language changes but labels/order do not | Cache codes only; derive localized views with locale dependency |
| Error over-generalization | Specific actionable validation becomes a generic failure | Stable error codes, params, field association, and contract tests |
| Authored/system ambiguity | User text is translated or defaults are frozen in one language | Store explicit system-default identity separately from authored override |
| Requirement drift | Tests continue enforcing English-only behavior | Update canonical functional requirements before final E2E gate |
| French text expansion | Clipping/truncation makes controls unusable | Responsive visual checks and targeted layout fixes, not shortened inaccurate copy |

## Definition of done

The migration is complete only when all of the following are true:

- A user's `fr-ca` preference produces a French interface from authenticated
  bootstrap through reload; `en-ca` produces English Canadian.
- All reachable system-owned React text, accessible names, expected errors, and
  third-party control text are localized.
- Interpolation, pluralization, dates, relative time, numbers, and sorting are
  locale-aware.
- User-authored content is preserved verbatim.
- Discipline and other fixed reference presentation labels no longer live in the
  backend/API; all codes are covered by both client catalogues.
- React never branches on or presents arbitrary backend diagnostic prose.
- New system-generated persisted labels/messages are locale-neutral and legacy
  data behavior is tested.
- `Utility._t()` is deleted.
- Catalogue parity, code coverage, uncontrolled-string checks, generated-contract
  checks, unit/integration tests, and the focused bilingual E2E matrix pass.
- Canonical functional requirements describe the implemented bilingual behavior.

## Resumption protocol

When resuming this work:

1. Read this document and find the first unchecked task in the earliest incomplete
   phase.
2. Inspect `git status` and preserve unrelated changes.
3. Verify the previous phase's exit gate; do not infer completion from a checked
   box alone.
4. Update checkboxes in the same change that supplies their evidence.
5. Record any scope or architectural change under "Decision log" before applying
   it.

## Decision log

- 2026-09-02: selected i18next/react-i18next rather than a custom runtime.
- 2026-09-02: confirmed that backend-localized exports/emails/PDFs and non-React
  presentation clients are not currently required.
- 2026-09-02: approved client-owned discipline/reference translations keyed by
  stable backend codes, with eventual removal of backend label fields.
- 2026-09-02: graph channels use an explicit `system_label_code`; channels,
  sections, nodes, and outcomes keep authored base titles plus a numeric
  `title_copy_count`. Copy suffixes are rendered in the active locale instead of
  being persisted as English.
- 2026-09-02: migration 0022 backfills only exact generated default-channel
  signatures. Existing free-form `(copy)` titles are not guessed from text because
  authored/system provenance is ambiguous.
- 2026-09-02: workflow-copy dialog titles remain authored values because the user
  sees and can edit the proposed title before submitting it; hidden graph entity
  duplication uses semantic copy counters.
- 2026-09-02: new system notifications must use the closed message-code registry
  and validated parameters. Existing rows retain an explicit legacy-content path.
