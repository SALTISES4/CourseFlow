import { test, expect } from '@playwright/test';
import {
  expectAccountMenuInScopeRowsPerFrTop003,
  expectNotificationsNotInTopNavigationPerCurrentPhase,
} from '../../helpers/account-menu';
import { loginAsTestUser } from '../../helpers/auth';
import {
  getPrimaryWorkflow,
  getRestrictedWorkflow,
  loadWorkflowManifest,
} from '../../helpers/manifest';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { expectPasswordResetPagePrimaryLayoutPerFrPwd001 } from '../../helpers/password-reset-page';
import {
  expectAddMenuCreateRowsVisiblePerFrTop002,
  expectAddMenuProjectOpensCreateProjectFormPerFrTop002,
  expectAddMenuWorkflowOpensCreateWorkflowDialogPerFrTop002,
} from '../../helpers/top-navigation-add-menu';
import {
  workflowAccessDeniedSubtitle,
  workflowAccessDeniedTitle,
  workflowAccessDeniedView,
} from '../../shared/locators/workspace-access';
import { notificationsSettingsTitle, profileSettingsTitle } from '../user/user.locators';
import {
  accountMenuItemNotificationsSettings,
  accountMenuItemPassword,
  accountMenuItemProfile,
  accountMenuItemSignOut,
  accountMenuTrigger,
  addMenuTrigger,
  backToProjectLink,
  returnLinksRegion,
  topNavigationBar,
  waitForMainNavigationReady,
} from './navigation.locators';

/**
 * Calibration slice — FR-TOP-001 through FR-TOP-005 (FR-TOP-004/006/008 deferred).
 * The notifications preview dropdown is deferred; Notification settings remains part of FR-TOP-003.
 * Requirements: tests/docs/requirements/features/navigation/top_navigation_requirements_v1.yaml
 * Auth: chromium project storage state (teacher@courseflow.com).
 */

test.describe('Top navigation — calibration (FR-TOP-001-005)', () => {
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
    await expectNotificationsNotInTopNavigationPerCurrentPhase(page);
    await expect(returnLinksRegion(page)).toHaveCount(0);
    await expect(backToProjectLink(page)).toHaveCount(0);
  });

  test('FR-TOP-002: add menu lists create rows', async ({ page }) => {
    await expectAddMenuCreateRowsVisiblePerFrTop002(page);
  });

  test('FR-TOP-002: Project opens create project form', async ({ page }) => {
    await expectAddMenuProjectOpensCreateProjectFormPerFrTop002(page);
  });

  for (const workflowType of ['program', 'course', 'activity'] as const) {
    test(`FR-TOP-002: ${workflowType} opens create workflow dialog with type-specific stepper`, async ({
      page,
    }) => {
      await expectAddMenuWorkflowOpensCreateWorkflowDialogPerFrTop002(page, workflowType);
    });
  }

  test('FR-TOP-003: account menu lists in-scope destinations', async ({ page }) => {
    await expectAccountMenuInScopeRowsPerFrTop003(page);
  });

  test('FR-TOP-003: Profile navigates to profile settings', async ({ page }) => {
    await accountMenuTrigger(page).click();
    await accountMenuItemProfile(page).click();
    await expect(page).toHaveURL(/\/user\/profile-settings\/?$/);
    await expect(profileSettingsTitle(page)).toBeVisible();
  });

  test('FR-TOP-003: Password reset navigates to password reset page', async ({ page }) => {
    await accountMenuTrigger(page).click();
    await accountMenuItemPassword(page).click();

    await expectPasswordResetPagePrimaryLayoutPerFrPwd001(page);
  });

  test('FR-TOP-003: Notification settings navigates to notification settings page', async ({
    page,
  }) => {
    await accountMenuTrigger(page).click();
    await accountMenuItemNotificationsSettings(page).click();

    await expect(page).toHaveURL(/\/user\/notifications-settings\/?$/);
    await expect(notificationsSettingsTitle(page)).toBeVisible();
  });

  test('FR-TOP-003: Sign out revokes a fresh session and returns to login', async ({ page }) => {
    // Do not revoke the project storage-state token shared by the remaining tests.
    await page.evaluate(() => localStorage.removeItem('cf2_access_token'));
    await loginAsTestUser(page);
    await gotoAuthenticatedShell(page, '/home');
    await waitForMainNavigationReady(page);

    const logoutResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/auth/logout') && response.request().method() === 'POST',
    );

    await accountMenuTrigger(page).click();
    await accountMenuItemSignOut(page).click();

    const logoutResponse = await logoutResponsePromise;
    expect(logoutResponse.ok()).toBe(true);
    await expect(page).toHaveURL(/\/login\/?(?:[?#].*)?$/);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('cf2_access_token')))
      .toBeNull();

    await page.goto('/home');
    await expect(page).toHaveURL(/\/login\/?(?:[?#].*)?$/);
  });
});

test.describe('Top navigation — workflow context (FR-TOP-005)', () => {
  test('FR-TOP-005: Return to project link navigates to project workflows', async ({ page }) => {
    const manifest = loadWorkflowManifest();
    const workflow = getPrimaryWorkflow(manifest);

    await gotoAuthenticatedShell(page, workflow.workflow_path);

    const returnLink = backToProjectLink(page);
    await expect(returnLink).toBeVisible({ timeout: 15_000 });
    await expect(returnLink).toContainText(/Return to/);
    await expect(returnLink).toContainText(manifest.project_title);

    await returnLink.click();
    await expect(page).toHaveURL(
      new RegExp(`/project/${manifest.project_uuid}/workflows/?$`),
    );
  });

  test('FR-TOP-001: returnLinksRegion visible on workflow route', async ({ page }) => {
    const manifest = loadWorkflowManifest();
    const workflow = getPrimaryWorkflow(manifest);

    await gotoAuthenticatedShell(page, workflow.workflow_path);

    await expect(returnLinksRegion(page)).toBeVisible({ timeout: 15_000 });
    await expect(backToProjectLink(page)).toBeVisible();
  });

  test('FR-TOP-001/005: denied workflow omits return links and shows access denial', async ({
    page,
  }) => {
    const restrictedWorkflow = getRestrictedWorkflow(loadWorkflowManifest());

    await gotoAuthenticatedShell(page, restrictedWorkflow.workflow_path);

    await expect(topNavigationBar(page)).toBeVisible();
    await expect(workflowAccessDeniedView(page)).toBeVisible({ timeout: 15_000 });
    await expect(workflowAccessDeniedTitle(page)).toBeVisible();
    await expect(workflowAccessDeniedSubtitle(page)).toBeVisible();
    await expect(returnLinksRegion(page)).toHaveCount(0);
    await expect(backToProjectLink(page)).toHaveCount(0);
  });
});
