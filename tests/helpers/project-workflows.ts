import { expect, type Page } from '@playwright/test';

import { cardOwnerText, cardTitleText } from '../shared/locators/cards';
import {
  keywordSearchField,
  libraryCards,
  libraryResultsProjectCards,
  libraryResultsWorkflowCards,
  ownershipFilterResetButton,
  selectFilterOption,
  workflowTypeFilter,
} from '../shared/locators/library';
import {
  projectWorkflowsArchiveToggle,
  projectWorkflowsDisciplineFilter,
  projectWorkflowsFavouritesToggle,
  projectWorkflowsFilterToolbar,
  projectWorkflowsOwnershipFilter,
  projectWorkflowsSortControl,
  projectWorkflowsTemplatesToggle,
  projectWorkflowsTypeFilter,
  waitForProjectWorkflowsLoaded,
} from '../e2e/project/project.locators';
import { expectExploreResultsContainOnlyFavouritedCards } from './explore-boolean-filters';
import { expectExploreResultsContainOnlyWorkflowCards } from './explore';
import {
  loadWorkflowManifest,
  type WorkflowEntry,
  type WorkflowManifest,
} from './manifest';

/**
 * FR-PROJ-WF-001 / FR-PROJ-WF-003 — projectWorkflowsFilterToolbar exposes sort, ownership,
 * workflow type, favourites, and archive only.
 * Requirements: tests/docs/requirements/features/project/project_workflows_view_requirements_v1.yaml
 *
 * workflowTypeFilter is always visible on this workflows-only view (FR-PROJ-WF-003).
 * Keyword search is covered under FR-PROJ-WF-004. typeFilter, disciplineFilter, and
 * templatesToggle belong on Explore/Favourites/My library, not project Workflows.
 */
export async function expectProjectWorkflowsFilterToolbarPerFrProjWf001(
  page: Page,
): Promise<void> {
  await expect(projectWorkflowsFilterToolbar(page)).toBeVisible();

  // Controls that belong on other listing pages, not project Workflows.
  await expect.soft(projectWorkflowsTypeFilter(page)).toHaveCount(0);
  await expect.soft(projectWorkflowsDisciplineFilter(page)).toHaveCount(0);
  await expect.soft(projectWorkflowsTemplatesToggle(page)).toHaveCount(0);

  // Required toolbar filters on project Workflows.
  await expect.soft(projectWorkflowsSortControl(page)).toBeVisible();
  await expect.soft(projectWorkflowsOwnershipFilter(page)).toBeVisible();
  await expect.soft(workflowTypeFilter(page)).toBeVisible();
  await expect.soft(projectWorkflowsFavouritesToggle(page)).toBeVisible();
  await expect.soft(projectWorkflowsArchiveToggle(page)).toBeVisible();
}

export {
  expectExploreResultsContainOnlyWorkflowCards as expectProjectWorkflowsResultsContainOnlyWorkflowCards,
};

type ProjectWorkflowSearchResponse = {
  items: Array<{ uuid: string; contentType?: string; content_type?: string }>;
};

function isProjectWorkflowLibrarySearchResponse(response: {
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

function collectProjectWorkflowScopeUuids(manifest: WorkflowManifest): Set<string> {
  return new Set(manifest.workflows.map((workflow) => primaryWorkflowUuid(workflow)));
}

/**
 * FR-PROJ-WF-001 — project Workflows listing is scoped to current project workflows only (API contract).
 */
export async function expectProjectWorkflowListingItemsBelongToCurrentProject(
  page: Page,
  projectUuid: string,
): Promise<void> {
  const manifest = loadWorkflowManifest();
  const projectWorkflowUuids = collectProjectWorkflowScopeUuids(manifest);

  const searchResponse = page.waitForResponse(isProjectWorkflowLibrarySearchResponse);
  await page.reload();
  await expect(page).toHaveURL(new RegExp(`/project/${projectUuid}/workflows/?$`));
  await waitForProjectWorkflowsLoaded(page);

  const response = await searchResponse;
  const requestBody = response.request().postDataJSON() as {
    filters?: { projectUuid?: string; project_uuid?: string };
  };
  const lockedProjectUuid = requestBody.filters?.projectUuid ?? requestBody.filters?.project_uuid;
  expect(lockedProjectUuid).toBe(projectUuid);

  const body = (await response.json()) as ProjectWorkflowSearchResponse;
  for (const item of body.items) {
    const contentType = item.contentType ?? item.content_type;
    expect(contentType).toBe('workflow');
    expect(
      projectWorkflowUuids.has(item.uuid),
      `workflow search item ${item.uuid} is outside current project scope`,
    ).toBe(true);
  }
}

/** FR-PROJ-WF-001 — resultsRegion contains only workflowCard instances (no projectCard). */
export async function expectProjectWorkflowsViewShowsOnlyWorkflowCards(page: Page): Promise<void> {
  await expect(libraryResultsProjectCards(page)).toHaveCount(0);

  const workflowCardCount = await libraryResultsWorkflowCards(page).count();
  if (workflowCardCount === 0) {
    return;
  }

  await expect(libraryCards(page)).toHaveCount(workflowCardCount);
}

/** FR-PROJ-WF-003 — ownershipFilter Owned narrows results and every visible card shows owner attribution. */
export async function expectOwnershipFilterOwnedNarrowsProjectWorkflowsResults(
  page: Page,
): Promise<void> {
  const ownershipFilter = projectWorkflowsOwnershipFilter(page);
  const baselineCount = await libraryCards(page).count();
  expect(baselineCount).toBeGreaterThan(0);

  await selectFilterOption(page, ownershipFilter, 'Owned');
  await expect(ownershipFilter).toHaveText('Owned', { exact: true });
  await expect(ownershipFilterResetButton(page, ownershipFilter)).toBeVisible();
  await waitForProjectWorkflowsLoaded(page);

  const ownedCount = await libraryCards(page).count();
  expect(ownedCount).toBeLessThanOrEqual(baselineCount);
  expect(ownedCount).toBeGreaterThan(0);

  const cards = libraryCards(page);
  for (let i = 0; i < ownedCount; i++) {
    await expect(cardOwnerText(cards.nth(i))).toBeVisible();
  }
}

/** FR-PROJ-WF-003 — favouritesToggle restricts resultsRegion to favourited workflow cards in project scope. */
export async function expectFavouritesToggleNarrowsProjectWorkflowsResults(
  page: Page,
): Promise<boolean> {
  const favouritesToggle = projectWorkflowsFavouritesToggle(page);
  const baselineCount = await libraryCards(page).count();
  expect(baselineCount).toBeGreaterThan(0);

  await favouritesToggle.click();
  await expect(favouritesToggle).toHaveClass(/MuiButton-contained/);
  await waitForProjectWorkflowsLoaded(page);

  const favouritedOnlyCount = await libraryCards(page).count();
  if (favouritedOnlyCount === 0) {
    await favouritesToggle.click();
    await expect(favouritesToggle).not.toHaveClass(/MuiButton-contained/);
    await waitForProjectWorkflowsLoaded(page);
    return false;
  }

  expect(favouritedOnlyCount).toBeLessThanOrEqual(baselineCount);
  await expectExploreResultsContainOnlyFavouritedCards(page);

  await favouritesToggle.click();
  await expect(favouritesToggle).not.toHaveClass(/MuiButton-contained/);
  await waitForProjectWorkflowsLoaded(page);

  const restoredCount = await libraryCards(page).count();
  expect(restoredCount).toBeGreaterThanOrEqual(favouritedOnlyCount);
  return true;
}

/** FR-PROJ-WF-004 — keyword search narrows resultsRegion to matching workflow card titles. */
export async function expectKeywordSearchNarrowsProjectWorkflowsResults(
  page: Page,
  keyword: string,
): Promise<void> {
  const baselineCount = await libraryCards(page).count();
  expect(baselineCount).toBeGreaterThan(0);

  await keywordSearchField(page).fill(keyword);
  await keywordSearchField(page).press('Enter');
  await waitForProjectWorkflowsLoaded(page);

  const narrowedCount = await libraryCards(page).count();
  expect(narrowedCount).toBeGreaterThan(0);
  expect(narrowedCount).toBeLessThanOrEqual(baselineCount);

  const cards = libraryCards(page);
  for (let i = 0; i < narrowedCount; i++) {
    await expect(cardTitleText(cards.nth(i))).toContainText(keyword);
  }
}

export { waitForProjectWorkflowsLoaded };
