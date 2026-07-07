import { expect, type Page } from '@playwright/test';

import {
  archiveToggle,
  disciplineFilter,
  favouritesToggle,
  keywordSearchField,
  libraryCards,
  libraryFilterToolbar,
  libraryResultsProjectCards,
  libraryResultsWorkflowCards,
  ownershipFilter,
  sortControl,
  templatesToggle,
  typeFilter,
  workflowTypeFilter,
} from '../e2e/library/library.locators';

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
