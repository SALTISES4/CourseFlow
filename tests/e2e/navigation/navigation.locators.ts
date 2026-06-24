import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Locators for main (left) and top navigation — aligned with
 * tests/docs/requirements/features/shared/canonical_locators.yaml.
 */

export const BRAND_NAME = 'CourseFlow';
export const HELP_SUPPORT_URL = 'https://courseflow.freshdesk.com/support/home';

export function mainNavigation(page: Page): Locator {
  return page.locator('.main-wrapper > div').first();
}

export function mainNavigationPanel(page: Page): Locator {
  return mainNavigation(page).locator('.MuiPaper-root');
}

export function brandLockup(page: Page): Locator {
  return mainNavigationPanel(page).getByText(BRAND_NAME, { exact: true });
}

export function collapseToggle(page: Page): Locator {
  return page.locator('[aria-label="collapse sidebar"]');
}

export function homeNavItem(page: Page): Locator {
  return page.locator('[data-test-id="panel-home"]');
}

export function myLibraryNavItem(page: Page): Locator {
  return page.locator('[data-test-id="panel-library"]');
}

export function exploreNavItem(page: Page): Locator {
  return page.locator('[data-test-id="panel-explore"]');
}

export function favouritesSectionLabel(page: Page): Locator {
  return mainNavigationPanel(page).getByText('Favourites', { exact: true });
}

export function favouritedItemLinks(page: Page): Locator {
  return mainNavigationPanel(page).locator('[data-test-id="panel-favourite"]');
}

export function viewAllLink(page: Page): Locator {
  return mainNavigationPanel(page).getByRole('link', { name: 'View all', exact: true });
}

export function helpAndSupportLink(page: Page): Locator {
  return mainNavigationPanel(page).getByRole('link', { name: /Help and [Ss]upport/ });
}

export function containsSection(page: Page): Locator {
  return mainNavigationPanel(page).getByText('Contains', { exact: true });
}

export function appearsInSection(page: Page): Locator {
  return mainNavigationPanel(page).getByText('Appears in', { exact: true });
}

export function topNavigationBar(page: Page): Locator {
  return page.locator('.main-block .MuiAppBar-root');
}

/** Trailing icon cluster: add menu, notifications, account (in order). */
export function topBarIconButtons(page: Page): Locator {
  return topNavigationBar(page).locator('.MuiStack-root .MuiIconButton-root');
}

export function addMenuTrigger(page: Page): Locator {
  return topBarIconButtons(page).nth(0);
}

export function accountMenuTrigger(page: Page): Locator {
  return topBarIconButtons(page).nth(2);
}

export function returnLinksRegion(page: Page): Locator {
  return topNavigationBar(page).locator('.back-links-wrap');
}

export function backToProjectLink(page: Page): Locator {
  return returnLinksRegion(page).getByRole('link').filter({ hasText: /Return to/ });
}

export function createProjectDialog(page: Page): Locator {
  return page.getByRole('dialog');
}

export function passwordResetDialog(page: Page): Locator {
  return page.getByRole('dialog').filter({ hasText: 'Password reset' });
}

/** Clears collapsed sidebar session flag before navigation. Call before first `goto`. */
export async function prepareExpandedMainNavigation(page: Page): Promise<void> {
  await page.addInitScript(() => {
    sessionStorage.removeItem('collapsed_sidebar');
  });
}

export async function waitForMainNavigationReady(page: Page): Promise<void> {
  await expect(homeNavItem(page)).toBeVisible({ timeout: 15_000 });
}

export async function ensureMainNavigationExpanded(page: Page): Promise<void> {
  if (await mainNavigationPanel(page).isVisible()) {
    return;
  }

  await collapseToggle(page).click();
  await expect(mainNavigationPanel(page)).toBeVisible({ timeout: 15_000 });
}
