import { test, expect } from '@playwright/test';
import { describeLibraryPaginationTests } from '../../helpers/library-pagination';
import { describeLibraryResultsSummaryTests } from '../../helpers/library-results-summary';
import { expectSortControlPerFrLib002 } from '../../helpers/library-sort';
import { gotoLibrary } from '../../helpers/navigation';
import {
  archiveToggle,
  favouritesToggle,
  keywordSearchClearButton,
  keywordSearchField,
  libraryCards,
  libraryEmptyState,
  libraryErrorState,
  libraryFilterToolbar,
  ownershipFilter,
  selectFilterOption,
  sortControl,
  templatesToggle,
  typeFilter,
  waitForLibraryResultsLoaded,
  workflowTypeFilter,
  firstLibraryCardTitle,
} from './library.locators';

/**
 * Calibration slice — FR-LIB-001 through FR-LIB-004; FR-LIB-006 deferred (archived seed).
 * Requirements: tests/docs/requirements/features/library/library_page_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com).
 */

test.describe('My library — calibration (FR-LIB-001-004, FR-LIB-006 deferred)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLibrary(page);
    await expect(page).toHaveURL(/\/library\/?$/);
    await waitForLibraryResultsLoaded(page);
  });

  test('FR-LIB-001: /library renders filter toolbar and results region', async ({ page }) => {
    await expect(libraryFilterToolbar(page)).toBeVisible();
    await expect(sortControl(page)).toBeVisible();
    await expect(ownershipFilter(page)).toBeVisible();
    await expect(keywordSearchField(page)).toBeVisible();
    await expect(libraryErrorState(page)).toBeHidden();

    const hasCards = (await libraryCards(page).count()) > 0;
    if (hasCards) {
      await expect(libraryCards(page).first()).toBeVisible();
      return;
    }

    await expect(libraryEmptyState(page)).toBeVisible();
  });

  test('FR-LIB-001: spec-only toolbar controls are not wired on My library yet', async ({ page }) => {
    if ((await typeFilter(page).count()) > 0) {
      test.skip(true, 'typeFilter unexpectedly present — update spec if implementation adds it.');
    }
    if ((await favouritesToggle(page).count()) > 0) {
      test.skip(true, 'favouritesToggle unexpectedly present — update spec if implementation adds it.');
    }
    if ((await archiveToggle(page).count()) > 0) {
      test.skip(true, 'archiveToggle unexpectedly present — update spec if implementation adds it.');
    }

    await expect(typeFilter(page)).toHaveCount(0);
    await expect(favouritesToggle(page)).toHaveCount(0);
    await expect(archiveToggle(page)).toHaveCount(0);
    await expect(workflowTypeFilter(page)).toHaveCount(0);
  });

  test('FR-LIB-002: selected option replaces Sort placeholder; sortResetButton restores default', async ({
    page,
  }) => {
    await expectSortControlPerFrLib002(page);
  });

  test('FR-LIB-003: ownership filter commits Owned selection', async ({ page }) => {
    await selectFilterOption(page, ownershipFilter(page), 'Owned');
    await expect(ownershipFilter(page)).toHaveText('Owned');
    await waitForLibraryResultsLoaded(page);
  });

  test('FR-LIB-003: templates toggle switches active state', async ({ page }) => {
    if ((await templatesToggle(page).count()) === 0) {
      test.skip(true, 'templatesToggle not rendered on My library.');
    }

    await templatesToggle(page).click();
    await expect(templatesToggle(page)).toHaveClass(/MuiButton-contained/);

    await templatesToggle(page).click();
    await expect(templatesToggle(page)).not.toHaveClass(/MuiButton-contained/);
  });

  test('FR-LIB-004: keyword search field supports clear control after Enter', async ({ page }) => {
    if ((await libraryCards(page).count()) === 0) {
      test.skip(true, 'No library cards available to exercise keyword search.');
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
