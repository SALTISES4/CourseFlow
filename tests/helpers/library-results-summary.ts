import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  installPaginatedLibrarySearchMock,
  LIBRARY_RESULTS_PER_PAGE,
  type LibraryPaginationSurfaceConfig,
} from './library-pagination';
import {
  libraryEmptyState,
  libraryFilterToolbar,
  libraryResultsRegion,
  paginationPageNumberButton,
  RESULTS_SUMMARY_REGEX,
  resultsSummary,
  triggerLibrarySearchAndWait,
} from '../shared/locators/library';

/**
 * FR-LIB-001 resultsSummary copy — "Showing X of XX results" with X as the current range.
 * Single-item pages use "Showing N of T results"; multi-item pages use "Showing S-E of T results".
 */
export function formatResultsSummaryText(
  pageIndex: number,
  totalResults: number,
  resultsPerPage: number = LIBRARY_RESULTS_PER_PAGE,
): string {
  const start = pageIndex * resultsPerPage + 1;
  const end = Math.min(totalResults, (pageIndex + 1) * resultsPerPage);

  if (start === end) {
    return `Showing ${start} of ${totalResults} results`;
  }

  return `Showing ${start}-${end} of ${totalResults} results`;
}

export function parseResultsSummaryText(text: string): {
  rangeStart: number;
  rangeEnd: number;
  total: number;
} | null {
  const match = text.trim().match(RESULTS_SUMMARY_REGEX);
  if (!match) {
    return null;
  }

  const [, rangeStartStr, rangeEndStr, singleStr, totalStr] = match;
  const total = Number(totalStr);
  const rangeStart = singleStr ? Number(singleStr) : Number(rangeStartStr);
  const rangeEnd = singleStr ? Number(singleStr) : Number(rangeEndStr);

  return { rangeStart, rangeEnd, total };
}

export async function expectResultsSummaryText(page: Page, expectedText: string): Promise<void> {
  await expect(resultsSummary(page)).toBeVisible();
  await expect(resultsSummary(page)).toHaveText(expectedText);
}

export async function expectResultsSummaryAccurateForVisibleCards(
  page: Page,
  cards: Locator,
): Promise<void> {
  await expect(resultsSummary(page)).toBeVisible();

  const summaryText = await resultsSummary(page).innerText();
  const parsed = parseResultsSummaryText(summaryText);
  expect(parsed).not.toBeNull();

  const cardCount = await cards.count();
  const { rangeStart, rangeEnd, total } = parsed!;
  const rangeWidth = rangeEnd - rangeStart + 1;

  expect(cardCount).toBe(rangeWidth);
  expect(cardCount).toBeLessThanOrEqual(LIBRARY_RESULTS_PER_PAGE);
  expect(rangeEnd).toBeLessThanOrEqual(total);
  expect(rangeStart).toBeGreaterThanOrEqual(1);
}

export async function expectResultsSummaryHiddenPerFrLib001(page: Page): Promise<void> {
  await expect(resultsSummary(page)).toHaveCount(0);
}

export async function expectResultsSummaryStackingOrderPerFrLib001(page: Page): Promise<void> {
  await expect(libraryFilterToolbar(page)).toBeVisible();
  await expect(resultsSummary(page)).toBeVisible();
  await expect(libraryResultsRegion(page)).toBeVisible();

  const toolbarBox = await libraryFilterToolbar(page).boundingBox();
  const summaryBox = await resultsSummary(page).boundingBox();
  const resultsBox = await libraryResultsRegion(page).boundingBox();

  expect(toolbarBox).not.toBeNull();
  expect(summaryBox).not.toBeNull();
  expect(resultsBox).not.toBeNull();
  expect(toolbarBox!.y).toBeLessThan(summaryBox!.y);
  expect(summaryBox!.y).toBeLessThan(resultsBox!.y);
}

/**
 * Registers the shared FR-LIB-001 resultsSummary suite for a library-style listing surface.
 * Same behavior on My library, Explore, Favourites, and Project Workflows.
 */
export function describeLibraryResultsSummaryTests(config: LibraryPaginationSurfaceConfig): void {
  const { suiteLabel, frRef, gotoListing, waitForLoaded, cards } = config;

  test.describe(`${suiteLabel} — resultsSummary (${frRef})`, () => {
    test('resultsSummary is visible and reflects visible card counts on first land', async ({ page }) => {
      await gotoListing(page);
      await waitForLoaded(page);

      if ((await cards(page).count()) === 0) {
        test.skip(true, 'No cards in seeded listing.');
      }

      await expectResultsSummaryAccurateForVisibleCards(page, cards(page));
    });

    test('resultsSummary is hidden when resultsRegion is empty', async ({ page }) => {
      await installPaginatedLibrarySearchMock(page, { totalResults: 0 });
      await triggerLibrarySearchAndWait(
        page,
        () => gotoListing(page),
        (request) => (request.pagination?.page ?? 0) === 0,
      );

      await expect(libraryEmptyState(page)).toBeVisible();
      await expectResultsSummaryHiddenPerFrLib001(page);
    });

    test.describe('when listing has multiple pages (mocked library search)', () => {
      const totalResults = 15;

      test.beforeEach(async ({ page }) => {
        await installPaginatedLibrarySearchMock(page, { totalResults });
        await triggerLibrarySearchAndWait(
          page,
          () => gotoListing(page),
          (request) => (request.pagination?.page ?? 0) === 0,
        );
      });

      test('resultsSummary shows first-page range on load', async ({ page }) => {
        await expectResultsSummaryText(page, formatResultsSummaryText(0, totalResults));
      });

      test('resultsSummary updates when user selects page 2', async ({ page }) => {
        await triggerLibrarySearchAndWait(
          page,
          () => paginationPageNumberButton(page, 2).click(),
          { pagination: { page: 1 } },
        );
        await expectResultsSummaryText(page, formatResultsSummaryText(1, totalResults));
      });

      test('resultsSummary is between filter toolbar and resultsRegion', async ({ page }) => {
        await expectResultsSummaryStackingOrderPerFrLib001(page);
      });
    });
  });
}
