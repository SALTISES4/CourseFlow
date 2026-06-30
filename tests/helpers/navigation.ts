import type { Page } from '@playwright/test';

/** Authenticated app home (relies on `baseURL` in playwright.config). */
export async function gotoCourseFlowHome(page: Page): Promise<void> {
  await page.goto('/home');
}

/** My library listing at `/library`. */
export async function gotoLibrary(page: Page): Promise<void> {
  await page.goto('/library');
}

/** Explore published library at `/explore`. */
export async function gotoExplore(page: Page): Promise<void> {
  await page.goto('/explore');
}

/** Favourites listing at `/favourites`. */
export async function gotoFavourites(page: Page): Promise<void> {
  await page.goto('/favourites');
}

/** Profile settings at `/user/profile-settings`. */
export async function gotoProfileSettings(page: Page): Promise<void> {
  await page.goto('/user/profile-settings');
}

/** Notification settings at `/user/notifications-settings`. */
export async function gotoNotificationsSettings(page: Page): Promise<void> {
  await page.goto('/user/notifications-settings');
}

/** Project overview at `/project/{uuid}`. */
export async function gotoProject(page: Page, projectPath: string): Promise<void> {
  await page.goto(projectPath);
}

/** Project workflows tab at `/project/{uuid}/workflows`. */
export async function gotoProjectWorkflows(page: Page, workflowsPath: string): Promise<void> {
  await page.goto(workflowsPath);
}

/** Opens authenticated shell at `/home` with sidebar expanded. */
export async function gotoAuthenticatedShell(page: Page, path = '/home'): Promise<void> {
  await page.addInitScript(() => {
    sessionStorage.removeItem('collapsed_sidebar');
  });
  await page.goto(path);
}
