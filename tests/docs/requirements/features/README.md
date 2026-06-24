# Feature requirements (`features/`)

Canonical, normalized functional requirement YAML for CourseFlow. Each file is a feature spec (`*_requirements_v1.yaml`) consumed by Playwright E2E authoring and product debugging.

Folder layout mirrors product domains (aligned with `tests/e2e/` and `tests/docs/testing/test_suite_layout.md`). Files stay **flat within each domain folder** — the filename prefix (`workflow_`, `project_`, …) provides secondary grouping.

## Layout

| Folder | Scope | Examples |
| ------ | ----- | -------- |
| `shared/` | Cross-route contracts, locator registry, workspace access | `canonical_locators.yaml`, `workspace_access_requirements_v1.yaml` |
| `auth/` | Login, register, password flows | `login_requirements_v1.yaml` |
| `navigation/` | App shell navigation | `main_navigation_requirements_v1.yaml` |
| `home/` | Authenticated home | `homepage_requirements_v1.yaml` |
| `library/` | Library, Explore, Favourites | `library_page_requirements_v1.yaml` |
| `project/` | Project workspace and forms | `project_overview_requirements_v1.yaml` |
| `workflow/` | Workflow editor (sections, nodes, channels, outcomes, sidebar, …) | `workflow_edit_section_requirements_v1.yaml` |
| `user/` | Account and notification settings | `profile_settings_requirements_v1.yaml` |
| `deferred/` | Specs extracted or deferred from active scope | `notifications_page_requirements_v1.yaml` |

Playwright specs for these domains live under `tests/e2e/<domain>/` (e.g. `tests/e2e/home/homepage-fr-001-004.spec.ts` for this folder's `home/` requirements).

## Conventions

- **Cross-references** use full repo paths, e.g. `tests/docs/requirements/features/workflow/workflow_edit_section_requirements_v1.yaml`.
- **New feature specs** go in the domain folder that matches the primary screen or route under test.
- **Shared uiObjects** used across domains belong in `shared/` (or define once in the owning domain file and reference by path elsewhere).
- Authoring rules: [../guidelines_functional_requirements.md](../guidelines_functional_requirements.md). Normalization ADR: [../adr_requirement_normalization_for_test_generation.md](../adr_requirement_normalization_for_test_generation.md).
