import { test, expect } from '@playwright/test';
import { describeLibraryPaginationTests } from '../../helpers/library-pagination';
import { describeLibraryResultsSummaryTests } from '../../helpers/library-results-summary';
import {
  expectFavouritesFilterToolbarPerFrFav001,
  expectFavouritesListingItemsAreFavourited,
  expectFavouritesResultsContainOnlyProjectCards,
  expectFavouritesResultsContainOnlyWorkflowCards,
  ensureFavouritesResultsHaveCards,
  expectKeywordSearchNarrowsFavouritesResults,
  expectOwnershipFilterOwnedNarrowsFavouritesResults,
  expectTemplatesToggleNarrowsFavouritesResults,
  expectUnfavouritingRemovesCardFromFavouritesListing,
  expectWorkflowTypeFilterHiddenWhenTypeIsProjects,
  expectWorkflowTypeFilterVisibleWhenTypeIsUnset,
  expectWorkflowTypeFilterVisibleWhenTypeIsWorkflows,
  restoreFavouritedCardByTitle,
} from '../../helpers/favourites';
import { expectSortControlPerFrLib002 } from '../../helpers/library-sort';
import { expectOwnershipFilterCommittedStatePerFrLib003 } from '../../helpers/library-ownership-filter';
import {
  expectWorkflowTypeFilterSingleSelectionNarrowsResults,
} from '../../helpers/explore-type-filter';
import { gotoFavourites } from '../../helpers/navigation';
import { WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003 } from '../../shared/locators/library';
import { cardTitleText } from '../../shared/locators/cards';
import {
  keywordSearchClearButton,
  keywordSearchField,
  libraryCards,
  libraryEmptyState,
  libraryErrorState,
  libraryResultsProjectCards,
  libraryResultsWorkflowCards,
  selectFilterOption,
  templatesToggle,
  typeFilter,
  triggerLibrarySearchAndWait,
  waitForLibraryResultsLoaded,
  workflowTypeFilter,
  firstLibraryCardTitle,
} from './library.locators';

/**
 * Calibration slice — FR-FAV-001 through FR-FAV-005.
 * Requirements: tests/docs/requirements/features/library/favourites_page_requirements_v1.yaml
 * Auth: chromium project storage state (teacher@courseflow.com).
 */

test.describe('Favourites — calibration (FR-FAV-001-005)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFavourites(page);
    await expect(page).toHaveURL(/\/favourites\/?$/);
    await waitForLibraryResultsLoaded(page);
  });

  test('FR-FAV-001: /favourites renders filter toolbar and results region', async ({ page }) => {
    await expectFavouritesFilterToolbarPerFrFav001(page);
    await expect(typeFilter(page)).toHaveText('Projects');
    await expect(workflowTypeFilter(page)).toHaveCount(0);
    await expect(libraryErrorState(page)).toBeHidden();

    const hasCards = (await libraryCards(page).count()) > 0;
    if (hasCards) {
      await expect(libraryResultsProjectCards(page)).toHaveCount(await libraryCards(page).count());
      await expect(libraryResultsWorkflowCards(page)).toHaveCount(0);
      return;
    }

    await expect(libraryEmptyState(page)).toBeVisible();
  });

  test.describe('FR-FAV-001: favourited-only listing', () => {
    test('favourites page returns only items with isFavorite true', async ({ page }) => {
      await expectFavouritesListingItemsAreFavourited(page);
    });

    test.describe.configure({ mode: 'serial' });

    test('unfavouriting a card removes it from favourites listing', async ({ page }) => {
      if (!(await ensureFavouritesResultsHaveCards(page))) {
        test.skip(true, 'No favourited cards in seed — re-run e2e seed.');
      }

      const card = libraryCards(page).first();
      const title = (await cardTitleText(card).innerText()).trim();
      if (!title) {
        test.skip(true, 'First favourited card has no title text.');
      }

      try {
        await expectUnfavouritingRemovesCardFromFavouritesListing(page, card, title);
      } finally {
        await restoreFavouritedCardByTitle(page, title);
      }
    });
  });

  test('FR-FAV-002: selected option replaces Sort placeholder; sortResetButton restores default', async ({
    page,
  }) => {
    await expectSortControlPerFrLib002(page);
  });

  test.describe('FR-FAV-003: workflow type filter visibility (FR-LIB-003)', () => {
    test('workflowTypeFilter is visible when typeFilter is committed to Workflows', async ({
      page,
    }) => {
      await expectWorkflowTypeFilterVisibleWhenTypeIsWorkflows(page);
    });

    test('workflowTypeFilter is visible when typeFilter is Unset (both types in scope)', async ({
      page,
    }) => {
      await expectWorkflowTypeFilterVisibleWhenTypeIsUnset(page);
    });

    test('workflowTypeFilter is hidden when typeFilter is committed to Projects only', async ({
      page,
    }) => {
      await expectWorkflowTypeFilterHiddenWhenTypeIsProjects(page);
    });
  });

  test.describe('FR-FAV-003: filter results', () => {
    test('ownershipFilter committed option replaces Ownership and shows ownershipFilterResetButton', async ({
      page,
    }) => {
      await expectOwnershipFilterCommittedStatePerFrLib003(page);
    });

    test('typeFilter commits Projects and resultsRegion shows only project cards', async ({
      page,
    }) => {
      await triggerLibrarySearchAndWait(
        page,
        () => selectFilterOption(page, typeFilter(page), 'Projects'),
        { filters: { contentType: 'project' } },
      );
      await expect(typeFilter(page)).toHaveText('Projects');
      await expectFavouritesResultsContainOnlyProjectCards(page);

      if ((await libraryCards(page).count()) === 0) {
        test.skip(true, 'No favourited project cards in seed.');
      }
    });

    test('typeFilter commits Workflows and resultsRegion shows only workflow cards', async ({
      page,
    }) => {
      await triggerLibrarySearchAndWait(
        page,
        () => selectFilterOption(page, typeFilter(page), 'Workflows'),
        { filters: { contentType: 'workflow' } },
      );
      await expect(typeFilter(page)).toHaveText('Workflows');
      await expectFavouritesResultsContainOnlyWorkflowCards(page);

      if ((await libraryCards(page).count()) === 0) {
        test.skip(true, 'No favourited workflow cards in seed — re-run e2e seed.');
      }
    });

    test('ownershipFilter Owned narrows results to owned favourited cards', async ({ page }) => {
      if (!(await ensureFavouritesResultsHaveCards(page))) {
        test.skip(true, 'No favourited cards in seed.');
      }

      await expectOwnershipFilterOwnedNarrowsFavouritesResults(page);
    });

    test('selecting one workflow type narrows workflow results to that cardTypeChip', async ({
      page,
    }) => {
      if (!(await ensureFavouritesResultsHaveCards(page))) {
        test.skip(true, 'No favourited cards in seed.');
      }

      await expectWorkflowTypeFilterSingleSelectionNarrowsResults(
        page,
        WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003[0]!,
      );
    });
  });

  test.describe('FR-FAV-004: templates toggle', () => {
    test('templates toggle switches active state', async ({ page }) => {
      await templatesToggle(page).click();
      await expect(templatesToggle(page)).toHaveClass(/MuiButton-contained/);

      await templatesToggle(page).click();
      await expect(templatesToggle(page)).not.toHaveClass(/MuiButton-contained/);
    });

    test('templatesToggle restricts resultsRegion to template cards only', async ({ page }) => {
      if (!(await ensureFavouritesResultsHaveCards(page))) {
        test.skip(true, 'No favourited cards in seed.');
      }

      await expectTemplatesToggleNarrowsFavouritesResults(page);
    });
  });

  test('FR-FAV-005: keyword search narrows results and clear control resets field', async ({
    page,
  }) => {
    if (!(await ensureFavouritesResultsHaveCards(page))) {
      test.skip(true, 'No favourited cards available to exercise keyword search.');
    }

    const title = (await firstLibraryCardTitle(page).innerText()).trim();
    const keyword = title.slice(0, Math.min(8, title.length));
    if (!keyword) {
      test.skip(true, 'First card has no title text for keyword search.');
    }

    await expectKeywordSearchNarrowsFavouritesResults(page, keyword);

    await expect(keywordSearchClearButton(page)).toBeVisible();
    await keywordSearchClearButton(page).click();
    await expect(keywordSearchField(page)).toHaveValue('');
  });
});

describeLibraryPaginationTests({
  suiteLabel: 'Favourites',
  frRef: 'FR-FAV-001',
  gotoListing: gotoFavourites,
  waitForLoaded: waitForLibraryResultsLoaded,
  cards: libraryCards,
});

describeLibraryResultsSummaryTests({
  suiteLabel: 'Favourites',
  frRef: 'FR-FAV-001',
  gotoListing: gotoFavourites,
  waitForLoaded: waitForLibraryResultsLoaded,
  cards: libraryCards,
});
