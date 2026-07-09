import { expect, type Page } from '@playwright/test';

import {
  accountMenuItemNotificationsSettings,
  accountMenuItemPassword,
  accountMenuItemProfile,
  accountMenuItemSignOut,
  accountMenuTrigger,
  notificationsMenuTrigger,
} from '../shared/locators/navigation';

/** Current phase — notifications dropdown and settings are deferred (FR-TOP-004/006/008). */
export async function expectNotificationsNotInTopNavigationPerCurrentPhase(
  page: Page,
): Promise<void> {
  await expect(notificationsMenuTrigger(page)).toHaveCount(0);
}

/** FR-TOP-003 (in-scope rows) — Profile, Password reset, Sign out; no Notification settings. */
export async function expectAccountMenuInScopeRowsPerFrTop003(page: Page): Promise<void> {
  await accountMenuTrigger(page).click();
  await expect(accountMenuItemProfile(page)).toBeVisible();
  await expect(accountMenuItemPassword(page)).toBeVisible();
  await expect(accountMenuItemSignOut(page)).toBeVisible();
  await expect(accountMenuItemNotificationsSettings(page)).toHaveCount(0);
}
