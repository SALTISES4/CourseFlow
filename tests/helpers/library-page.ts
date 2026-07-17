import { expect, type Page } from '@playwright/test';

import { cardOwnerText, cardTitleText } from '../shared/locators/cards';
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
import {
  loadWorkflowManifest,
  type WorkflowEntry,
  type WorkflowManifest,
} from './manifest';

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
  items: Array<{ uuid: string; isFavorite?: boolean }>;
};

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

function primaryWorkflowUuid(workflow: WorkflowEntry): string {
  const withUuid = workflow as WorkflowEntry & { workflow_uuid?: string };
  if (withUuid.workflow_uuid) {
    return withUuid.workflow_uuid;
  }

  const match = workflow.workflow_path.match(/^\/workflow\/([^/]+)\//);
  if (!match?.[1]) {
    throw new Error(`Cannot resolve workflow UUID from path ${workflow.workflow_path}`);
  }

  return match[1];
}

/** UUIDs for projects/workflows the E2E admin owns or contributes to (manifest in-scope set). */
export function collectMyLibraryMembershipScopeUuids(manifest: WorkflowManifest): Set<string> {
  const uuids = new Set<string>([manifest.project_uuid]);

  for (const workflow of manifest.workflows) {
    uuids.add(primaryWorkflowUuid(workflow));
  }

  if (manifest.template_project_uuid) {
    uuids.add(manifest.template_project_uuid);
  }

  for (const templateWorkflow of manifest.template_workflows ?? []) {
    uuids.add(templateWorkflow.workflow_uuid);
  }

  return uuids;
}

/**
 * FR-LIB-001 — My library listing only returns items in membership scope (API contract).
 * Base scope: projects/workflows created by the user or where the user is editor, viewer, or commenter.
 */
export async function expectMyLibraryListingItemsAreInMembershipScope(page: Page): Promise<void> {
  const manifest = loadWorkflowManifest();
  const inScopeUuids = collectMyLibraryMembershipScopeUuids(manifest);

  const searchResponse = page.waitForResponse(isLibrarySearchResponse);
  await page.reload();
  await expect(page).toHaveURL(/\/library\/?$/);
  await waitForLibraryResultsLoaded(page);

  const response = await searchResponse;
  const body = (await response.json()) as LibrarySearchResponse;

  for (const item of body.items) {
    expect(
      inScopeUuids.has(item.uuid),
      `library search item ${item.uuid} is outside My library membership scope`,
    ).toBe(true);
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

/** FR-LIB-003 — ownershipFilter Owned narrows results and every visible card shows owner attribution. */
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

  const cards = libraryCards(page);
  for (let i = 0; i < ownedCount; i++) {
    await expect(cardOwnerText(cards.nth(i))).toBeVisible();
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
