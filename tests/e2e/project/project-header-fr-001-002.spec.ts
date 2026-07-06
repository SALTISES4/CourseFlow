import { test, expect } from '@playwright/test';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { getProjectPath, getProjectWorkflowsPath, loadWorkflowManifest } from '../../helpers/manifest';
import {
  CARD_FAVOURITE_SNACKBAR_ADDED,
  CARD_FAVOURITE_SNACKBAR_REMOVED,
} from '../../shared/locators/cards';
import {
  globalMessageSnackbar,
  projectHeaderFavouriteToggle,
  projectOverviewTab,
  projectTitle,
  projectViewTabSelector,
  projectWorkflowsTab,
  waitForProjectOverviewLoaded,
} from './project.locators';

/**
 * Calibration slice — FR-PROJ-HEADER-001 through FR-PROJ-HEADER-002.
 * Requirements: tests/docs/requirements/features/project/project_header_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com).
 */

test.describe('Project header — calibration (FR-PROJ-HEADER-001–002)', () => {
  const manifest = loadWorkflowManifest();
  const projectPath = getProjectPath(manifest);
  const workflowsPath = getProjectWorkflowsPath(manifest);

  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, projectPath);
    await waitForProjectOverviewLoaded(page);
  });

  test('FR-PROJ-HEADER-001: header shows title and Overview/Workflows tabs', async ({ page }) => {
    await expect(page).toHaveURL(new RegExp(`/project/${manifest.project_uuid}/?$`));
    await expect(projectTitle(page)).toHaveText(manifest.project_title);
    await expect(projectViewTabSelector(page)).toBeVisible();
    await expect(projectOverviewTab(page)).toBeVisible();
    await expect(projectWorkflowsTab(page)).toBeVisible();
    await expect(projectOverviewTab(page)).toHaveAttribute('aria-selected', 'true');
  });

  test('FR-PROJ-HEADER-001: tab navigation switches routes and active tab', async ({ page }) => {
    await projectWorkflowsTab(page).click();
    await expect(page).toHaveURL(new RegExp(`/project/${manifest.project_uuid}/workflows/?$`));
    await expect(projectWorkflowsTab(page)).toHaveAttribute('aria-selected', 'true');

    await projectOverviewTab(page).click();
    await expect(page).toHaveURL(new RegExp(`/project/${manifest.project_uuid}/?$`));
    await expect(projectOverviewTab(page)).toHaveAttribute('aria-selected', 'true');
  });

  test('FR-PROJ-HEADER-001: direct navigation to workflows activates Workflows tab', async ({ page }) => {
    await gotoAuthenticatedShell(page, workflowsPath);
    await expect(projectWorkflowsTab(page)).toHaveAttribute('aria-selected', 'true');
  });

  test.describe('FR-PROJ-HEADER-002: favourite toggle', () => {
    test.describe.configure({ mode: 'serial' });

    test('clicking favourite shows snackbar feedback', async ({ page }) => {
      const toggle = projectHeaderFavouriteToggle(page);
      await expect(toggle).toBeVisible();

      await toggle.click();
      await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
      await expect(globalMessageSnackbar(page)).toHaveText(
        new RegExp(`^(${CARD_FAVOURITE_SNACKBAR_ADDED}|${CARD_FAVOURITE_SNACKBAR_REMOVED})$`),
      );
    });
  });
});
