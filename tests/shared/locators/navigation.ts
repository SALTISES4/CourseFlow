import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Shared navigation uiObjects — canonical_locators.yaml (mainNavigation*, topNavigation*, addMenu*, accountMenu*).
 */

export const BRAND_NAME = 'CourseFlow';
export const HELP_SUPPORT_URL = 'https://courseflow.freshdesk.com/support/home';

/** canonical: mainNavigation — [data-test-id="main-nav"] */
export function mainNavigation(page: Page): Locator {
  return page.locator('[data-test-id="main-nav"]');
}

/** Visible sidebar panel (alias for mainNavigation root). */
export function mainNavigationPanel(page: Page): Locator {
  return mainNavigation(page);
}

export function brandLockup(page: Page): Locator {
  return mainNavigation(page).getByText(BRAND_NAME, { exact: true });
}

/** canonical: collapseToggle */
export function collapseToggle(page: Page): Locator {
  return page.getByRole('button', { name: 'collapse sidebar' });
}

/** canonical: homeNavItem */
export function homeNavItem(page: Page): Locator {
  return page.locator('[data-test-id="panel-home"]');
}

/** canonical: myLibraryNavItem */
export function myLibraryNavItem(page: Page): Locator {
  return page.locator('[data-test-id="panel-library"]');
}

/** canonical: exploreNavItem */
export function exploreNavItem(page: Page): Locator {
  return page.locator('[data-test-id="panel-explore"]');
}

export function favouritesSectionLabel(page: Page): Locator {
  return mainNavigation(page).getByText('Favourites', { exact: true });
}

/** canonical: favouritedItemLink */
export function favouritedItemLinks(page: Page): Locator {
  return mainNavigation(page).locator('[data-test-id="panel-favourite"]');
}

export function viewAllLink(page: Page): Locator {
  return mainNavigation(page).getByRole('link', { name: 'View all', exact: true });
}

export function helpAndSupportLink(page: Page): Locator {
  return mainNavigation(page).getByRole('link', { name: /Help and [Ss]upport/ });
}

/** canonical: containsSection */
export function containsSection(page: Page): Locator {
  return mainNavigation(page).getByText('Contains', { exact: true });
}

/** canonical: appearsInSection */
export function appearsInSection(page: Page): Locator {
  return mainNavigation(page).getByText('Appears in', { exact: true });
}

export type WorkflowContextSectionLabel = 'Contains' | 'Appears in';

/** canonical: relatedWorkflowList — links under containsSection or appearsInSection */
export function relatedWorkflowLinksInWorkflowContextSection(
  page: Page,
  sectionLabel: WorkflowContextSectionLabel,
): Locator {
  const sectionLabelLocator = mainNavigation(page).getByText(sectionLabel, { exact: true });
  return sectionLabelLocator.locator('..').getByRole('link');
}

/** canonical: topNavigationBar — [data-test-id="top-bar"] */
export function topNavigationBar(page: Page): Locator {
  return page.locator('[data-test-id="top-bar"]');
}

/** canonical: addMenuTrigger — SimpleMenu sets data-test-id="add-menu-button" */
export function addMenuTrigger(page: Page): Locator {
  return page.locator('[data-test-id="add-menu-button"]');
}

/** canonical: accountMenuTrigger — SimpleMenu sets data-test-id="account-menu-button" */
export function accountMenuTrigger(page: Page): Locator {
  return page.locator('[data-test-id="account-menu-button"]');
}

/** canonical: notificationsMenuTrigger — deferred FR-TOP-004/006/008; absent in current phase */
export function notificationsMenuTrigger(page: Page): Locator {
  return topNavigationBar(page).locator('[aria-controls="notifications-menu"]');
}

export function returnLinksRegion(page: Page): Locator {
  return topNavigationBar(page).locator('.back-links-wrap');
}

/** canonical: backToProjectLink */
export function backToProjectLink(page: Page): Locator {
  return returnLinksRegion(page).getByRole('link').filter({ hasText: /Return to/ });
}

/** canonical: addMenuItemProject */
export function addMenuItemProject(page: Page): Locator {
  return page.getByRole('menuitem', { name: 'Project', exact: true });
}

/** canonical: addMenuItemProgram */
export function addMenuItemProgram(page: Page): Locator {
  return page.getByRole('menuitem', { name: 'Program', exact: true });
}

/** canonical: addMenuItemCourse */
export function addMenuItemCourse(page: Page): Locator {
  return page.getByRole('menuitem', { name: 'Course', exact: true });
}

/** canonical: addMenuItemActivity */
export function addMenuItemActivity(page: Page): Locator {
  return page.getByRole('menuitem', { name: 'Activity', exact: true });
}

/** canonical: accountMenuItemProfile */
export function accountMenuItemProfile(page: Page): Locator {
  return page.getByRole('menuitem', { name: 'Profile', exact: true });
}

/** canonical: accountMenuItemPassword */
export function accountMenuItemPassword(page: Page): Locator {
  return page.getByRole('menuitem', { name: 'Password reset', exact: true });
}

/** canonical: accountMenuItemNotificationsSettings */
export function accountMenuItemNotificationsSettings(page: Page): Locator {
  return page.getByRole('menuitem', { name: 'Notification settings', exact: true });
}

/** canonical: accountMenuItemSignOut */
export function accountMenuItemSignOut(page: Page): Locator {
  return page.getByRole('menuitem', { name: 'Sign out', exact: true });
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
