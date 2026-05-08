import type { Locator, Page } from '@playwright/test';

/** Home / shell — library entry in the main nav. */
export function panelLibrary(page: Page): Locator {
  return page.locator('[data-test-id="panel-library"]');
}
