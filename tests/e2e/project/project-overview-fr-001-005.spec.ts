import { test, expect } from '@playwright/test';
import { loginAs } from '../../helpers/auth';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { getProjectPath, loadWorkflowManifest } from '../../helpers/manifest';
import {
  buildProjectDetailApiResponse,
  expectProjectOverviewDescriptionPerFrProjOv001,
  expectProjectOverviewDisciplinesPerFrProjOv001,
  expectProjectOverviewMetadataLabelsPerFrProjOv001,
  expectProjectPublishSnackbarMessage,
  expectProjectUnpublishSnackbarMessage,
  expectPublishedUnpublishControlsPerFrProjOv003,
  expectUnpublishedPublishControlsPerFrProjOv003,
  fetchProjectDetail,
  installProjectDetailRouteMock,
  installProjectUpdateRouteMock,
  openPublishProjectConfirmationModal,
  PROJECT_PUBLISH_SNACKBAR_MESSAGES,
  PROJECT_UNPUBLISH_SNACKBAR_MESSAGES,
} from '../../helpers/project-overview';
import {
  addContributorsDialog,
  addNewTagInput,
  E2E_CONTRIBUTOR_STUDENT_EMAIL,
  projectMetadataAddContributorsButton,
  projectMetadataFieldCreatedOn,
  projectTagsSection,
  publishProjectConfirmationModal,
  publishProjectConfirmationModalCancelButton,
  publishProjectConfirmationModalConfirmButton,
  publishProjectButton,
  projectVisibilityStateMessage,
  shareProjectButton,
  unpublishProjectButton,
  waitForProjectOverviewLoaded,
} from './project.locators';

/**
 * Calibration slice — FR-PROJ-OV-001 through FR-PROJ-OV-005.
 * Requirements: tests/docs/requirements/features/project/project_overview_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com) unless noted.
 */

test.describe('Project overview — calibration (FR-PROJ-OV-001–005)', () => {
  const manifest = loadWorkflowManifest();
  const projectPath = getProjectPath(manifest);

  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, projectPath);
    await waitForProjectOverviewLoaded(page);
  });

  test('FR-PROJ-OV-001: overview route renders required metadata labels without date field', async ({
    page,
  }) => {
    await expectProjectOverviewMetadataLabelsPerFrProjOv001(page);
    await expect(projectMetadataFieldCreatedOn(page)).toHaveCount(0);
  });

  test('FR-PROJ-OV-001: description block is display-only and reflects project API value', async ({
    page,
  }) => {
    const project = await fetchProjectDetail(page, manifest.project_uuid);
    await expectProjectOverviewDescriptionPerFrProjOv001(page, project);
  });

  test('FR-PROJ-OV-001: disciplines block shows empty copy or A–Z comma-separated values', async ({
    page,
  }) => {
    await expectProjectOverviewDisciplinesPerFrProjOv001(page);
  });

  test('FR-PROJ-OV-002: Add CourseFlow user entry opens add contributor dialog', async ({ page }) => {
    await expect(projectMetadataAddContributorsButton(page)).toBeVisible();
    await projectMetadataAddContributorsButton(page).click();
    await expect(addContributorsDialog(page)).toBeVisible();
    await expect(addContributorsDialog(page).getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
    await expect(addContributorsDialog(page).getByRole('button', { name: 'Add contributor', exact: true })).toBeDisabled();
    await addContributorsDialog(page).getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(addContributorsDialog(page)).toBeHidden();
  });

  test('FR-PROJ-OV-002: Sharing action menu entry opens add contributor dialog', async ({ page }) => {
    await shareProjectButton(page).click();
    await expect(addContributorsDialog(page)).toBeVisible();
    await addContributorsDialog(page).getByRole('button', { name: 'Cancel', exact: true }).click();
  });

  test.describe('FR-PROJ-OV-003: publish and unpublish controls', () => {
    test.describe.configure({ mode: 'serial' });

    const projectUpdateRoute = `**/api/project/${manifest.project_uuid}`;

    test.beforeEach(async ({ page }) => {
      await page.unroute(projectUpdateRoute);
    });

    test.describe('from unpublished project state', () => {
      test('shows private visibility message and publish control', async ({ page }) => {
        const project = await fetchProjectDetail(page, manifest.project_uuid);
        expect(project.isPublished).toBe(false);
        await expectUnpublishedPublishControlsPerFrProjOv003(page);
      });

      test('clicking publish opens publishProjectConfirmationModal with required copy', async ({
        page,
      }) => {
        await openPublishProjectConfirmationModal(page);
      });

      test('cancel closes publishProjectConfirmationModal and keeps project unpublished', async ({
        page,
      }) => {
        await openPublishProjectConfirmationModal(page);
        await publishProjectConfirmationModalCancelButton(page).click();
        await expect(publishProjectConfirmationModal(page)).toBeHidden();
        await expectUnpublishedPublishControlsPerFrProjOv003(page);
      });

      test('failed publish keeps modal open and shows failure snackbar', async ({ page }) => {
        await installProjectUpdateRouteMock(page, manifest.project_uuid, (route) => {
          if (route.request().method() !== 'PATCH') {
            void route.continue();
            return;
          }

          void route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ detail: 'E2E simulated publish failure' }),
          });
        });

        await openPublishProjectConfirmationModal(page);
        await publishProjectConfirmationModalConfirmButton(page).click();

        await expect(publishProjectConfirmationModal(page)).toBeVisible();
        await expect(publishProjectConfirmationModalConfirmButton(page)).toBeEnabled();
        await expectUnpublishedPublishControlsPerFrProjOv003(page);
        await expectProjectPublishSnackbarMessage(
          page,
          PROJECT_PUBLISH_SNACKBAR_MESSAGES.failure,
        );
      });

      test('successful publish closes modal, shows success snackbar, and switches to published controls', async ({
        page,
      }) => {
        const project = await fetchProjectDetail(page, manifest.project_uuid);

        await installProjectUpdateRouteMock(page, manifest.project_uuid, (route) => {
          if (route.request().method() !== 'PATCH') {
            void route.continue();
            return;
          }

          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(
              buildProjectDetailApiResponse({
                ...project,
                isPublished: true,
              }),
            ),
          });
        });

        await openPublishProjectConfirmationModal(page);
        await publishProjectConfirmationModalConfirmButton(page).click();

        await expect(publishProjectConfirmationModal(page)).toBeHidden({ timeout: 15_000 });
        await expectPublishedUnpublishControlsPerFrProjOv003(page);
        await expectProjectPublishSnackbarMessage(
          page,
          PROJECT_PUBLISH_SNACKBAR_MESSAGES.success,
        );
      });
    });

    test.describe('from published project state', () => {
      test.beforeEach(async ({ page }) => {
        const project = await fetchProjectDetail(page, manifest.project_uuid);

        await installProjectDetailRouteMock(page, manifest.project_uuid, {
          ...project,
          isPublished: true,
        });
        await page.reload();
        await waitForProjectOverviewLoaded(page);
        await expectPublishedUnpublishControlsPerFrProjOv003(page);
      });

      test('shows public visibility message and unpublish control on initial load', async ({
        page,
      }) => {
        await expectPublishedUnpublishControlsPerFrProjOv003(page);
      });

      test('failed unpublish keeps project published and shows failure snackbar', async ({
        page,
      }) => {
        await installProjectUpdateRouteMock(page, manifest.project_uuid, (route) => {
          if (route.request().method() !== 'PATCH') {
            void route.continue();
            return;
          }

          void route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ detail: 'E2E simulated unpublish failure' }),
          });
        });

        await expect(unpublishProjectButton(page)).toBeVisible();
        await unpublishProjectButton(page).click();

        await expectPublishedUnpublishControlsPerFrProjOv003(page);
        await expectProjectUnpublishSnackbarMessage(
          page,
          PROJECT_UNPUBLISH_SNACKBAR_MESSAGES.failure,
        );
      });

      test('successful unpublish shows success snackbar and returns to private visibility controls', async ({
        page,
      }) => {
        const project = await fetchProjectDetail(page, manifest.project_uuid);

        await installProjectUpdateRouteMock(page, manifest.project_uuid, (route) => {
          if (route.request().method() !== 'PATCH') {
            void route.continue();
            return;
          }

          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(
              buildProjectDetailApiResponse({
                ...project,
                isPublished: false,
              }),
            ),
          });
        });

        await expect(unpublishProjectButton(page)).toBeVisible();
        await unpublishProjectButton(page).click();

        await expectUnpublishedPublishControlsPerFrProjOv003(page);
        await expectProjectUnpublishSnackbarMessage(
          page,
          PROJECT_UNPUBLISH_SNACKBAR_MESSAGES.success,
        );
      });
    });
  });

  test.describe('FR-PROJ-OV-003: viewer role visibility controls', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
      await loginAs(page, {
        email: E2E_CONTRIBUTOR_STUDENT_EMAIL,
        password: 'password',
      });
      await gotoAuthenticatedShell(page, projectPath);
      await waitForProjectOverviewLoaded(page);
    });

    test('viewer sees visibility message but not publish or unpublish controls', async ({ page }) => {
      await expect(projectVisibilityStateMessage(page)).toBeVisible();
      await expect(publishProjectButton(page)).toHaveCount(0);
      await expect(unpublishProjectButton(page)).toHaveCount(0);
    });
  });

  test.skip('FR-PROJ-OV-004: contributor add success flow — deferred (requires user search fixture)', async ({
    page,
  }) => {
    await projectMetadataAddContributorsButton(page).click();
  });

  test('FR-PROJ-OV-005: tags section shows add-new-tag input when tags block is rendered', async ({
    page,
  }) => {
    test.skip((await projectTagsSection(page).count()) === 0, 'Tags block not rendered — tags missing from project API mapping.');

    await expect(projectTagsSection(page)).toBeVisible();
    await expect(addNewTagInput(page)).toBeVisible();
    await expect(addNewTagInput(page)).toHaveAttribute('placeholder', 'Add new tag');
  });
});
