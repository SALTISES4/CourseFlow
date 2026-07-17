import { test, expect } from '@playwright/test';
import { loginAs } from '../../helpers/auth';
import {
  expectCreateProjectFormPrimaryLayoutPerFrProjForm001,
  expectCreateProjectSnackbarMessage,
  expectCreateProjectTitleValidationMessage,
  expectProjectStartWithProjectAlertVisiblePerFrProjForm002,
  expectUserOwnsAtLeastOneProject,
  expectUserOwnsNoProjects,
  projectTitleAtMaxLength,
  projectTitleOverMaxLength,
  PROJECT_CREATE_SNACKBAR_MESSAGES,
  PROJECT_FORM_VALIDATION_MESSAGES,
} from '../../helpers/create-project-form';
import { DISCIPLINE_CATALOGUE_AZ } from '../../helpers/discipline-catalogue';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import {
  closeProjectDisciplineSelect,
  openProjectDisciplineSelect,
  projectDisciplineOptionLabels,
  selectProjectDisciplineOption,
} from '../../helpers/project-discipline';
import { expectProjectOverviewShowsSubmittedFormValues } from '../../helpers/project-overview';
import {
  createProjectDialog,
  createProjectFormSubmitButton,
  E2E_CONTRIBUTOR_STUDENT_EMAIL,
  openCreateProjectDialog,
  PROJECT_CREATE_API_ROUTE,
  projectDescriptionField,
  projectFormCancelButton,
  projectStartWithProjectAlert,
  projectStartWithProjectAlertRegion,
  projectTitleField,
  waitForProjectOverviewLoaded,
} from './project.locators';

/**
 * Calibration slice — FR-PROJ-FORM-001 through FR-PROJ-FORM-005.
 * Requirements: tests/docs/requirements/features/project/project_create_form_requirements_v1.yaml
 * Auth: chromium project storage state (teacher@courseflow.com) unless noted.
 */

test.describe('Create project form — calibration (FR-PROJ-FORM-001-005)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, '/home');
  });

  test('FR-PROJ-FORM-001: dialog layout, labels, and empty initial values', async ({ page }) => {
    await openCreateProjectDialog(page);
    await expectCreateProjectFormPrimaryLayoutPerFrProjForm001(page);
  });

  test('FR-PROJ-FORM-001: projectDisciplineField options match fixed discipline catalogue A–Z', async ({
    page,
  }) => {
    await openCreateProjectDialog(page);
    await openProjectDisciplineSelect(page);

    const labels = await projectDisciplineOptionLabels(page);
    expect(labels).toEqual([...DISCIPLINE_CATALOGUE_AZ]);

    await closeProjectDisciplineSelect(page);
  });

  test('FR-PROJ-FORM-001: cancel closes dialog without navigation and resets fields', async ({
    page,
  }) => {
    await openCreateProjectDialog(page);
    await projectTitleField(page).fill('Should not persist');
    await projectFormCancelButton(page).click();
    await expect(createProjectDialog(page)).toBeHidden();
    await expect(page).toHaveURL(/\/home\/?$/);

    await openCreateProjectDialog(page);
    await expect(projectTitleField(page)).toHaveValue('');
    await expect(projectDescriptionField(page)).toHaveValue('');
  });

  test.describe('FR-PROJ-FORM-002: onboarding alert', () => {
    test.describe('when user owns at least one project', () => {
      test.beforeEach(async ({ page }) => {
        await expectUserOwnsAtLeastOneProject(page);
      });

      test('projectStartWithProjectAlert is not visible', async ({ page }) => {
        await openCreateProjectDialog(page);
        await expect(projectStartWithProjectAlertRegion(page)).toBeHidden();
        await expect(projectStartWithProjectAlert(page)).toBeHidden();
      });
    });

    test.describe('when user is not owner of any project', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test.beforeEach(async ({ page }) => {
        await loginAs(page, {
          email: E2E_CONTRIBUTOR_STUDENT_EMAIL,
          password: 'password',
        });
        await gotoAuthenticatedShell(page, '/home');
        await expectUserOwnsNoProjects(page);
      });

      test('projectStartWithProjectAlert is visible with required copy above fields', async ({
        page,
      }) => {
        await openCreateProjectDialog(page);
        await expectProjectStartWithProjectAlertVisiblePerFrProjForm002(page);
      });
    });
  });

  test.describe('FR-PROJ-FORM-004: title validation', () => {
    test('submit stays disabled until a field is changed', async ({ page }) => {
      await openCreateProjectDialog(page);
      await expect(createProjectFormSubmitButton(page)).toBeDisabled();
    });

    test('empty title after field change shows validation and keeps submit disabled', async ({
      page,
    }) => {
      await openCreateProjectDialog(page);
      await projectDescriptionField(page).fill('Description only');

      await expectCreateProjectTitleValidationMessage(
        page,
        PROJECT_FORM_VALIDATION_MESSAGES.titleRequired,
      );
      await expect(createProjectFormSubmitButton(page)).toBeDisabled();
    });

    test('title over 200 characters shows length validation and keeps submit disabled', async ({
      page,
    }) => {
      await openCreateProjectDialog(page);
      await projectTitleField(page).fill(projectTitleOverMaxLength());

      await expectCreateProjectTitleValidationMessage(
        page,
        PROJECT_FORM_VALIDATION_MESSAGES.titleMaxLength,
      );
      await expect(createProjectFormSubmitButton(page)).toBeDisabled();
    });

    test('valid title at max length enables submit', async ({ page }) => {
      await openCreateProjectDialog(page);
      await projectTitleField(page).fill(projectTitleAtMaxLength());
      await expect(createProjectFormSubmitButton(page)).toBeEnabled();
    });
  });

  test.describe('FR-PROJ-FORM-005: save feedback', () => {
    test('successful create shows title, description, and disciplines on overview', async ({
      page,
    }) => {
      const uniqueTitle = `E2E Project ${Date.now()}`;
      const description = 'E2E create overview description';
      const disciplineLabels = [DISCIPLINE_CATALOGUE_AZ[0]!];
      const createdUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      const projectDetail = {
        uuid: createdUuid,
        title: uniqueTitle,
        description,
        isPublished: false,
        isTemplate: false,
        isFavorite: false,
        ownerId: 1,
        dateCreated: '2026-01-01T00:00:00Z',
        modifiedOn: '2026-01-01T00:00:00Z',
      };

      await page.route(PROJECT_CREATE_API_ROUTE, (route) => {
        if (route.request().method() !== 'POST') {
          void route.continue();
          return;
        }

        void route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(projectDetail),
        });
      });

      await page.route(`**/api/project/${createdUuid}`, (route) => {
        if (route.request().method() !== 'GET') {
          void route.continue();
          return;
        }

        void route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ item: projectDetail }),
        });
      });

      await openCreateProjectDialog(page);
      await projectTitleField(page).fill(uniqueTitle);
      await projectDescriptionField(page).fill(description);
      await selectProjectDisciplineOption(page, disciplineLabels[0]!);
      await createProjectFormSubmitButton(page).click();

      await expect(createProjectDialog(page)).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`/project/${createdUuid}/?$`));
      await waitForProjectOverviewLoaded(page);
      await expectProjectOverviewShowsSubmittedFormValues(page, {
        title: uniqueTitle,
        description,
        disciplineLabels,
      });
      await expectCreateProjectSnackbarMessage(
        page,
        PROJECT_CREATE_SNACKBAR_MESSAGES.success,
      );
    });

    test('failed create keeps dialog open, retains values, and shows failure snackbar', async ({
      page,
    }) => {
      const uniqueTitle = `E2E Project failure ${Date.now()}`;
      const description = 'Retained description';

      await page.route(PROJECT_CREATE_API_ROUTE, (route) => {
        if (route.request().method() !== 'POST') {
          void route.continue();
          return;
        }

        void route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'E2E simulated create project failure' }),
        });
      });

      await openCreateProjectDialog(page);
      await projectTitleField(page).fill(uniqueTitle);
      await projectDescriptionField(page).fill(description);
      await createProjectFormSubmitButton(page).click();

      await expect(createProjectDialog(page)).toBeVisible();
      await expect(projectTitleField(page)).toHaveValue(uniqueTitle);
      await expect(projectDescriptionField(page)).toHaveValue(description);
      await expect(createProjectFormSubmitButton(page)).toBeEnabled();
      await expectCreateProjectSnackbarMessage(
        page,
        PROJECT_CREATE_SNACKBAR_MESSAGES.failure,
      );
    });
  });
});
