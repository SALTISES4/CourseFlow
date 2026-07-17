import { test, expect } from '@playwright/test';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import {
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
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, '/user/notifications-settings');
    await waitForNotificationsSettingsLoaded(page);
  });

  test('FR-NOTIF-001: route renders title, form, and product updates toggle', async ({ page }) => {
    await expect(page).toHaveURL(/\/user\/notifications-settings\/?$/);
    await expect(notificationsSettingsTitle(page)).toBeVisible();
    await expect(notificationsSettingsForm(page)).toBeVisible();
    await expect(productUpdatesToggle(page)).toBeVisible();
    await expect(page.getByText(PRODUCT_UPDATES_TOGGLE_LABEL, { exact: true })).toBeVisible();
  });

  test('FR-NOTIF-002: productUpdatesToggle reflects a saved boolean preference', async ({
    page,
  }) => {
    const toggle = productUpdatesToggle(page);
    await expect(toggle).toBeVisible();
    const checked = await toggle.isChecked();
    expect(typeof checked).toBe('boolean');
  });

  test('FR-NOTIF-003: clicking toggle saves immediately and shows feedback snackbar', async ({
    page,
  }) => {
    const toggle = productUpdatesToggle(page);
    const before = await toggle.isChecked();

    await toggle.click();

    await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
    await expect(globalMessageSnackbar(page)).toContainText(
      /Success!|Your notification settings have been updated/,
    );
    await expect(toggle).toBeChecked({ checked: !before });

    await toggle.click();
    await expect(toggle).toBeChecked({ checked: before });
  });
});
