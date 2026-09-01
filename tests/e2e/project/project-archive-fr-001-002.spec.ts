import { test, expect } from '../../fixtures';
import { authenticatedApiRequest } from '../../helpers/api';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { getProjectPath, loadWorkflowManifest } from '../../helpers/manifest';
import { globalMessageSnackbar } from '../../shared/locators/global';
import { projectAccessDeniedView } from '../../shared/locators/workspace-access';
import {
  PROJECT_ARCHIVE_CONFIRMATION_MODAL_COPY,
  archiveProjectConfirmationModal,
  archiveProjectConfirmationModalCancelButton,
  archiveProjectConfirmationModalConfirmButton,
  archiveProjectMenuItem,
  projectOverflowButton,
  waitForProjectOverviewLoaded,
} from './project.locators';

test.use({ seedDependencies: ['actor.teacher', 'project.primary'] });

/**
 * FR-PROJ-ARCH-001 through FR-PROJ-ARCH-003, including archived-route history revalidation.
 * Requirements: tests/docs/requirements/features/project/project_archive_requirements_v1.yaml
 * Auth: chromium project storage state (teacher@courseflow.com).
 */

test.describe('Project archive (FR-PROJ-ARCH-001-002)', () => {
  const manifest = loadWorkflowManifest();
  const projectPath = getProjectPath(manifest);

  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, projectPath);
    await waitForProjectOverviewLoaded(page);
  });

  test('FR-PROJ-ARCH-001: archive action opens the required confirmation modal', async ({
    page,
  }) => {
    await projectOverflowButton(page).click();
    await archiveProjectMenuItem(page).click();
    const modal = archiveProjectConfirmationModal(page);
    await expect(modal).toBeVisible();
    await expect(
      modal.getByText(PROJECT_ARCHIVE_CONFIRMATION_MODAL_COPY.body, { exact: true }),
    ).toBeVisible();
    await expect(archiveProjectConfirmationModalCancelButton(page)).toBeVisible();
    await expect(archiveProjectConfirmationModalConfirmButton(page)).toBeVisible();
  });

  test('FR-PROJ-ARCH-002: cancel closes the modal and leaves project resources active', async ({
    page,
  }) => {
    const pathnameBefore = new URL(page.url()).pathname;
    await projectOverflowButton(page).click();
    await archiveProjectMenuItem(page).click();
    await expect(archiveProjectConfirmationModal(page)).toBeVisible();

    await archiveProjectConfirmationModalCancelButton(page).click();
    await expect(archiveProjectConfirmationModal(page)).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe(pathnameBefore);

    const response = await authenticatedApiRequest(
      page,
      'GET',
      `/api/project/${manifest.project_uuid}`,
    );
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      item: { isArchived: boolean; workflows?: Array<{ isArchived: boolean }> };
    };
    expect(body.item.isArchived).toBe(false);
    expect(body.item.workflows?.every((workflow) => !workflow.isArchived)).toBe(true);
  });
});

test.describe('Project archive route history (FR-PROJ-ARCH-003 / FR-WS-ACCESS-005)', () => {
  test.use({ projectAccess: 'disposable' });

  test('browser Back revalidates the archived project without another interaction', async ({
    page,
    project,
  }) => {
    let archived = false;

    try {
      await gotoAuthenticatedShell(page, project.path);
      await waitForProjectOverviewLoaded(page);
      await projectOverflowButton(page).click();
      await archiveProjectMenuItem(page).click();

      const archiveResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/project/${project.uuid}/archive`) &&
          response.request().method() === 'POST',
      );
      await archiveProjectConfirmationModalConfirmButton(page).click();
      const archiveResponse = await archiveResponsePromise;
      archived = archiveResponse.ok();
      expect(archiveResponse.ok()).toBeTruthy();
      await expect(page).toHaveURL(/\/library\/?$/);

      const projectRevalidationPromise = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/project/${project.uuid}`) &&
          response.request().method() === 'GET',
      );
      await page.goBack();
      const projectRevalidation = await projectRevalidationPromise;

      expect(projectRevalidation.status()).toBe(403);
      await expect(page).toHaveURL(new RegExp(`/project/${project.uuid}/?$`));
      await expect(projectAccessDeniedView(page)).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: project.title,
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(
        globalMessageSnackbar(page).filter({
          hasText: 'this project has been archived',
        }),
      ).toHaveCount(0);
    } finally {
      if (archived) {
        const restoreResponse = await authenticatedApiRequest(
          page,
          'POST',
          `/api/project/${project.uuid}/restore`,
        );
        expect(
          restoreResponse.ok(),
          'Restore archived project after browser-history regression test',
        ).toBeTruthy();
      }
    }
  });
});
