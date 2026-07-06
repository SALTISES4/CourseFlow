import { expect, type Locator, type Page } from '@playwright/test';

import {
  SORT_OPTION_A_TO_Z,
  SORT_OPTION_DATE_CREATED,
  SORT_OPTION_RECENT,
  SORT_PLACEHOLDER,
  selectSortOption,
  sortControl,
  sortMenuItem,
  sortResetButton,
} from '../shared/locators/library';

export type LibrarySortControlContext = {
  sortControl: Locator;
  sortResetButton: Locator;
  selectSortOption: (page: Page, optionLabel: string) => Promise<void>;
};

/**
 * FR-LIB-002 — sort menu options, selected option replaces Sort placeholder, sortResetButton.
 * Reused by FR-EXP-002, FR-FAV-002, and FR-PROJ-WF-002 (same sort contract).
 */
export async function expectSortControlPerFrLib002(
  page: Page,
  context: Partial<LibrarySortControlContext> = {},
): Promise<void> {
  const control = context.sortControl ?? sortControl(page);
  const reset = context.sortResetButton ?? sortResetButton(page);
  const pickSortOption =
    context.selectSortOption ??
    ((p: Page, optionLabel: string) => selectSortOption(p, optionLabel, control));

  // FR-LIB-002 — sortControl shows placeholder 'Sort' until user picks an option.
  await expect(control).toBeVisible();
  await expect(control).toHaveText(SORT_PLACEHOLDER, { exact: true });
  await expect(reset).toBeHidden();

  await control.click();
  await expect(sortMenuItem(page, SORT_OPTION_A_TO_Z)).toBeVisible();
  await expect(sortMenuItem(page, SORT_OPTION_DATE_CREATED)).toBeVisible();
  await expect(sortMenuItem(page, SORT_OPTION_RECENT)).toHaveCount(0);
  await expect(page.getByRole('menu').getByRole('menuitem')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);

  await pickSortOption(page, SORT_OPTION_A_TO_Z);
  // FR-LIB-002 — active sort replaces Sort placeholder; sortResetButton appears.
  await expect(control).toHaveText(SORT_OPTION_A_TO_Z, { exact: true });
  await expect(control).not.toHaveText(SORT_PLACEHOLDER);
  await expect(reset).toBeVisible();

  await reset.click();
  await expect(control).toHaveText(SORT_PLACEHOLDER, { exact: true });
  await expect(reset).toBeHidden();

  await pickSortOption(page, SORT_OPTION_DATE_CREATED);
  await expect(control).toHaveText(SORT_OPTION_DATE_CREATED, { exact: true });
  await expect(control).not.toHaveText(SORT_PLACEHOLDER);
  await expect(reset).toBeVisible();

  await reset.click();
  await expect(control).toHaveText(SORT_PLACEHOLDER, { exact: true });
  await expect(reset).toBeHidden();
}
