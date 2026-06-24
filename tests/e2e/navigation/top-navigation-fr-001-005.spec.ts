import { test, expect } from '@playwright/test';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { createWorkflowDialog } from '../home/home.locators';
import { profileSettingsTitle, notificationsSettingsTitle } from '../user/user.locators';
import {
  accountMenuItemNotificationsSettings,
  accountMenuItemPassword,
  accountMenuItemProfile,
  accountMenuItemSignOut,
  accountMenuTrigger,
  addMenuItemActivity,
  addMenuItemCourse,
  addMenuItemProgram,
  addMenuItemProject,
  addMenuTrigger,
  backToProjectLink,
  createProjectDialog,
  passwordResetDialog,
  returnLinksRegion,
  topNavigationBar,
  waitForMainNavigationReady,
} from './navigation.locators';

/**
 * Calibration slice — FR-TOP-001 through FR-TOP-005 (FR-TOP-004/006/008 deferred).
 * Requirements: tests/docs/requirements/features/navigation/top_navigation_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com).
 */

test.describe('Top navigation — calibration (FR-TOP-001–005)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, '/home');
    await waitForMainNavigationReady(page);
  });

  test('FR-TOP-001: top bar shows add and account triggers; no return links on /home', async ({
    page,
  }) => {
    await expect(topNavigationBar(page)).toBeVisible();
    await expect(addMenuTrigger(page)).toBeVisible();
    await expect(accountMenuTrigger(page)).toBeVisible();
    await expect(backToProjectLink(page)).toHaveCount(0);
  });

  test('FR-TOP-002: add menu lists create rows and opens dialogs', async ({ page }) => {
    await addMenuTrigger(page).click();

    await expect(addMenuItemProject(page)).toBeVisible();
    await expect(addMenuItemProgram(page)).toBeVisible();
    await expect(addMenuItemCourse(page)).toBeVisible();
    await expect(addMenuItemActivity(page)).toBeVisible();

    await addMenuItemProject(page).click();
    await expect(createProjectDialog(page)).toBeVisible();
    await expect(
      createProjectDialog(page).getByRole('heading', { name: 'Create project', exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Escape');

    await addMenuTrigger(page).click();
    await addMenuItemProgram(page).click();
    await expect(createWorkflowDialog(page)).toBeVisible();
    await expect(createWorkflowDialog(page).getByRole('heading')).toHaveText('Select project');
  });

  test('FR-TOP-003: account menu lists destinations and Profile navigates', async ({ page }) => {
    await accountMenuTrigger(page).click();

    await expect(accountMenuItemProfile(page)).toBeVisible();
    await expect(accountMenuItemPassword(page)).toBeVisible();
    await expect(accountMenuItemNotificationsSettings(page)).toBeVisible();
    await expect(accountMenuItemSignOut(page)).toBeVisible();

    await accountMenuItemProfile(page).click();
    await expect(page).toHaveURL(/\/user\/profile-settings\/?$/);
    await expect(profileSettingsTitle(page)).toBeVisible();
  });

  test('FR-TOP-003: Password reset opens dialog (not /user/password-reset route yet)', async ({
    page,
  }) => {
    await accountMenuTrigger(page).click();
    await accountMenuItemPassword(page).click();

    await expect(passwordResetDialog(page)).toBeVisible();
    await expect(page).not.toHaveURL(/\/user\/password-reset/);
  });

  test('FR-TOP-003: Notification settings navigates to settings page', async ({ page }) => {
    await accountMenuTrigger(page).click();
    await accountMenuItemNotificationsSettings(page).click();

    await expect(page).toHaveURL(/\/user\/notifications-settings\/?$/);
    await expect(notificationsSettingsTitle(page)).toBeVisible();
  });
});

test.describe('Top navigation — workflow context (FR-TOP-005)', () => {
  test('FR-TOP-005: Return to project link navigates to project overview', async ({ page }) => {
    const { loadWorkflowManifest, getPrimaryWorkflow } = await import('../../helpers/manifest');
    const manifest = loadWorkflowManifest();
    const workflow = getPrimaryWorkflow(manifest);

    await gotoAuthenticatedShell(page, workflow.workflow_path);

    const returnLink = backToProjectLink(page);
    await expect(returnLink).toBeVisible({ timeout: 15_000 });
    await expect(returnLink).toContainText(/Return to/);
    await expect(returnLink).toContainText(manifest.project_title);

    await returnLink.click();
    await expect(page).toHaveURL(new RegExp(`/project/${manifest.project_uuid}/?$`));
  });

  test('FR-TOP-001: returnLinksRegion visible on workflow route', async ({ page }) => {
    const { loadWorkflowManifest, getPrimaryWorkflow } = await import('../../helpers/manifest');
    const manifest = loadWorkflowManifest();
    const workflow = getPrimaryWorkflow(manifest);

    await gotoAuthenticatedShell(page, workflow.workflow_path);

    await expect(returnLinksRegion(page)).toBeVisible({ timeout: 15_000 });
    await expect(backToProjectLink(page)).toBeVisible();
  });
});
