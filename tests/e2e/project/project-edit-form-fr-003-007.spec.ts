import { test, expect } from '@playwright/test';
import { DISCIPLINE_CATALOGUE_AZ } from '../../helpers/discipline-catalogue';
import {
  expectEditProjectFormPrimaryLayoutPerFrProjForm003,
  expectEditProjectSnackbarMessage,
  loadedProjectDisciplineLabelsFromOverview,
  projectDisciplineFieldSelectedLabels,
  PROJECT_EDIT_SNACKBAR_MESSAGES,
} from '../../helpers/edit-project-form';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { getProjectPath, loadWorkflowManifest } from '../../helpers/manifest';
import {
  selectProjectDisciplineOption,
} from '../../helpers/project-discipline';
import {
  expectProjectOverviewShowsSubmittedFormValues,
  fetchProjectDetail,
  projectMetadataBlockDisplayedValue,
} from '../../helpers/project-overview';
import {
  createProjectDialog,
  editProjectFormSubmitButton,
  openEditProjectDialog,
  PROJECT_OVERVIEW_METADATA_LABELS,
  PROJECT_UPDATE_API_ROUTE,
  projectDescriptionField,
  projectFormCancelButton,
  projectTitle,
  projectTitleField,
  waitForProjectOverviewLoaded,
} from './project.locators';

/**
 * Calibration slice — FR-PROJ-FORM-003, FR-PROJ-FORM-006, FR-PROJ-FORM-007 (partial).
 * Requirements: tests/docs/requirements/features/project/project_edit_form_requirements_v1.yaml
 * Auth: chromium project storage state (teacher@courseflow.com).
 * Note: edit entry is project ActionMenu (edit-project-button), not contextActionBar pencil.
 */

test.describe('Edit project form — calibration (FR-PROJ-FORM-003-007)', () => {
  const manifest = loadWorkflowManifest();
  const projectPath = getProjectPath(manifest);

  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, projectPath);
    await waitForProjectOverviewLoaded(page);
  });

  test('FR-PROJ-FORM-003: edit dialog layout, labels, required Title, and prefilled fields', async ({
    page,
  }) => {
    const expectedDisciplines = await loadedProjectDisciplineLabelsFromOverview(page);
    await openEditProjectDialog(page);
    await expectEditProjectFormPrimaryLayoutPerFrProjForm003(
      page,
      manifest.project_uuid,
      expectedDisciplines,
    );
  });

  test('FR-PROJ-FORM-003: cancel discards title, description, and discipline changes', async ({
    page,
  }) => {
    const originalTitle = await projectTitle(page).innerText();
    const project = await fetchProjectDetail(page, manifest.project_uuid);
    const originalDescription = project.description ?? '';
    const originalDisciplines = await loadedProjectDisciplineLabelsFromOverview(page);
    const originalOverviewDescription = await projectMetadataBlockDisplayedValue(
      page,
      PROJECT_OVERVIEW_METADATA_LABELS.description,
    );
    const originalOverviewDisciplines = await projectMetadataBlockDisplayedValue(
      page,
      PROJECT_OVERVIEW_METADATA_LABELS.disciplines,
    );

    const disciplineToToggle =
      DISCIPLINE_CATALOGUE_AZ.find((label) => !originalDisciplines.includes(label)) ??
      DISCIPLINE_CATALOGUE_AZ[0]!;

    await openEditProjectDialog(page);
    await projectTitleField(page).fill(`${originalTitle} mutated`);
    await projectDescriptionField(page).fill('E2E cancel should discard this description');
    await selectProjectDisciplineOption(page, disciplineToToggle);

    await projectFormCancelButton(page).click();
    await expect(createProjectDialog(page)).toBeHidden();
    await expect(projectTitle(page)).toHaveText(originalTitle);
    expect(
      await projectMetadataBlockDisplayedValue(
        page,
        PROJECT_OVERVIEW_METADATA_LABELS.description,
      ),
    ).toBe(originalOverviewDescription);
    expect(
      await projectMetadataBlockDisplayedValue(
        page,
        PROJECT_OVERVIEW_METADATA_LABELS.disciplines,
      ),
    ).toBe(originalOverviewDisciplines);

    await openEditProjectDialog(page);
    await expect(projectTitleField(page)).toHaveValue(originalTitle);
    await expect(projectDescriptionField(page)).toHaveValue(originalDescription);
    expect(
      [...(await projectDisciplineFieldSelectedLabels(page))].sort((a, b) =>
        a.localeCompare(b),
      ),
    ).toEqual([...originalDisciplines].sort((a, b) => a.localeCompare(b)));
  });

  test('FR-PROJ-FORM-007: submit stays disabled until any field is changed', async ({ page }) => {
    const originalDisciplines = await loadedProjectDisciplineLabelsFromOverview(page);
    const disciplineToToggle =
      DISCIPLINE_CATALOGUE_AZ.find((label) => !originalDisciplines.includes(label)) ??
      DISCIPLINE_CATALOGUE_AZ[0]!;

    await openEditProjectDialog(page);
    await expect(editProjectFormSubmitButton(page)).toBeDisabled();

    await projectDescriptionField(page).fill('E2E dirty via description');
    await expect(editProjectFormSubmitButton(page)).toBeEnabled();
    await projectFormCancelButton(page).click();

    await openEditProjectDialog(page);
    await expect(editProjectFormSubmitButton(page)).toBeDisabled();
    await selectProjectDisciplineOption(page, disciplineToToggle);
    await expect(editProjectFormSubmitButton(page)).toBeEnabled();
    await projectFormCancelButton(page).click();

    await openEditProjectDialog(page);
    await expect(editProjectFormSubmitButton(page)).toBeDisabled();
    await projectTitleField(page).fill(`${manifest.project_title} updated`);
    await expect(editProjectFormSubmitButton(page)).toBeEnabled();
    await projectFormCancelButton(page).click();
  });

  test.describe('FR-PROJ-FORM-006: save feedback', () => {
    test('successful edit shows title, description, and disciplines on overview', async ({
      page,
    }) => {
      const updatedTitle = `${manifest.project_title} updated ${Date.now()}`;
      const updatedDescription = 'E2E edit overview description';
      const disciplineLabels = [DISCIPLINE_CATALOGUE_AZ[0]!];
      const projectUuid = manifest.project_uuid;

      const updatedDetail = {
        uuid: projectUuid,
        title: updatedTitle,
        description: updatedDescription,
        isPublished: false,
        isArchived: false,
        isTemplate: false,
        isFavorite: false,
        ownerId: 1,
        dateCreated: '2026-01-01T00:00:00Z',
        modifiedOn: '2026-01-01T00:00:00Z',
        disciplines: [{ id: 1, title: disciplineLabels[0]! }],
        workflows: [],
        permissions: {
          accountRole: 'teacher',
          resourceRole: 'owner',
          state: 'active',
          actions: [
            'view',
            'edit_project',
            'manage_members',
            'create_workflow',
            'archive_project',
            'publish_project',
          ],
          adminOverride: false,
        },
      };

      await openEditProjectDialog(page);
      await projectTitleField(page).fill(updatedTitle);
      await projectDescriptionField(page).fill(updatedDescription);
      await selectProjectDisciplineOption(page, disciplineLabels[0]!);

      await page.route(`**/api/project/${projectUuid}`, (route) => {
        const method = route.request().method();
        if (method === 'PATCH') {
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ item: updatedDetail }),
          });
          return;
        }
        if (method === 'GET') {
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ item: updatedDetail }),
          });
          return;
        }
        void route.continue();
      });

      const routeBeforeSubmit = page.url();
      await editProjectFormSubmitButton(page).click();

      await expect(createProjectDialog(page)).toBeHidden();
      await expect(page).toHaveURL(routeBeforeSubmit);
      await waitForProjectOverviewLoaded(page);
      await expectProjectOverviewShowsSubmittedFormValues(page, {
        title: updatedTitle,
        description: updatedDescription,
        disciplineLabels,
      });
      await expectEditProjectSnackbarMessage(
        page,
        PROJECT_EDIT_SNACKBAR_MESSAGES.success,
      );
    });

    test('failed edit keeps dialog open, retains values, and shows failure snackbar', async ({
      page,
    }) => {
      const updatedTitle = `${manifest.project_title} failure ${Date.now()}`;
      const updatedDescription = 'E2E edit failure retained description';

      await page.route(PROJECT_UPDATE_API_ROUTE, (route) => {
        if (route.request().method() !== 'PATCH') {
          void route.continue();
          return;
        }

        void route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'E2E simulated update project failure' }),
        });
      });

      await openEditProjectDialog(page);
      await projectTitleField(page).fill(updatedTitle);
      await projectDescriptionField(page).fill(updatedDescription);
      await editProjectFormSubmitButton(page).click();

      await expect(createProjectDialog(page)).toBeVisible();
      await expect(projectTitleField(page)).toHaveValue(updatedTitle);
      await expect(projectDescriptionField(page)).toHaveValue(updatedDescription);
      await expect(editProjectFormSubmitButton(page)).toBeEnabled();
      await expectEditProjectSnackbarMessage(
        page,
        PROJECT_EDIT_SNACKBAR_MESSAGES.failure,
      );
    });
  });
});
