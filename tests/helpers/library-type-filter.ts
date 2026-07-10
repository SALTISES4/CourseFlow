import { expect, type Page } from '@playwright/test';

import {
  selectFilterOption,
  TYPE_FILTER_PLACEHOLDER,
  typeFilter,
  typeFilterResetButton,
  workflowTypeFilter,
} from '../shared/locators/library';

/** FR-LIB-003 — workflowTypeFilter visible when typeFilter is committed to Workflows. */
export async function expectWorkflowTypeFilterVisibleWhenTypeIsWorkflows(page: Page): Promise<void> {
  await selectFilterOption(page, typeFilter(page), 'Workflows');
  await expect(typeFilter(page)).toHaveText('Workflows', { exact: true });
  await expect(workflowTypeFilter(page)).toBeVisible();
}

/**
 * FR-LIB-003 — workflowTypeFilter visible when typeFilter is Unset (both types in scope).
 * My library and Favourites first land on committed 'Projects'; reset restores Unset.
 */
export async function expectWorkflowTypeFilterVisibleWhenTypeIsUnset(page: Page): Promise<void> {
  if ((await typeFilter(page).innerText()).trim() === 'Projects') {
    await expect(typeFilterResetButton(page)).toBeVisible();
    await typeFilterResetButton(page).click();
  }

  await expect(typeFilter(page)).toHaveText(TYPE_FILTER_PLACEHOLDER, { exact: true });
  await expect(workflowTypeFilter(page)).toBeVisible();
}

/** FR-LIB-003 — workflowTypeFilter hidden when typeFilter is committed to Projects only. */
export async function expectWorkflowTypeFilterHiddenWhenTypeIsProjects(page: Page): Promise<void> {
  await selectFilterOption(page, typeFilter(page), 'Projects');
  await expect(typeFilter(page)).toHaveText('Projects', { exact: true });
  await expect(workflowTypeFilter(page)).toHaveCount(0);
}
