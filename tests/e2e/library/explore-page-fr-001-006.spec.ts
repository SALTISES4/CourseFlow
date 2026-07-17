import { test, expect } from '@playwright/test';
import {
  expectDisciplineFilterCatalogue,
  expectDisciplineFilterAllSelectsOnlyVisibleRows,
  expectDisciplineFilterOrResultsInRegion,
  expectDisciplineFilterPopoverShell,
  expectDisciplineFilterReadOnlyZeroResultRow,
  expectDisciplineFilterSearchNarrowsChecklist,
  expectDisciplineFilterSelectionIndicatorBehaviour,
} from '../../helpers/explore-discipline';
import { DISCIPLINE_CATALOGUE_AZ } from '../../helpers/discipline-catalogue';
import {
  expectExploreFilterToolbarPerFrExp001,
  expectExploreResultsContainOnlyProjectCards,
  expectExploreResultsContainOnlyWorkflowCards,
} from '../../helpers/explore';
import {
  expectTypeFilterResetPerFrLib003,
  expectWorkflowTypeFilterOrResultsInRegion,
  expectWorkflowTypeFilterPopoverShell,
  expectWorkflowTypeFilterSelectionIndicatorBehaviour,
  expectWorkflowTypeFilterSingleSelectionNarrowsResults,
} from '../../helpers/explore-type-filter';
import { WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003 } from '../../shared/locators/library';
import {
  expectExploreResultsContainOnlyFavouritedCards,
  expectExploreResultsContainOnlyTemplateCards,
} from '../../helpers/explore-boolean-filters';
import { expectSortControlPerFrLib002 } from '../../helpers/library-sort';
import { describeLibraryPaginationTests } from '../../helpers/library-pagination';
import { describeLibraryResultsSummaryTests } from '../../helpers/library-results-summary';
import { E2E_FIXTURE_TEMPLATE_WORKFLOW_TITLES } from '../../shared/locators/cards';
import { gotoExplore } from '../../helpers/navigation';
import {
  favouritesToggle,
  keywordSearchClearButton,
  keywordSearchField,
  libraryCards,
  libraryWorkflowCardByTitle,
  exploreEmptyState,
  exploreErrorState,
  expectExploreErrorStateInResultsRegion,
  libraryEmptyState,
  libraryLoadingSkeletons,
  libraryPagination,
  selectFilterOption,
  templatesToggle,
  typeFilter,
  waitForLibraryResultsLoaded,
  workflowTypeFilter,
  firstLibraryCardTitle,
  disciplineFilterNoneOption,
  disciplineFilterSelectionIndicator,
  openDisciplineFilterPopover,
  closeDisciplineFilterPopover,
  disciplineFilterCheckboxOption,
} from './library.locators';

/**
 * Calibration slice — FR-EXP-001 through FR-EXP-006.
 * Requirements: tests/docs/requirements/features/library/explore_page_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com).
 */

test.describe('Explore — calibration (FR-EXP-001-006)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoExplore(page);
    await expect(page).toHaveURL(/\/explore\/?$/);
    await waitForLibraryResultsLoaded(page);
  });

  test('FR-EXP-001: /explore filter toolbar has only spec controls; results region renders', async ({
    page,
  }) => {
    await expectExploreFilterToolbarPerFrExp001(page);
    await expect(exploreErrorState(page)).toBeHidden();

    const hasCards = (await libraryCards(page).count()) > 0;
    if (hasCards) {
      await expect(libraryCards(page).first()).toBeVisible();
      return;
    }

    await expect(libraryEmptyState(page)).toBeVisible();
  });

  test('FR-EXP-001: zero matching keyword search shows exploreEmptyState in resultsRegion', async ({
    page,
  }) => {
    if ((await libraryCards(page).count()) === 0) {
      test.skip(true, 'Explore has no baseline cards — cannot exercise zero-match keyword search.');
    }

    const impossibleKeyword = `__no_explore_match_${Date.now()}__`;
    await keywordSearchField(page).fill(impossibleKeyword);
    await keywordSearchField(page).press('Enter');
    await waitForLibraryResultsLoaded(page);

    await expect(exploreEmptyState(page)).toBeVisible();
    await expect(libraryCards(page)).toHaveCount(0);
    await expect(exploreErrorState(page)).toBeHidden();
  });

  test('FR-EXP-001: failed library search shows exploreErrorState in resultsRegion', async ({
    page,
  }) => {
    await page.route('**/api/library/search', (route) => {
      void route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'E2E simulated explore library search failure' }),
      });
    });

    await page.reload();
    await expect(page).toHaveURL(/\/explore\/?$/);
    await expect(libraryLoadingSkeletons(page)).toHaveCount(0, { timeout: 15_000 });
    await expectExploreErrorStateInResultsRegion(page);
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

  test('FR-EXP-002: selected option replaces Sort placeholder; sortResetButton restores default', async ({
    page,
  }) => {
    await expectSortControlPerFrLib002(page);
  });

  test.describe('FR-EXP-003: discipline filter', () => {
    test('popover exposes disciplineFilterSearchField, All, and None', async ({ page }) => {
      await expectDisciplineFilterPopoverShell(page);
    });

    test('checklist matches fixed discipline catalogue A–Z', async ({ page }) => {
      await expectDisciplineFilterCatalogue(page);
    });

    test('disciplineFilterSearchField narrows visible checklist rows', async ({ page }) => {
      await expectDisciplineFilterSearchNarrowsChecklist(page);
    });

    test('disciplineFilterSelectionIndicator shows count after All and hides after None', async ({
      page,
    }) => {
      await expectDisciplineFilterSelectionIndicatorBehaviour(page);
    });

    test.skip('All selects only visible disciplines after search narrowing', async ({ page }) => {
      await expectDisciplineFilterAllSelectsOnlyVisibleRows(page);
    });

    test.skip('read-only discipline row with zero matching results cannot be selected', async ({
      page,
    }) => {
      await expectDisciplineFilterReadOnlyZeroResultRow(page);
    });

    test.skip('selecting two disciplines OR-matches results in resultsRegion', async ({ page }) => {
      await expectDisciplineFilterOrResultsInRegion(
        page,
        DISCIPLINE_CATALOGUE_AZ[0]!,
        DISCIPLINE_CATALOGUE_AZ[1]!,
      );
    });

    test.skip('resultsRegion reflects discipline-constrained result set', async ({ page }) => {
      await openDisciplineFilterPopover(page);
      await disciplineFilterCheckboxOption(page, DISCIPLINE_CATALOGUE_AZ[0]!).click();
      await closeDisciplineFilterPopover(page);
      await waitForLibraryResultsLoaded(page);

      await expect(disciplineFilterSelectionIndicator(page)).toHaveText('1');
      await expect(libraryCards(page).first()).toBeVisible();
    });

    test.skip('discipline filter combines subtractively with other active toolbar filters', async ({
      page,
    }) => {
      await selectFilterOption(page, typeFilter(page), 'Projects');
      await openDisciplineFilterPopover(page);
      await disciplineFilterCheckboxOption(page, DISCIPLINE_CATALOGUE_AZ[0]!).click();
      await closeDisciplineFilterPopover(page);
      await waitForLibraryResultsLoaded(page);

      await expect(typeFilter(page)).toHaveText('Projects');
      await expect(disciplineFilterSelectionIndicator(page)).toHaveText('1');
    });

    test.skip('None clears discipline constraint and restores unconstrained resultsRegion', async ({
      page,
    }) => {
      const baselineCount = await libraryCards(page).count();

      await openDisciplineFilterPopover(page);
      await disciplineFilterCheckboxOption(page, DISCIPLINE_CATALOGUE_AZ[0]!).click();
      await closeDisciplineFilterPopover(page);
      await waitForLibraryResultsLoaded(page);

      await openDisciplineFilterPopover(page);
      await disciplineFilterNoneOption(page).click();
      await closeDisciplineFilterPopover(page);
      await waitForLibraryResultsLoaded(page);

      await expect(disciplineFilterSelectionIndicator(page)).toHaveCount(0);
      await expect(libraryCards(page)).toHaveCount(baselineCount);
    });

    test.skip('changing discipline selection resets listing to first results page', async ({
      page,
    }) => {
      // Needs explore fixture with enough published results to paginate (11+).
      await openDisciplineFilterPopover(page);
      await disciplineFilterCheckboxOption(page, DISCIPLINE_CATALOGUE_AZ[0]!).click();
      await closeDisciplineFilterPopover(page);
      await waitForLibraryResultsLoaded(page);

      await expect(libraryPagination(page)).toBeVisible();
    });
  });

  test.describe('FR-EXP-004: type filter and workflow type filter', () => {
    test('typeFilter commits Projects and resultsRegion shows only project cards', async ({
      page,
    }) => {
      await selectFilterOption(page, typeFilter(page), 'Projects');
      await expect(typeFilter(page)).toHaveText('Projects');
      await expect(workflowTypeFilter(page)).toHaveCount(0);
      await waitForLibraryResultsLoaded(page);
      await expectExploreResultsContainOnlyProjectCards(page);
    });

    test('typeFilter commits Workflows and resultsRegion shows only workflow cards', async ({
      page,
    }) => {
      await selectFilterOption(page, typeFilter(page), 'Workflows');
      await expect(typeFilter(page)).toHaveText('Workflows');
      await expect(workflowTypeFilter(page)).toBeVisible();
      await waitForLibraryResultsLoaded(page);
      await expectExploreResultsContainOnlyWorkflowCards(page);
    });

    test('Type filter - options and behaviour', async ({
      page,
    }) => {
      await expectTypeFilterResetPerFrLib003(page);
    });

    test('Workflow type filter popover is multiselect with Activity, Course, and Program options', async ({
      page,
    }) => {
      await expect(workflowTypeFilter(page)).toBeVisible();
      await expectWorkflowTypeFilterPopoverShell(page);
    });

    test('workflowTypeFilterSelectionIndicator shows selected count and hides when unset', async ({
      page,
    }) => {
      await expect(workflowTypeFilter(page)).toBeVisible();
      await expectWorkflowTypeFilterSelectionIndicatorBehaviour(page);
    });

    test('selecting one workflow type narrows workflow results to that cardTypeChip', async ({
      page,
    }) => {
      await expectWorkflowTypeFilterSingleSelectionNarrowsResults(
        page,
        WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003[0]!,
      );
    });

    test('selecting two workflow types OR-matches workflow results in resultsRegion', async ({
      page,
    }) => {
      await expectWorkflowTypeFilterOrResultsInRegion(
        page,
        WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003[0]!,
        WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003[1]!,
      );
    });
  });

  test.describe('FR-EXP-005: templates and favourites toggles', () => {
    test('favouritesToggle restricts resultsRegion to favourited cards only', async ({ page }) => {
      const baselineCount = await libraryCards(page).count();

      await favouritesToggle(page).click();
      await expect(favouritesToggle(page)).toHaveClass(/MuiButton-contained/);
      await waitForLibraryResultsLoaded(page);

      const favouritedOnlyCount = await libraryCards(page).count();
      if (favouritedOnlyCount === 0) {
        test.skip(
          true,
          'No favourited published cards on Explore after favouritesToggle — re-run e2e seed.',
        );
      }

      expect(favouritedOnlyCount).toBeLessThanOrEqual(baselineCount);
      await expectExploreResultsContainOnlyFavouritedCards(page);

      await favouritesToggle(page).click();
      await expect(favouritesToggle(page)).not.toHaveClass(/MuiButton-contained/);
      await waitForLibraryResultsLoaded(page);

      const restoredCount = await libraryCards(page).count();
      expect(restoredCount).toBeGreaterThanOrEqual(favouritedOnlyCount);
    });

    test('templatesToggle restricts resultsRegion to template cards only', async ({ page }) => {
      const baselineCount = await libraryCards(page).count();

      await templatesToggle(page).click();
      await expect(templatesToggle(page)).toHaveClass(/MuiButton-contained/);
      await waitForLibraryResultsLoaded(page);

      const templateOnlyCount = await libraryCards(page).count();
      if (templateOnlyCount === 0) {
        test.skip(
          true,
          'No published template cards on Explore after templatesToggle — re-run e2e seed.',
        );
      }

      expect(templateOnlyCount).toBeLessThanOrEqual(baselineCount);
      await expectExploreResultsContainOnlyTemplateCards(page);

      const seededTemplateVisible = await Promise.all(
        E2E_FIXTURE_TEMPLATE_WORKFLOW_TITLES.map((title) =>
          libraryWorkflowCardByTitle(page, title).count(),
        ),
      );
      expect(seededTemplateVisible.some((count) => count > 0)).toBe(true);

      await templatesToggle(page).click();
      await expect(templatesToggle(page)).not.toHaveClass(/MuiButton-contained/);
      await waitForLibraryResultsLoaded(page);

      const restoredCount = await libraryCards(page).count();
      expect(restoredCount).toBeGreaterThanOrEqual(templateOnlyCount);
    });
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

describeLibraryPaginationTests({
  suiteLabel: 'Explore',
  frRef: 'FR-EXP-001',
  gotoListing: gotoExplore,
  waitForLoaded: waitForLibraryResultsLoaded,
  cards: libraryCards,
});

describeLibraryResultsSummaryTests({
  suiteLabel: 'Explore',
  frRef: 'FR-EXP-001',
  gotoListing: gotoExplore,
  waitForLoaded: waitForLibraryResultsLoaded,
  cards: libraryCards,
});
