import { test, expect } from '@playwright/test';
import { authenticatedApiRequest } from '../../helpers/api';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { getProjectPath, loadWorkflowManifest } from '../../helpers/manifest';
import {
  PROJECT_ARCHIVE_CONFIRMATION_MODAL_COPY,
  archiveProjectConfirmationModal,
  archiveProjectConfirmationModalCancelButton,
  archiveProjectConfirmationModalConfirmButton,
  archiveProjectMenuItem,
  projectOverflowButton,
  waitForProjectOverviewLoaded,
} from './project.locators';

/**
 * FR-PROJ-ARCH-001 through FR-PROJ-ARCH-002.
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
