import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Locators for user settings pages — aligned with
 * tests/docs/requirements/features/shared/canonical_locators.yaml (profile*, notificationsSettings*).
 */

export const PROFILE_SETTINGS_TITLE = 'Profile settings';
export const NOTIFICATIONS_SETTINGS_TITLE = 'Notification settings';
export const PRODUCT_UPDATES_TOGGLE_LABEL = 'I want to receive product updates emails';

export function profileSettingsTitle(page: Page): Locator {
  return page.getByRole('heading', { name: PROFILE_SETTINGS_TITLE, exact: true });
}

export function profileSettingsForm(page: Page): Locator {
  return page.locator('form').filter({ has: page.getByRole('button', { name: 'Update profile' }) });
}

export function profileUsernameField(page: Page): Locator {
  return page.getByLabel('Email / Username');
}

export function profileFirstNameField(page: Page): Locator {
  return page.getByRole('textbox', { name: /First [Nn]ame/ });
}

export function profileLastNameField(page: Page): Locator {
  return page.getByRole('textbox', { name: /Last [Nn]ame/ });
}

export function profileLanguagePreferenceGroup(page: Page): Locator {
  return page.getByRole('group', { name: /Language [Pp]references/ });
}

export function profileLanguageOptionEnglish(page: Page): Locator {
  return page.getByRole('radio', { name: 'English', exact: true });
}

export function profileLanguageOptionFrench(page: Page): Locator {
  return page.getByRole('radio', { name: 'French', exact: true });
}

export function profileUpdateButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Update profile', exact: true });
}

export function notificationsSettingsTitle(page: Page): Locator {
  return page.getByRole('heading', { name: NOTIFICATIONS_SETTINGS_TITLE, exact: true });
}

export function notificationsSettingsForm(page: Page): Locator {
  return page.locator('form').filter({ has: page.getByRole('checkbox', { name: PRODUCT_UPDATES_TOGGLE_LABEL }) });
}

export function productUpdatesToggle(page: Page): Locator {
  return page.getByRole('checkbox', { name: PRODUCT_UPDATES_TOGGLE_LABEL });
}

export function globalMessageSnackbar(page: Page): Locator {
  return page.locator('#notistack-snackbar');
}

export async function waitForProfileSettingsLoaded(page: Page): Promise<void> {
  await expect(page.locator('.load-screen')).toHaveCount(0, { timeout: 15_000 });
  await expect(profileSettingsTitle(page)).toBeVisible({ timeout: 15_000 });
  await expect(profileFirstNameField(page)).toBeVisible();
}

export async function waitForNotificationsSettingsLoaded(page: Page): Promise<void> {
  await expect(notificationsSettingsTitle(page)).toBeVisible({ timeout: 15_000 });
  await expect(productUpdatesToggle(page)).toBeVisible();
}
