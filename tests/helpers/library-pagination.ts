import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  firstLibraryCardTitle,
  expectLibraryCardTitles,
  libraryCardTitles,
  LIBRARY_LISTING_RESULTS_PER_PAGE,
  libraryPagination,
  paginationFirstButton,
  paginationLastButton,
  paginationNextButton,
  paginationPageNumberButton,
  paginationPreviousButton,
  triggerLibrarySearchAndWait,
} from '../shared/locators/library';

/** FR-LIB-001 — backend and UI contract: 10 cards per page. */
export const LIBRARY_RESULTS_PER_PAGE = LIBRARY_LISTING_RESULTS_PER_PAGE;

/** Mock card title prefix — deterministic across paginated library-search mocks. */
export const PAGINATED_LIBRARY_MOCK_TITLE_PREFIX = 'E2E Paginated';

export type LibraryPaginationSurfaceConfig = {
  suiteLabel: string;
  frRef: string;
  gotoListing: (page: Page) => Promise<void>;
  waitForLoaded: (page: Page) => Promise<void>;
  cards: (page: Page) => Locator;
};

type LibraryPaginationContext = {
  cards: Locator;
};

/**
 * FR-LIB-001 pagination contract — shared by My library, Explore, Favourites, and Project Workflows.
 * Requirements: tests/docs/requirements/features/library/library_page_requirements_v1.yaml (FR-LIB-001)
 */
export async function installPaginatedLibrarySearchMock(
  page: Page,
  options: { totalResults: number; titlePrefix?: string },
): Promise<void> {
  const { totalResults, titlePrefix = PAGINATED_LIBRARY_MOCK_TITLE_PREFIX } = options;

  await page.route('**/api/library/search', async (route) => {
    const body = route.request().postDataJSON() as {
      pagination?: { page?: number; resultsPerPage?: number };
    };
    const pageIndex = body.pagination?.page ?? 0;
    const resultsPerPage = body.pagination?.resultsPerPage ?? LIBRARY_RESULTS_PER_PAGE;
    const pageCount = totalResults > 0 ? Math.ceil(totalResults / resultsPerPage) : 0;
    const start = pageIndex * resultsPerPage;
    const itemCount = Math.min(resultsPerPage, Math.max(0, totalResults - start));

    const items = Array.from({ length: itemCount }, (_, index) => {
      const n = start + index + 1;
      const uuid = `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
      return {
        uuid,
        contentType: 'workflow',
        label: 'activity',
        title: `${titlePrefix} ${n}`,
        description: '',
        dateCreated: '2024-01-01T00:00:00.000Z',
        modifiedOn: '2024-01-01T00:00:00.000Z',
        isArchived: false,
        isTemplate: false,
        isFavorite: false,
        permissions: {
          accountRole: null,
          resourceRole: null,
          state: 'active',
          actions: [],
          adminOverride: false,
        },
      };
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items,
        meta: {
          totalResults,
          pageCount,
          currentPage: pageIndex,
          resultsPerPage,
          appliedFilters: {},
          allowed: { disciplines: [] },
        },
      }),
    });
  });
}

export async function expectPaginationHiddenPerFrLib001(page: Page): Promise<void> {
  await expect(libraryPagination(page)).toHaveCount(0);
}

export async function expectPaginationVisiblePerFrLib001(page: Page): Promise<void> {
  await expect(libraryPagination(page)).toBeVisible();
  await expect(paginationPageNumberButton(page, 1)).toBeVisible();
  await expect(paginationPageNumberButton(page, 2)).toBeVisible();
}

export async function expectPaginationPageNumberChangePerFrLib001(
  page: Page,
  ctx: LibraryPaginationContext,
): Promise<void> {
  await expect(ctx.cards).toHaveCount(LIBRARY_RESULTS_PER_PAGE);
  const firstPageTitles = await libraryCardTitles(page).allInnerTexts();
  const firstPageTitle = firstPageTitles[0]!;

  await triggerLibrarySearchAndWait(
    page,
    () => paginationPageNumberButton(page, 2).click(),
    { pagination: { page: 1 } },
  );

  await expect(paginationPageNumberButton(page, 2)).toHaveAttribute('aria-current', 'true');
  const secondPageCount = await ctx.cards.count();
  expect(secondPageCount).toBeGreaterThan(0);
  expect(secondPageCount).toBeLessThanOrEqual(LIBRARY_RESULTS_PER_PAGE);

  const secondPageTitle = await firstLibraryCardTitle(page).innerText();
  expect(secondPageTitle).not.toBe(firstPageTitle);
}

export async function expectPaginationPreviousNextPerFrLib001(page: Page): Promise<void> {
  await expect(paginationPageNumberButton(page, 1)).toHaveAttribute('aria-current', 'true');
  const firstPageTitles = await libraryCardTitles(page).allInnerTexts();
  const firstPageTitle = firstPageTitles[0]!;

  await triggerLibrarySearchAndWait(page, () => paginationNextButton(page).click(), {
    pagination: { page: 1 },
  });
  await expect(paginationPageNumberButton(page, 2)).toHaveAttribute('aria-current', 'true');
  expect(await firstLibraryCardTitle(page).innerText()).not.toBe(firstPageTitle);

  await paginationPreviousButton(page).click();
  await expect(paginationPageNumberButton(page, 1)).toHaveAttribute('aria-current', 'true');
  await expectLibraryCardTitles(page, firstPageTitles);
}

export async function expectPaginationFirstLastPerFrLib001(
  page: Page,
  ctx: LibraryPaginationContext,
): Promise<void> {
  await expect(paginationFirstButton(page)).toBeVisible();
  await expect(paginationLastButton(page)).toBeVisible();

  const firstPageTitles = await libraryCardTitles(page).allInnerTexts();
  const firstPageTitle = firstPageTitles[0]!;

  await triggerLibrarySearchAndWait(page, () => paginationLastButton(page).click(), {
    pagination: { page: 7 },
  });
  const lastPageTitle = await firstLibraryCardTitle(page).innerText();
  expect(lastPageTitle).not.toBe(firstPageTitle);
  expect(await ctx.cards.count()).toBeLessThanOrEqual(LIBRARY_RESULTS_PER_PAGE);

  await paginationFirstButton(page).click();
  await expect(paginationPageNumberButton(page, 1)).toHaveAttribute('aria-current', 'true');
  await expectLibraryCardTitles(page, firstPageTitles);
}

/**
 * Registers the shared FR-LIB-001 pagination suite for a library-style listing surface.
 * Same behavior on My library, Explore, Favourites, and Project Workflows.
 */
export function describeLibraryPaginationTests(config: LibraryPaginationSurfaceConfig): void {
  const { suiteLabel, frRef, gotoListing, waitForLoaded, cards } = config;

  test.describe(`${suiteLabel} — pagination (${frRef})`, () => {
    test('pagination is hidden when at most 10 matching results on page 1', async ({ page }) => {
      await gotoListing(page);
      await waitForLoaded(page);

      const cardCount = await cards(page).count();
      if (cardCount > LIBRARY_RESULTS_PER_PAGE) {
        test.skip(
          true,
          `Seeded listing shows ${cardCount} cards on page 1 — use mocked pagination tests for visible-pagination behavior.`,
        );
      }

      await expectPaginationHiddenPerFrLib001(page);
    });

    test.describe('when listing has 11 or more results (mocked library search)', () => {
      test.beforeEach(async ({ page }) => {
        await installPaginatedLibrarySearchMock(page, { totalResults: 15 });
        await triggerLibrarySearchAndWait(
          page,
          () => gotoListing(page),
          (request) => (request.pagination?.page ?? 0) === 0,
        );
      });

      test('pagination is visible with clickable page number controls', async ({ page }) => {
        await expectPaginationVisiblePerFrLib001(page);
      });

      test('paginationPageNumberButton loads that page into resultsRegion', async ({ page }) => {
        await expectPaginationPageNumberChangePerFrLib001(page, {
          cards: cards(page),
        });
      });

      test('paginationPreviousNextButton navigates between pages', async ({ page }) => {
        await expectPaginationPreviousNextPerFrLib001(page);
      });
    });

    test.describe('when listing has more than 7 pages (mocked library search)', () => {
      test.beforeEach(async ({ page }) => {
        await installPaginatedLibrarySearchMock(page, { totalResults: 75 });
        await triggerLibrarySearchAndWait(
          page,
          () => gotoListing(page),
          (request) => (request.pagination?.page ?? 0) === 0,
        );
      });

      test('paginationFirstLastButton navigates to first and last page', async ({ page }) => {
        await expectPaginationFirstLastPerFrLib001(page, {
          cards: cards(page),
        });
      });
    });
  });
}
