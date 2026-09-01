import { expect, type Page } from '@playwright/test';

import {
  archiveToggle,
  disciplineFilter,
  favouritesToggle,
  keywordSearchField,
  libraryCards,
  libraryFilterToolbar,
  libraryProjectCardByTitle,
  libraryResultsProjectCards,
  libraryResultsWorkflowCards,
  libraryWorkflowCardByTitle,
  ownershipFilter,
  sortControl,
  templatesToggle,
  triggerLibrarySearchAndWait,
  typeFilter,
  workflowTypeFilter,
} from '../e2e/library/library.locators';

async function submitExploreKeywordSearch(page: Page, keyword: string): Promise<void> {
  await keywordSearchField(page).fill(keyword);
  await keywordSearchField(page).press('Enter');
}

function exploreCardByTitle(page: Page, title: string) {
  return libraryProjectCardByTitle(page, title).or(libraryWorkflowCardByTitle(page, title));
}

/** FR-EXP-001 — excluded titles must not appear as cards in resultsRegion. */
export async function expectExploreResultsExcludeTitles(
  page: Page,
  excludedTitles: readonly string[],
): Promise<void> {
  for (const title of excludedTitles) {
    await expect(
      exploreCardByTitle(page, title),
      `Explore must not list "${title}"`,
    ).toHaveCount(0);
  }
}

/** FR-EXP-001 — keyword search must not return unpublished titles in API items or DOM. */
export async function expectExploreKeywordSearchExcludesTitles(
  page: Page,
  keyword: string,
  excludedTitles: readonly string[],
): Promise<void> {
  const response = await triggerLibrarySearchAndWait(
    page,
    () => submitExploreKeywordSearch(page, keyword),
    { filters: { keyword } },
  );
  const resultTitles = response.items.map((item) => item.title);
  for (const title of excludedTitles) {
    expect(
      resultTitles,
      `Explore search for "${keyword}" must not return "${title}"`,
    ).not.toContain(title);
  }
  await expectExploreResultsExcludeTitles(page, excludedTitles);
}

/** FR-EXP-001 / FR-PROJ-OV-003 — published title appears after keyword search. */
export async function expectExploreKeywordSearchIncludesTitle(
  page: Page,
  keyword: string,
  expectedTitle: string,
): Promise<void> {
  const response = await triggerLibrarySearchAndWait(
    page,
    () => submitExploreKeywordSearch(page, keyword),
    { filters: { keyword } },
  );
  expect(
    response.items.map((item) => item.title),
    `Explore search for "${keyword}" must return "${expectedTitle}"`,
  ).toContain(expectedTitle);
  await expect(exploreCardByTitle(page, expectedTitle)).toBeVisible();
}

/**
 * FR-EXP-001 — exploreFilterToolbar exposes only sort, discipline, type, workflow-type,
 * favourites, templates, and keyword (explore_page_requirements_v1.yaml uiObjectDefinitions).
 *
 * Uses soft assertions so absent required controls and forbidden controls both surface in one run.
 */
export async function expectExploreFilterToolbarPerFrExp001(page: Page): Promise<void> {
  await expect(libraryFilterToolbar(page)).toBeVisible();

  // My library-only toolbar controls must not appear on Explore.
  await expect.soft(ownershipFilter(page)).toHaveCount(0);
  await expect.soft(archiveToggle(page)).toHaveCount(0);

  // Required controls per exploreFilterToolbar definition.
  await expect.soft(sortControl(page)).toBeVisible();
  await expect.soft(disciplineFilter(page)).toBeVisible();
  await expect.soft(typeFilter(page)).toBeVisible();
  await expect.soft(workflowTypeFilter(page)).toBeVisible();
  await expect.soft(favouritesToggle(page)).toBeVisible();
  await expect.soft(templatesToggle(page)).toBeVisible();
  await expect.soft(keywordSearchField(page)).toBeVisible();
}

/** FR-EXP-004 — resultsRegion contains only projectCard instances (no workflowCard). */
export async function expectExploreResultsContainOnlyProjectCards(page: Page): Promise<void> {
  await expect(libraryResultsWorkflowCards(page)).toHaveCount(0);

  const projectCardCount = await libraryResultsProjectCards(page).count();
  if (projectCardCount === 0) {
    return;
  }

  await expect(libraryCards(page)).toHaveCount(projectCardCount);
}

/** FR-EXP-004 — resultsRegion contains only workflowCard instances (no projectCard). */
export async function expectExploreResultsContainOnlyWorkflowCards(page: Page): Promise<void> {
  await expect(libraryResultsProjectCards(page)).toHaveCount(0);

  const workflowCardCount = await libraryResultsWorkflowCards(page).count();
  if (workflowCardCount === 0) {
    return;
  }

  await expect(libraryCards(page)).toHaveCount(workflowCardCount);
}
