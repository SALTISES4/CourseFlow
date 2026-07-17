import { expect, type Locator, type Page } from '@playwright/test';

import {
  OWNERSHIP_OPTION_OWNED,
  OWNERSHIP_OPTION_SHARED,
  OWNERSHIP_PLACEHOLDER,
  ownershipFilter,
  ownershipFilterResetButton,
  selectFilterOption,
} from '../shared/locators/library';

export type LibraryOwnershipFilterContext = {
  ownershipFilter: Locator;
  ownershipFilterResetButton: Locator;
  selectOwnershipOption: (page: Page, optionLabel: string) => Promise<void>;
};

/**
 * FR-LIB-003 — ownershipFilter shows placeholder until committed; active option replaces
 * 'Ownership'; ownershipFilterResetButton visible when an option is active and clears selection.
 * Reused by FR-FAV-003 and FR-PROJ-WF-003 (same ownership filter contract).
 */
export async function expectOwnershipFilterCommittedStatePerFrLib003(
  page: Page,
  context: Partial<LibraryOwnershipFilterContext> = {},
): Promise<void> {
  const filter = context.ownershipFilter ?? ownershipFilter(page);
  const reset = context.ownershipFilterResetButton ?? ownershipFilterResetButton(page, filter);
  const pickOwnershipOption =
    context.selectOwnershipOption ??
    ((p: Page, optionLabel: string) => selectFilterOption(p, filter, optionLabel));

  await expect(filter).toBeVisible();
  await expect(filter).toHaveText(OWNERSHIP_PLACEHOLDER, { exact: true });
  await expect(reset).toBeHidden();

  await pickOwnershipOption(page, OWNERSHIP_OPTION_OWNED);
  await expect(filter).toHaveText(OWNERSHIP_OPTION_OWNED, { exact: true });
  await expect(filter).not.toHaveText(OWNERSHIP_PLACEHOLDER);
  await expect(reset).toBeVisible();

  await reset.click();
  await expect(filter).toHaveText(OWNERSHIP_PLACEHOLDER, { exact: true });
  await expect(reset).toBeHidden();

  await pickOwnershipOption(page, OWNERSHIP_OPTION_SHARED);
  await expect(filter).toHaveText(OWNERSHIP_OPTION_SHARED, { exact: true });
  await expect(filter).not.toHaveText(OWNERSHIP_PLACEHOLDER);
  await expect(reset).toBeVisible();

  await reset.click();
  await expect(filter).toHaveText(OWNERSHIP_PLACEHOLDER, { exact: true });
  await expect(reset).toBeHidden();
}
