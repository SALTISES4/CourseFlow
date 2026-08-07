import { expect, type Locator, type Page } from "@playwright/test";

import {
  cardFavouriteToggle,
  cardTitleText,
  CARD_FAVOURITE_SNACKBAR_ADDED,
  CARD_FAVOURITE_SNACKBAR_REMOVED,
  libraryProjectCardByTitle,
  libraryWorkflowCardByTitle,
} from "../shared/locators/cards";
import { globalMessageSnackbar } from "../shared/locators/global";
import {
  archiveToggle,
  disciplineFilter,
  favouritesToggle,
  expectLibraryCardTitles,
  keywordSearchField,
  LIBRARY_LISTING_RESULTS_PER_PAGE,
  libraryCards,
  libraryCardTitles,
  libraryFilterToolbar,
  ownershipFilter,
  ownershipFilterResetButton,
  selectFilterOption,
  sortControl,
  templatesToggle,
  typeFilter,
  typeFilterResetButton,
  triggerLibrarySearchAndWait,
  waitForLibraryResultsLoaded,
} from "../shared/locators/library";
import {
  expectExploreResultsContainOnlyProjectCards,
  expectExploreResultsContainOnlyWorkflowCards,
} from "./explore";
import { expectExploreResultsContainOnlyTemplateCards } from "./explore-boolean-filters";
import { gotoExplore } from "./navigation";

export {
  expectExploreResultsContainOnlyProjectCards as expectFavouritesResultsContainOnlyProjectCards,
  expectExploreResultsContainOnlyWorkflowCards as expectFavouritesResultsContainOnlyWorkflowCards,
  expectExploreResultsContainOnlyTemplateCards as expectFavouritesResultsContainOnlyTemplateCards,
};

export {
  expectWorkflowTypeFilterHiddenWhenTypeIsProjects,
  expectWorkflowTypeFilterVisibleWhenTypeIsUnset,
  expectWorkflowTypeFilterVisibleWhenTypeIsWorkflows,
} from "./library-type-filter";

/**
 * FR-FAV-001 — favouritesFilterToolbar exposes sort, ownership, type, and templates only.
 * Requirements: tests/docs/requirements/features/library/favourites_page_requirements_v1.yaml
 *
 * Keyword search is covered separately under FR-FAV-005. workflowTypeFilter appears only when
 * typeFilter scope includes workflows (FR-FAV-003 / FR-LIB-003).
 */
export async function expectFavouritesFilterToolbarPerFrFav001(
  page: Page,
): Promise<void> {
  await expect(libraryFilterToolbar(page)).toBeVisible();

  // Controls that belong on other listing pages, not Favourites.
  await expect.soft(archiveToggle(page)).toHaveCount(0);
  await expect.soft(favouritesToggle(page)).toHaveCount(0);
  await expect.soft(disciplineFilter(page)).toHaveCount(0);

  // Required toolbar filters on Favourites.
  await expect.soft(sortControl(page)).toBeVisible();
  await expect.soft(ownershipFilter(page)).toBeVisible();
  await expect.soft(typeFilter(page)).toBeVisible();
  await expect.soft(templatesToggle(page)).toBeVisible();
}

/** FR-FAV-001 — when default Projects scope is empty, open Workflows for favourited workflow seed rows. */
export async function ensureFavouritesResultsHaveCards(
  page: Page,
): Promise<boolean> {
  if ((await libraryCards(page).count()) > 0) {
    return true;
  }

  await triggerLibrarySearchAndWait(
    page,
    () => selectFilterOption(page, typeFilter(page), "Workflows"),
    { filters: { contentType: "workflow" } },
  );
  return (await libraryCards(page).count()) > 0;
}

type FavouritesLibrarySearchResponse = {
  items: Array<{ isFavorite: boolean }>;
};

type FavouritesLibrarySearchRequest = {
  pagination?: {
    resultsPerPage?: number;
  };
  filters?: {
    contentType?: string;
    isFavorite?: boolean;
    includePublishedFavorites?: boolean;
  };
};

function isFavouritesLibrarySearchResponse(response: {
  url: () => string;
  request: () => { method: () => string; postDataJSON: () => unknown };
  status: () => number;
}): boolean {
  if (
    !response.url().includes("/api/library/search") ||
    response.request().method() !== "POST" ||
    response.status() !== 200
  ) {
    return false;
  }

  const requestBody = response.request().postDataJSON() as
    | FavouritesLibrarySearchRequest
    | null;
  return (
    requestBody?.pagination?.resultsPerPage ===
    LIBRARY_LISTING_RESULTS_PER_PAGE
  );
}

/**
 * FR-FAV-001 — favourites listing only returns favourited items (API contract).
 * Asserts locked isFavorite filter on the request and isFavorite: true on every item in the response.
 * Star colour vs isFavorite is covered in card-content FR-CARD-005.
 */
export async function expectFavouritesListingItemsAreFavourited(
  page: Page,
): Promise<void> {
  const searchResponse = page.waitForResponse(
    isFavouritesLibrarySearchResponse,
  );
  await page.reload();
  await expect(page).toHaveURL(/\/favourites\/?$/);
  await waitForLibraryResultsLoaded(page);

  const response = await searchResponse;
  const requestBody =
    response.request().postDataJSON() as FavouritesLibrarySearchRequest;
  expect(requestBody.filters?.isFavorite).toBe(true);
  expect(requestBody.filters?.includePublishedFavorites).toBe(true);
  expect(requestBody.filters?.contentType).toBe("project");

  const body = (await response.json()) as FavouritesLibrarySearchResponse;
  for (const item of body.items) {
    expect(item.isFavorite).toBe(true);
  }
}

/** FR-FAV-003 — ownershipFilter Owned narrows results and every visible card is owned by the user. */
export async function expectOwnershipFilterOwnedNarrowsFavouritesResults(
  page: Page,
): Promise<void> {
  const baselineTitles = await libraryCardTitles(page).allInnerTexts();
  const baselineCount = baselineTitles.length;
  expect(baselineCount).toBeGreaterThan(0);

  const filteredResponse = await triggerLibrarySearchAndWait(
    page,
    () => selectFilterOption(page, ownershipFilter(page), "Owned"),
    { filters: { ownership: "owned" } },
  );
  await expect(ownershipFilter(page)).toHaveText("Owned", { exact: true });
  await expect(ownershipFilterResetButton(page)).toBeVisible();

  const ownedCount = filteredResponse.items.length;
  expect(ownedCount).toBeLessThanOrEqual(baselineCount);
  expect(ownedCount).toBeGreaterThan(0);

  for (const item of filteredResponse.items) {
    expect(item.permissions?.resourceRole).toBe("owner");
  }
}

/** FR-FAV-004 — templatesToggle restricts resultsRegion to template favourited cards. */
export async function expectTemplatesToggleNarrowsFavouritesResults(
  page: Page,
): Promise<void> {
  await triggerLibrarySearchAndWait(
    page,
    () => typeFilterResetButton(page).click(),
    { filters: { contentType: null } },
  );

  const baselineTitles = await libraryCardTitles(page).allInnerTexts();
  const baselineCount = baselineTitles.length;
  expect(baselineCount).toBeGreaterThan(0);

  const filteredResponse = await triggerLibrarySearchAndWait(
    page,
    () => templatesToggle(page).click(),
    { filters: { isTemplate: true } },
  );
  await expect(templatesToggle(page)).toHaveClass(/MuiButton-contained/);

  const templateCount = filteredResponse.items.length;
  expect(templateCount).toBeGreaterThan(0);
  expect(templateCount).toBeLessThanOrEqual(baselineCount);
  await expectExploreResultsContainOnlyTemplateCards(page);

  await templatesToggle(page).click();
  await expect(templatesToggle(page)).not.toHaveClass(/MuiButton-contained/);
  await expectLibraryCardTitles(page, baselineTitles);
}

/** FR-FAV-005 — keyword search narrows resultsRegion to matching favourited card titles. */
export async function expectKeywordSearchNarrowsFavouritesResults(
  page: Page,
  keyword: string,
): Promise<void> {
  const baselineCount = await libraryCards(page).count();
  expect(baselineCount).toBeGreaterThan(0);

  const filteredResponse = await triggerLibrarySearchAndWait(
    page,
    async () => {
      await keywordSearchField(page).fill(keyword);
      await keywordSearchField(page).press("Enter");
    },
    { filters: { keyword } },
  );

  const narrowedCount = filteredResponse.items.length;
  expect(narrowedCount).toBeGreaterThan(0);
  expect(narrowedCount).toBeLessThanOrEqual(baselineCount);

  const cards = libraryCards(page);
  for (let i = 0; i < narrowedCount; i++) {
    await expect(cardTitleText(cards.nth(i))).toContainText(keyword);
  }
}

/**
 * FR-FAV-001 — unfavouriting removes the card from /favourites listing.
 * Caller should restore favourite state afterward (see restoreFavouritedCardByTitle).
 * Star colour vs API isFavorite is covered in card-content FR-CARD-005.
 */
export async function expectUnfavouritingRemovesCardFromFavouritesListing(
  page: Page,
  card: Locator,
  title: string,
): Promise<void> {
  const countBefore = await libraryCards(page).count();

  await cardFavouriteToggle(card).click();
  await expect(globalMessageSnackbar(page)).toHaveText(
    CARD_FAVOURITE_SNACKBAR_REMOVED,
    {
      timeout: 15_000,
    },
  );

  await expect(
    libraryCards(page).filter({
      has: page.getByRole("heading", { name: title, exact: true }),
    }),
  ).toHaveCount(0);

  if (countBefore === 1) {
    return;
  }

  expect(await libraryCards(page).count()).toBeLessThan(countBefore);
}

/** Restore favourite after FR-FAV-001 unfavourite test — re-favourites via published Explore listing. */
export async function restoreFavouritedCardByTitle(
  page: Page,
  title: string,
): Promise<void> {
  await gotoExplore(page);
  await expect(page).toHaveURL(/\/explore\/?$/);
  await waitForLibraryResultsLoaded(page);
  await triggerLibrarySearchAndWait(
    page,
    async () => {
      await keywordSearchField(page).fill(title);
      await keywordSearchField(page).press("Enter");
    },
    { filters: { keyword: title } },
  );

  const card = libraryWorkflowCardByTitle(page, title).or(
    libraryProjectCardByTitle(page, title),
  );
  await expect(card).toBeVisible({ timeout: 15_000 });

  await cardFavouriteToggle(card).click();
  await expect(globalMessageSnackbar(page)).toHaveText(
    CARD_FAVOURITE_SNACKBAR_ADDED,
    {
      timeout: 15_000,
    },
  );
}
