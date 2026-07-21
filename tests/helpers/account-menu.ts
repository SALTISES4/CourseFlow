import { expect, type Page } from '@playwright/test';

import {
  accountMenuDropdown,
  accountMenuItemNotificationsSettings,
  accountMenuItemPassword,
  accountMenuItemProfile,
  accountMenuItemSignOut,
  accountMenuTrigger,
  notificationsMenuTrigger,
} from '../shared/locators/navigation';

/** Current phase — the notifications preview dropdown is deferred (FR-TOP-004/006/008). */
export async function expectNotificationsNotInTopNavigationPerCurrentPhase(
  page: Page,
): Promise<void> {
  await expect(notificationsMenuTrigger(page)).toHaveCount(0);
}

/** FR-TOP-003 — account destinations appear in documented order with a divider before Sign out. */
export async function expectAccountMenuInScopeRowsPerFrTop003(page: Page): Promise<void> {
  await accountMenuTrigger(page).click();
  const menu = accountMenuDropdown(page);
  await expect(menu).toBeVisible();
  await expect(accountMenuItemProfile(page)).toBeVisible();
  await expect(accountMenuItemPassword(page)).toBeVisible();
  await expect(accountMenuItemNotificationsSettings(page)).toBeVisible();
  await expect(accountMenuItemSignOut(page)).toBeVisible();
  await expect(menu.getByRole('menuitem')).toHaveText([
    'Profile',
    'Password reset',
    'Notification settings',
    'Sign out',
  ]);
  await expect(menu.getByRole('separator')).toHaveCount(1);
  await expect(
    menu.locator('hr + [role="menuitem"]').filter({ hasText: 'Sign out' }),
  ).toHaveCount(1);
}
