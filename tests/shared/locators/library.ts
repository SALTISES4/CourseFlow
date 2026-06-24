import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Shared library listing uiObjects — canonical_locators.yaml (library*, keywordSearch*, projectCard, workflowCard).
 */

export const KEYWORD_SEARCH_PLACEHOLDER = 'Search in projects...';
export const LIBRARY_EMPTY_MESSAGE = 'No results found';
export const DISCIPLINE_SEARCH_LABEL = 'Find discipline';
export const SORT_OPTION_A_TO_Z = 'A - Z';
export const SORT_OPTION_CREATION_DATE = 'Creation date';

/** canonical: keywordSearchField */
export function keywordSearchField(page: Page): Locator {
  return page.getByPlaceholder(KEYWORD_SEARCH_PLACEHOLDER);
}

/** canonical: keywordSearchClearButton */
export function keywordSearchClearButton(page: Page): Locator {
  return keywordSearchField(page).locator('..').getByRole('button');
}

/** canonical: libraryFilterToolbar / projectWorkflowsFilterToolbar */
export function libraryFilterToolbar(page: Page): Locator {
  return page.locator('[data-test-id="library-filter-toolbar"]');
}

export function sortControl(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button').first();
}

/** canonical: ownershipFilter */
export function ownershipFilter(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: /^(Ownership|All|Owned|Shared with me)$/ });
}

/** canonical: typeFilter / contentTypeFilter */
export function typeFilter(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: /^(Type|All|Projects|Workflows)$/ });
}

export function workflowTypeFilter(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: /^Workflow Type$/ });
}

/** canonical: disciplineFilter */
export function disciplineFilter(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: /^Discipline$/ });
}

/** canonical: templatesToggle / templateFilter */
export function templatesToggle(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: 'Templates', exact: true });
}

/** canonical: favouritesToggle */
export function favouritesToggle(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: 'Favourites', exact: true });
}

/** canonical: archiveToggle */
export function archiveToggle(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole('button', { name: 'Archive', exact: true });
}

/** canonical: libraryLoadingSkeletons */
export function libraryLoadingSkeletons(page: Page): Locator {
  return page.locator('[data-test-id="library-loading-skeleton"]');
}

/** canonical: libraryEmptyState */
export function libraryEmptyState(page: Page): Locator {
  return page.getByText(LIBRARY_EMPTY_MESSAGE, { exact: true });
}

export function libraryErrorState(page: Page): Locator {
  return page.getByText(/An error occurred|The content you were looking for is not found/);
}

/**
 * canonical: projectCard | workflowCard — listing cards in library results grid.
 * Matches [data-test-id="project-card"] and [data-test-id="workflow-card"].
 */
export function libraryCards(page: Page): Locator {
  return page.locator('[data-test-id="library-results"] [data-test-id$="-card"]');
}

/** canonical: projectCard */
export function projectCard(page: Page): Locator {
  return page.locator('[data-test-id="project-card"]');
}

/** canonical: workflowCard */
export function workflowCard(page: Page): Locator {
  return page.locator('[data-test-id="workflow-card"]');
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

/** Sort menu item — canonical sortControl dropdown option. */
export function sortMenuItem(page: Page, optionLabel: string): Locator {
  return page.getByRole('menuitem', { name: optionLabel, exact: true });
}

export async function selectSortOption(page: Page, optionLabel: string): Promise<void> {
  await sortControl(page).click();
  await sortMenuItem(page, optionLabel).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
}

export async function selectFilterOption(page: Page, filter: Locator, optionLabel: string): Promise<void> {
  await filter.click();
  await page.getByRole('menuitem', { name: optionLabel, exact: true }).click();
}
