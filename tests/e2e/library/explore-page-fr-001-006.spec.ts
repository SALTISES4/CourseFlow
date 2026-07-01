import { test, expect } from '@playwright/test';
import { gotoExplore } from '../../helpers/navigation';
import {
  DISCIPLINE_SEARCH_LABEL,
  disciplineFilter,
  favouritesToggle,
  keywordSearchClearButton,
  keywordSearchField,
  libraryCards,
  libraryEmptyState,
  libraryErrorState,
  libraryFilterToolbar,
  libraryPagination,
  selectFilterOption,
  selectSortOption,
  sortControl,
  templatesToggle,
  typeFilter,
  waitForLibraryResultsLoaded,
  workflowTypeFilter,
  firstLibraryCardTitle,
} from './library.locators';

/**
 * Calibration slice — FR-EXP-001 through FR-EXP-006.
 * Requirements: tests/docs/requirements/features/library/explore_page_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com).
 */

test.describe('Explore — calibration (FR-EXP-001–006)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoExplore(page);
    await expect(page).toHaveURL(/\/explore\/?$/);
    await waitForLibraryResultsLoaded(page);
  });

  test('FR-EXP-001: /explore renders filter toolbar and results region', async ({ page }) => {
    await expect(libraryFilterToolbar(page)).toBeVisible();
    await expect(sortControl(page)).toBeVisible();
    await expect(disciplineFilter(page)).toBeVisible();
    await expect(typeFilter(page)).toBeVisible();
    await expect(favouritesToggle(page)).toBeVisible();
    await expect(keywordSearchField(page)).toBeVisible();
    await expect(libraryErrorState(page)).toBeHidden();

    const hasCards = (await libraryCards(page).count()) > 0;
    if (hasCards) {
      await expect(libraryCards(page).first()).toBeVisible();
      return;
    }

    await expect(libraryEmptyState(page)).toBeVisible();
  });

  test('FR-EXP-001: workflow type filter visible when type scope includes workflows', async ({
    page,
  }) => {
    await selectFilterOption(page, typeFilter(page), 'Workflows');
    await expect(workflowTypeFilter(page)).toBeVisible();
  });

  test('FR-EXP-001: workflow type filter hidden when type is Projects only', async ({ page }) => {
    await selectFilterOption(page, typeFilter(page), 'Projects');
    await expect(workflowTypeFilter(page)).toHaveCount(0);
  });

  test('FR-EXP-002: sort control exposes options and updates label on selection', async ({
    page,
  }) => {
    await selectSortOption(page, 'Creation date');
    await expect(sortControl(page)).toHaveText('Creation date');
  });

  test('FR-EXP-003: discipline filter opens with search field and All/None actions', async ({
    page,
  }) => {
    await disciplineFilter(page).click();
    await expect(page.getByLabel(DISCIPLINE_SEARCH_LABEL)).toBeVisible();
    await expect(page.getByRole('button', { name: 'None', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('FR-EXP-004: type filter commits Projects and refreshes results', async ({ page }) => {
    await selectFilterOption(page, typeFilter(page), 'Projects');
    await expect(typeFilter(page)).toHaveText('Projects');
    await waitForLibraryResultsLoaded(page);
  });

  test('FR-EXP-005: favourites toggle switches active state', async ({ page }) => {
    await favouritesToggle(page).click();
    await expect(favouritesToggle(page)).toHaveClass(/MuiButton-contained/);

    await favouritesToggle(page).click();
    await expect(favouritesToggle(page)).not.toHaveClass(/MuiButton-contained/);
  });

  test('FR-EXP-005: templates toggle is not on Explore yet', async ({ page }) => {
    await expect(templatesToggle(page)).toHaveCount(0);
  });

  test('FR-EXP-006: keyword search field supports clear control after Enter', async ({ page }) => {
    if ((await libraryCards(page).count()) === 0) {
      test.skip(true, 'No explore cards available to exercise keyword search.');
    }

    const title = (await firstLibraryCardTitle(page).innerText()).trim();
    const keyword = title.slice(0, Math.min(8, title.length));
    if (!keyword) {
      test.skip(true, 'First card has no title text for keyword search.');
    }

    await keywordSearchField(page).fill(keyword);
    await keywordSearchField(page).press('Enter');
    await waitForLibraryResultsLoaded(page);

    await expect(keywordSearchClearButton(page)).toBeVisible();
    await keywordSearchClearButton(page).click();
    await expect(keywordSearchField(page)).toHaveValue('');
  });
});

test.describe('Explore — pagination (FR-EXP-001)', () => {
  test('pagination hidden when result count is at most 10', async ({ page }) => {
    await gotoExplore(page);
    await waitForLibraryResultsLoaded(page);

    const cardCount = await libraryCards(page).count();
    if (cardCount > 10) {
      await expect(libraryPagination(page)).toBeVisible();
      return;
    }

    await expect(libraryPagination(page)).toHaveCount(0);
  });
});
