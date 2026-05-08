import type { Page } from '@playwright/test';

/** Authenticated app home (relies on `baseURL` in playwright.config). */
export async function gotoCourseFlowHome(page: Page): Promise<void> {
  await page.goto('/course-flow/home');
}
