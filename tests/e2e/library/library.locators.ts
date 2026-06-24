import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Locators for Library listing pages (My library, Explore, Favourites).
 * Aligned with tests/docs/requirements/features/shared/canonical_locators.yaml.
 */

export const KEYWORD_SEARCH_PLACEHOLDER = 'Search in projects...';
export const LIBRARY_EMPTY_MESSAGE = 'No results found';
export const DISCIPLINE_SEARCH_LABEL = 'Find discipline';

export function sortControl(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button').first();
}

export function ownershipFilter(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: /^(Ownership|All|Owned|Shared with me)$/ });
}

export function typeFilter(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: /^(Type|All|Projects|Workflows)$/ });
}

export function workflowTypeFilter(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: /^Workflow Type$/ });
}

export function disciplineFilter(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: /^Discipline$/ });
}

export function templatesToggle(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: 'Templates', exact: true });
}

export function favouritesToggle(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: 'Favourites', exact: true });
}

export function archiveToggle(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: 'Archive', exact: true });
}

export function keywordSearchField(page: Page): Locator {
  return page.getByPlaceholder(KEYWORD_SEARCH_PLACEHOLDER);
}

export function keywordSearchClearButton(page: Page): Locator {
  return keywordSearchField(page)
    .locator('xpath=ancestor::div[contains(@class,"MuiInputBase-root")]')
    .getByRole('button');
}

export function libraryFilterToolbar(page: Page): Locator {
  return page.locator('.MuiToolbar-root').filter({ has: keywordSearchField(page) });
}

export function libraryLoadingSkeletons(page: Page): Locator {
  return page.locator('.MuiSkeleton-root');
}

export function libraryEmptyState(page: Page): Locator {
  return page.getByText(LIBRARY_EMPTY_MESSAGE, { exact: true });
}

export function libraryErrorState(page: Page): Locator {
  return page.getByText(/An error occurred|The content you were looking for is not found/);
}

/** projectCard / workflowCard rows in the listing grid. */
export function libraryCards(page: Page): Locator {
  return page.locator('header').filter({ has: page.locator('xpath=following-sibling::footer[1]') }).locator('..');
}

export function libraryPagination(page: Page): Locator {
  return page.getByRole('navigation', { name: 'pagination navigation' });
}

export function firstLibraryCardTitle(page: Page): Locator {
  return libraryCards(page).first().locator('header').locator('> *').first();
}

export async function waitForLibraryResultsLoaded(page: Page): Promise<void> {
  await expect(libraryLoadingSkeletons(page)).toHaveCount(0, { timeout: 15_000 });
  await expect(
    libraryCards(page)
      .first()
      .or(libraryEmptyState(page))
      .or(libraryErrorState(page)),
  ).toBeVisible({ timeout: 15_000 });
}

export async function selectSortOption(page: Page, optionLabel: string): Promise<void> {
  await sortControl(page).click();
  await page.getByRole('menuitem', { name: optionLabel, exact: true }).click();
  // SortableFilterButton menu can leave aria-hidden on the page until dismissed.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
}

export async function selectFilterOption(page: Page, filter: Locator, optionLabel: string): Promise<void> {
  await filter.click();
  await page.getByRole('menuitem', { name: optionLabel, exact: true }).click();
}
