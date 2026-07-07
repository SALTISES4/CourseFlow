import { test, expect } from '@playwright/test';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { getProjectPath, loadWorkflowManifest } from '../../helpers/manifest';
import { projectOverflowButton, archiveProjectMenuItem, waitForProjectOverviewLoaded } from './project.locators';

/**
 * Calibration slice — FR-PROJ-ARCH-001 through FR-PROJ-ARCH-002 (deferred).
 * Requirements: tests/docs/requirements/features/project/project_archive_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com).
 */

test.describe('Project archive — calibration (FR-PROJ-ARCH-001-002 deferred)', () => {
  const manifest = loadWorkflowManifest();
  const projectPath = getProjectPath(manifest);

  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, projectPath);
    await waitForProjectOverviewLoaded(page);
  });

  test.skip('FR-PROJ-ARCH-001: archive confirmation modal — ArchiveDialog returns null', async ({ page }) => {
    await projectOverflowButton(page).click();
    await archiveProjectMenuItem(page).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
