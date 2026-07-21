import { test, expect } from '@playwright/test';
import { authenticatedApiRequest } from '../../helpers/api';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import {
  NOTIFICATIONS_SETTINGS_API_ROUTE,
  NOTIFICATIONS_SETTINGS_SNACKBAR_MESSAGES,
  globalMessageSnackbar,
  notificationsSettingsForm,
  notificationsSettingsTitle,
  productUpdatesToggle,
  PRODUCT_UPDATES_TOGGLE_LABEL,
  waitForNotificationsSettingsLoaded,
} from './user.locators';

/**
 * Calibration slice — FR-NOTIF-001 through FR-NOTIF-003.
 * Requirements: tests/docs/requirements/features/user/notifications_settings_requirements_v1.yaml
 * Auth: chromium project storage state (teacher@courseflow.com).
 */

test.describe('Notifications settings — calibration (FR-NOTIF-001-003)', () => {
  test.describe.configure({ mode: 'serial' });
  let notificationsBeforeTest: boolean | undefined;

  test.beforeEach(async ({ page }) => {
    notificationsBeforeTest = undefined;
    await gotoAuthenticatedShell(page, '/user/notifications-settings');
    await waitForNotificationsSettingsLoaded(page);

    const response = await authenticatedApiRequest(
      page,
      'GET',
      '/api/user/me/notification-settings',
    );
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      item: { notificationsActive: boolean };
    };
    notificationsBeforeTest = body.item.notificationsActive;
  });

  test.afterEach(async ({ page }) => {
    await page.unroute(NOTIFICATIONS_SETTINGS_API_ROUTE);
    if (notificationsBeforeTest === undefined) {
      return;
    }

    const response = await authenticatedApiRequest(
      page,
      'PATCH',
      '/api/user/me/notification-settings',
      { data: { notificationsActive: notificationsBeforeTest } },
    );
    expect(response.ok()).toBeTruthy();
  });

  test('FR-NOTIF-001: route renders title, form, and product updates toggle', async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/user\/notifications-settings\/?$/);
    await expect(notificationsSettingsTitle(page)).toBeVisible();
    await expect(notificationsSettingsForm(page)).toBeVisible();
    await expect(productUpdatesToggle(page)).toBeVisible();
    await expect(
      page.getByText(PRODUCT_UPDATES_TOGGLE_LABEL, { exact: true }),
    ).toBeVisible();
  });

  test('FR-NOTIF-002: productUpdatesToggle reflects a saved boolean preference', async ({
    page,
  }) => {
    if (notificationsBeforeTest === undefined) {
      throw new Error('Notification preference was not loaded in beforeEach');
    }
    const toggle = productUpdatesToggle(page);
    await expect(toggle).toBeChecked({
      checked: notificationsBeforeTest,
    });
  });

  test('FR-NOTIF-003: successful toggle saves immediately and shows exact feedback', async ({
    page,
  }) => {
    const toggle = productUpdatesToggle(page);
    const before = await toggle.isChecked();
    const saveResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/user/me/notification-settings') &&
        response.request().method() === 'PATCH',
    );

    await toggle.click();
    expect((await saveResponse).ok()).toBeTruthy();

    await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
    await expect(globalMessageSnackbar(page)).toHaveText(
      NOTIFICATIONS_SETTINGS_SNACKBAR_MESSAGES.success,
      { exact: true },
    );
    await expect(toggle).toBeChecked({ checked: !before });

    const savedResponse = await authenticatedApiRequest(
      page,
      'GET',
      '/api/user/me/notification-settings',
    );
    expect(savedResponse.ok()).toBeTruthy();
    const savedBody = (await savedResponse.json()) as {
      item: { notificationsActive: boolean };
    };
    expect(savedBody.item.notificationsActive).toBe(!before);
  });

  test('FR-NOTIF-003: failed save rolls toggle back and shows exact failure feedback', async ({
    page,
  }) => {
    const toggle = productUpdatesToggle(page);
    const before = await toggle.isChecked();

    await page.route(NOTIFICATIONS_SETTINGS_API_ROUTE, (route) => {
      if (route.request().method() !== 'PATCH') {
        void route.continue();
        return;
      }
      void route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'E2E simulated notification settings failure',
        }),
      });
    });

    await toggle.click();

    await expect(globalMessageSnackbar(page)).toHaveText(
      NOTIFICATIONS_SETTINGS_SNACKBAR_MESSAGES.failure,
      { exact: true },
    );
    await expect(toggle).toBeChecked({ checked: before });

    const savedResponse = await authenticatedApiRequest(
      page,
      'GET',
      '/api/user/me/notification-settings',
    );
    expect(savedResponse.ok()).toBeTruthy();
    const savedBody = (await savedResponse.json()) as {
      item: { notificationsActive: boolean };
    };
    expect(savedBody.item.notificationsActive).toBe(before);
  });
});
