import { test, expect } from '@playwright/test';
import { describeLibraryPaginationTests } from '../../helpers/library-pagination';
import { describeLibraryResultsSummaryTests } from '../../helpers/library-results-summary';
import {
  ensureMyLibraryResultsHaveCards,
  expectFavouritesToggleNarrowsMyLibraryResults,
  expectKeywordSearchNarrowsMyLibraryResults,
  expectLibraryFilterToolbarPerFrLib001,
  expectMyLibraryListingItemsAreInMembershipScope,
  expectMyLibraryResultsContainOnlyProjectCards,
  expectMyLibraryResultsContainOnlyWorkflowCards,
  expectOwnershipFilterOwnedNarrowsMyLibraryResults,
} from '../../helpers/library-page';
import { expectSortControlPerFrLib002 } from '../../helpers/library-sort';
import { expectOwnershipFilterCommittedStatePerFrLib003 } from '../../helpers/library-ownership-filter';
import {
  expectWorkflowTypeFilterHiddenWhenTypeIsProjects,
  expectWorkflowTypeFilterVisibleWhenTypeIsUnset,
  expectWorkflowTypeFilterVisibleWhenTypeIsWorkflows,
} from '../../helpers/library-type-filter';
import { expectWorkflowTypeFilterSingleSelectionNarrowsResults } from '../../helpers/explore-type-filter';
import { gotoLibrary } from '../../helpers/navigation';
import { WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003 } from '../../shared/locators/library';
import {
  archiveToggle,
  keywordSearchClearButton,
  keywordSearchField,
  libraryCards,
  libraryEmptyState,
  libraryErrorState,
  libraryResultsProjectCards,
  libraryResultsWorkflowCards,
  selectFilterOption,
  typeFilter,
  triggerLibrarySearchAndWait,
  waitForLibraryResultsLoaded,
  workflowTypeFilter,
  firstLibraryCardTitle,
} from './library.locators';

/**
 * Calibration slice — FR-LIB-001 through FR-LIB-004; FR-LIB-006 deferred (archived seed).
 * Requirements: tests/docs/requirements/features/library/library_page_requirements_v1.yaml
 * Auth: chromium project storage state (teacher@courseflow.com).
 */

test.describe('My library — calibration (FR-LIB-001-004, FR-LIB-006 deferred)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLibrary(page);
    await expect(page).toHaveURL(/\/library\/?$/);
    await waitForLibraryResultsLoaded(page);
  });

  test('FR-LIB-001: /library renders filter toolbar and results region', async ({ page }) => {
    await expectLibraryFilterToolbarPerFrLib001(page);
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

  test.describe('FR-LIB-001: membership scope', () => {
    test('my library returns only items in membership scope', async ({ page }) => {
      await expectMyLibraryListingItemsAreInMembershipScope(page);
    });
  });

  test('FR-LIB-002: selected option replaces Sort placeholder; sortResetButton restores default', async ({
    page,
  }) => {
    await expectSortControlPerFrLib002(page);
  });

  test.describe('FR-LIB-003: workflow type filter visibility', () => {
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

  test.describe('FR-LIB-003: filter results', () => {
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
      await expectMyLibraryResultsContainOnlyProjectCards(page);

      if ((await libraryCards(page).count()) === 0) {
        test.skip(true, 'No in-scope project cards in seed.');
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
      await expectMyLibraryResultsContainOnlyWorkflowCards(page);

      if ((await libraryCards(page).count()) === 0) {
        test.skip(true, 'No in-scope workflow cards in seed.');
      }
    });

    test('ownershipFilter Owned narrows results to owned in-scope cards', async ({ page }) => {
      if (!(await ensureMyLibraryResultsHaveCards(page))) {
        test.skip(true, 'No in-scope cards in seed.');
      }

      await expectOwnershipFilterOwnedNarrowsMyLibraryResults(page);
    });

    test('favouritesToggle restricts resultsRegion to favourited in-scope cards', async ({
      page,
    }) => {
      if (!(await ensureMyLibraryResultsHaveCards(page))) {
        test.skip(true, 'No in-scope cards in seed.');
      }

      await expectFavouritesToggleNarrowsMyLibraryResults(page);
    });

    test('selecting one workflow type narrows workflow results to that cardTypeChip', async ({
      page,
    }) => {
      if (!(await ensureMyLibraryResultsHaveCards(page))) {
        test.skip(true, 'No in-scope cards in seed.');
      }

      await expectWorkflowTypeFilterSingleSelectionNarrowsResults(
        page,
        WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003[0]!,
      );
    });
  });

  test('FR-LIB-004: keyword search narrows results and clear control resets field', async ({
    page,
  }) => {
    if ((await libraryCards(page).count()) === 0) {
      test.skip(true, 'No library cards available to exercise keyword search.');
    }

    const title = (await firstLibraryCardTitle(page).innerText()).trim();
    const keyword = title.slice(0, Math.min(8, title.length));
    if (!keyword) {
      test.skip(true, 'First card has no title text for keyword search.');
    }

    await expectKeywordSearchNarrowsMyLibraryResults(page, keyword);

    await expect(keywordSearchClearButton(page)).toBeVisible();
    await keywordSearchClearButton(page).click();
    await expect(keywordSearchField(page)).toHaveValue('');
  });

  test.describe('FR-LIB-006: archived restore/delete (deferred)', () => {
    test('requires archived seed data and archiveToggle on My library', async ({ page }) => {
      test.skip(
        true,
        'FR-LIB-006 needs e2e seed with archived projects/workflows and archiveToggle wired on /library.',
      );
      await expect(archiveToggle(page)).toBeVisible();
    });
  });
});

describeLibraryPaginationTests({
  suiteLabel: 'My library',
  frRef: 'FR-LIB-001',
  gotoListing: gotoLibrary,
  waitForLoaded: waitForLibraryResultsLoaded,
  cards: libraryCards,
});

describeLibraryResultsSummaryTests({
  suiteLabel: 'My library',
  frRef: 'FR-LIB-001',
  gotoListing: gotoLibrary,
  waitForLoaded: waitForLibraryResultsLoaded,
  cards: libraryCards,
});
