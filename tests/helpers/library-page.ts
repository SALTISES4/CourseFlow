import { expect, type Page } from '@playwright/test';

import { cardTitleText } from '../shared/locators/cards';
import {
  archiveToggle,
  disciplineFilter,
  favouritesToggle,
  expectLibraryCardTitles,
  keywordSearchField,
  libraryCards,
  libraryCardTitles,
  libraryFilterToolbar,
  ownershipFilter,
  ownershipFilterResetButton,
  selectFilterOption,
  sortControl,
  templatesToggle,
  typeFilter,
  triggerLibrarySearchAndWait,
  waitForLibraryResultsLoaded,
} from '../shared/locators/library';
import {
  expectExploreResultsContainOnlyProjectCards,
  expectExploreResultsContainOnlyWorkflowCards,
} from './explore';
import { expectExploreResultsContainOnlyFavouritedCards } from './explore-boolean-filters';
import { loadWorkflowManifest } from './manifest';

/**
 * FR-LIB-001 — libraryFilterToolbar exposes sort, ownership, type, favourites, and archive.
 * Requirements: tests/docs/requirements/features/library/library_page_requirements_v1.yaml
 *
 * workflowTypeFilter visibility is covered under FR-LIB-003. Keyword search is FR-LIB-004.
 * templatesToggle and disciplineFilter belong on Explore/Favourites, not My library.
 */
export async function expectLibraryFilterToolbarPerFrLib001(page: Page): Promise<void> {
  await expect(libraryFilterToolbar(page)).toBeVisible();

  // Controls that belong on other listing pages, not My library.
  await expect.soft(disciplineFilter(page)).toHaveCount(0);
  await expect.soft(templatesToggle(page)).toHaveCount(0);

  // Required toolbar filters on My library.
  await expect.soft(sortControl(page)).toBeVisible();
  await expect.soft(ownershipFilter(page)).toBeVisible();
  await expect.soft(typeFilter(page)).toBeVisible();
  await expect.soft(favouritesToggle(page)).toBeVisible();
  await expect.soft(archiveToggle(page)).toBeVisible();
}

export {
  expectExploreResultsContainOnlyProjectCards as expectMyLibraryResultsContainOnlyProjectCards,
  expectExploreResultsContainOnlyWorkflowCards as expectMyLibraryResultsContainOnlyWorkflowCards,
};

type LibrarySearchResponse = {
  items: Array<{
    uuid: string;
    isFavorite?: boolean;
    permissions: { resourceRole: string | null };
  }>;
};

const MY_LIBRARY_MEMBERSHIP_ROLES = new Set([
  'owner',
  'editor',
  'viewer',
  'commenter',
]);

function isLibrarySearchResponse(response: {
  url: () => string;
  request: () => { method: () => string };
  status: () => number;
}): boolean {
  return (
    response.url().includes('/api/library/search') &&
    response.request().method() === 'POST' &&
    response.status() === 200
  );
}

/**
 * FR-LIB-001 — My library listing only returns items in membership scope (API contract).
 * Base scope: projects/workflows created by the user or where the user is editor, viewer, or commenter.
 */
export async function expectMyLibraryListingItemsAreInMembershipScope(page: Page): Promise<void> {
  const manifest = loadWorkflowManifest();

  const searchResponse = page.waitForResponse(isLibrarySearchResponse);
  await page.reload();
  await expect(page).toHaveURL(/\/library\/?$/);
  await waitForLibraryResultsLoaded(page);

  const response = await searchResponse;
  const body = (await response.json()) as LibrarySearchResponse;

  for (const item of body.items) {
    const resourceRole = item.permissions.resourceRole;
    expect(
      MY_LIBRARY_MEMBERSHIP_ROLES.has(resourceRole ?? ''),
      `library search item ${item.uuid} has non-membership resource role ${resourceRole ?? 'none'}`,
    ).toBe(true);
    expect(item.uuid).not.toBe(manifest.restricted_workflow.project_uuid);
  }
}

/** When default Projects scope is empty, open Workflows for in-scope workflow seed rows. */
export async function ensureMyLibraryResultsHaveCards(page: Page): Promise<boolean> {
  if ((await libraryCards(page).count()) > 0) {
    return true;
  }

  await triggerLibrarySearchAndWait(
    page,
    () => selectFilterOption(page, typeFilter(page), 'Workflows'),
    { filters: { contentType: 'workflow' } },
  );
  return (await libraryCards(page).count()) > 0;
}

/** FR-LIB-003 — ownershipFilter Owned narrows results to owner-role API rows. */
export async function expectOwnershipFilterOwnedNarrowsMyLibraryResults(page: Page): Promise<void> {
  const baselineTitles = await libraryCardTitles(page).allInnerTexts();
  const baselineCount = baselineTitles.length;
  expect(baselineCount).toBeGreaterThan(0);

  const filteredResponse = await triggerLibrarySearchAndWait(
    page,
    () => selectFilterOption(page, ownershipFilter(page), 'Owned'),
    { filters: { ownership: 'owned' } },
  );
  await expect(ownershipFilter(page)).toHaveText('Owned', { exact: true });
  await expect(ownershipFilterResetButton(page)).toBeVisible();

  const ownedCount = filteredResponse.items.length;
  expect(ownedCount).toBeLessThanOrEqual(baselineCount);
  expect(ownedCount).toBeGreaterThan(0);

  for (const item of filteredResponse.items) {
    expect(item.permissions?.resourceRole).toBe('owner');
  }
}

/** FR-LIB-003 — favouritesToggle restricts resultsRegion to favourited in-scope cards. */
export async function expectFavouritesToggleNarrowsMyLibraryResults(page: Page): Promise<void> {
  const baselineTitles = await libraryCardTitles(page).allInnerTexts();
  const baselineCount = baselineTitles.length;
  expect(baselineCount).toBeGreaterThan(0);

  const filteredResponse = await triggerLibrarySearchAndWait(
    page,
    () => favouritesToggle(page).click(),
    { filters: { isFavorite: true } },
  );
  await expect(favouritesToggle(page)).toHaveClass(/MuiButton-contained/);

  const favouritedOnlyCount = filteredResponse.items.length;
  expect(favouritedOnlyCount).toBeGreaterThan(0);
  expect(favouritedOnlyCount).toBeLessThanOrEqual(baselineCount);
  await expectExploreResultsContainOnlyFavouritedCards(page);

  await favouritesToggle(page).click();
  await expect(favouritesToggle(page)).not.toHaveClass(/MuiButton-contained/);
  await expectLibraryCardTitles(page, baselineTitles);

  const restoredCount = await libraryCards(page).count();
  expect(restoredCount).toBeGreaterThanOrEqual(favouritedOnlyCount);
}

/** FR-LIB-004 — keyword search narrows resultsRegion to matching card titles. */
export async function expectKeywordSearchNarrowsMyLibraryResults(
  page: Page,
  keyword: string,
): Promise<void> {
  const baselineCount = await libraryCards(page).count();
  expect(baselineCount).toBeGreaterThan(0);

  const filteredResponse = await triggerLibrarySearchAndWait(
    page,
    async () => {
      await keywordSearchField(page).fill(keyword);
      await keywordSearchField(page).press('Enter');
    },
    { filters: { keyword } },
  );

  const narrowedCount = filteredResponse.items.length;
  expect(narrowedCount).toBeGreaterThan(0);
  expect(narrowedCount).toBeLessThanOrEqual(baselineCount);

  const cards = libraryCards(page);
  for (let i = 0; i < narrowedCount; i++) {
    await expect(cardTitleText(cards.nth(i))).toContainText(keyword);
  }
}
