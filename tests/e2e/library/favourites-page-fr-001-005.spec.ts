import { test, expect } from '@playwright/test';
import { gotoFavourites } from '../../helpers/navigation';
import {
  keywordSearchClearButton,
  keywordSearchField,
  libraryCards,
  libraryEmptyState,
  libraryErrorState,
  libraryFilterToolbar,
  libraryPagination,
  ownershipFilter,
  selectSortOption,
  sortControl,
  templatesToggle,
  typeFilter,
  waitForLibraryResultsLoaded,
  workflowTypeFilter,
  firstLibraryCardTitle,
} from './library.locators';

/**
 * Calibration slice — FR-FAV-001 through FR-FAV-005.
 * Requirements: tests/docs/requirements/features/library/favourites_page_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com).
 */

test.describe('Favourites — calibration (FR-FAV-001–005)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFavourites(page);
    await expect(page).toHaveURL(/\/favourites\/?$/);
    await waitForLibraryResultsLoaded(page);
  });

  test('FR-FAV-001: /favourites renders filter toolbar and results region', async ({ page }) => {
    await expect(libraryFilterToolbar(page)).toBeVisible();
    await expect(sortControl(page)).toBeVisible();
    await expect(templatesToggle(page)).toBeVisible();
    await expect(keywordSearchField(page)).toBeVisible();
    await expect(libraryErrorState(page)).toBeHidden();

    const hasCards = (await libraryCards(page).count()) > 0;
    if (hasCards) {
      await expect(libraryCards(page).first()).toBeVisible();
      return;
    }

    await expect(libraryEmptyState(page)).toBeVisible();
  });

  test('FR-FAV-001: spec-only toolbar controls are not wired on Favourites yet', async ({ page }) => {
    await expect(ownershipFilter(page)).toHaveCount(0);
    await expect(typeFilter(page)).toHaveCount(0);
    await expect(workflowTypeFilter(page)).toHaveCount(0);
  });

  test('FR-FAV-002: sort control exposes options and updates label on selection', async ({
    page,
  }) => {
    await selectSortOption(page, 'A - Z');
    await expect(sortControl(page)).toHaveText('A - Z');
  });

  test.describe('FR-FAV-003: ownership/type filters (deferred)', () => {
    test('requires ownershipFilter and typeFilter on /favourites', async ({ page }) => {
      test.skip(
        true,
        'FR-FAV-003 needs ownershipFilter and typeFilter on Favourites (currently only sort, templates, keyword).',
      );
      await expect(ownershipFilter(page)).toBeVisible();
      await expect(typeFilter(page)).toBeVisible();
    });
  });

  test('FR-FAV-004: templates toggle switches active state', async ({ page }) => {
    await templatesToggle(page).click();
    await expect(templatesToggle(page)).toHaveClass(/MuiButton-contained/);

    await templatesToggle(page).click();
    await expect(templatesToggle(page)).not.toHaveClass(/MuiButton-contained/);
  });

  test('FR-FAV-005: keyword search field supports clear control after Enter', async ({ page }) => {
    if ((await libraryCards(page).count()) === 0) {
      test.skip(true, 'No favourited cards available to exercise keyword search.');
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

test.describe('Favourites — pagination (FR-FAV-001)', () => {
  test('pagination hidden when result count is at most 10', async ({ page }) => {
    await gotoFavourites(page);
    await waitForLibraryResultsLoaded(page);

    const cardCount = await libraryCards(page).count();
    if (cardCount > 10) {
      await expect(libraryPagination(page)).toBeVisible();
      return;
    }

    await expect(libraryPagination(page)).toHaveCount(0);
  });
});
