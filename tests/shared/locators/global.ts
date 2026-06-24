import type { Locator, Page } from '@playwright/test';

/**
 * Cross-domain uiObjects from canonical_locators.yaml (global*).
 */

/** canonical: globalMessageSnackbar — unresolved in YAML; notistack host id. */
export function globalMessageSnackbar(page: Page): Locator {
  return page.locator('#notistack-snackbar');
}
