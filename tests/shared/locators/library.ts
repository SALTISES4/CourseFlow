import { expect, type Locator, type Page } from "@playwright/test";

export * from "./cards";

/**
 * Shared library listing uiObjects — canonical_locators.yaml (library*, keywordSearch*, projectCard, workflowCard).
 */

export const KEYWORD_SEARCH_PLACEHOLDER = "Search in projects...";
export const LIBRARY_EMPTY_MESSAGE = "No results found";
export const LIBRARY_LISTING_RESULTS_PER_PAGE = 10;
/** FIGMA-EXPLORE — exploreEmptyState copy per FR-EXP-001 */
export const EXPLORE_EMPTY_MESSAGE = "No results found";
/** FIGMA-EXPLORE-ERROR — exploreErrorState copy per FR-EXP-001 */
export const EXPLORE_ERROR_MESSAGE =
  "We encountered an issue and were not able to load the content.";
export const DISCIPLINE_SEARCH_LABEL = "Find discipline";
export const SORT_PLACEHOLDER = "Sort";
export const SORT_OPTION_A_TO_Z = "A - Z";
export const SORT_OPTION_DATE_CREATED = "Date created";
/** App copy not in FR-LIB-002 — used only to assert absence from sort menu. */
export const SORT_OPTION_RECENT = "Recent";
/** FR-LIB-003 — workflowTypeFilter checklist options (singular labels). */
export const WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003 = [
  "Activity",
  "Course",
  "Program",
] as const;
export const TYPE_FILTER_PLACEHOLDER = "Type";
export const OWNERSHIP_PLACEHOLDER = "Ownership";
export const OWNERSHIP_OPTION_OWNED = "Owned";

/** FR-LIB-003 — ownershipFilter option and committed trigger label. */
export const OWNERSHIP_OPTION_SHARED = 'Shared';


/** FR-LIB-001 — resultsSummary copy pattern (range per "current range" acceptance criteria). */
export const RESULTS_SUMMARY_REGEX =
  /^Showing (?:(\d+)-(\d+)|(\d+)) of (\d+) results$/;

/** canonical: keywordSearchField */
export function keywordSearchField(page: Page): Locator {
  return page.getByPlaceholder(KEYWORD_SEARCH_PLACEHOLDER);
}

/** canonical: keywordSearchClearButton */
export function keywordSearchClearButton(page: Page): Locator {
  return keywordSearchField(page).locator("..").getByRole("button");
}

/** canonical: libraryFilterToolbar / projectWorkflowsFilterToolbar */
export function libraryFilterToolbar(page: Page): Locator {
  return page.locator('[data-test-id="library-filter-toolbar"]');
}

export function sortControl(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole("button").first();
}

/** canonical: sortResetButton — clear control on active sortControl */
export function sortResetButton(
  page: Page,
  toolbar: Locator = libraryFilterToolbar(page),
): Locator {
  return toolbar
    .getByRole("button")
    .first()
    .locator("..")
    .getByRole("button", { name: "close", exact: true });
}

/** canonical: ownershipFilter */
export function ownershipFilter(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole("button", {
    name: /^(Ownership|Owned|Shared?)/,
  });
}

/** canonical: ownershipFilterResetButton — clear control on active ownershipFilter */
export function ownershipFilterResetButton(
  page: Page,
  filter: Locator = ownershipFilter(page),
): Locator {
  return filter
    .locator("..")
    .getByRole("button", { name: "close", exact: true });
}

/** canonical: typeFilter / contentTypeFilter */
export function typeFilter(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole("button", {
    name: /^(Type|Projects|Workflows)/,
  });
}

/** canonical: typeFilterResetButton — clear control on active typeFilter */
export function typeFilterResetButton(page: Page): Locator {
  return typeFilter(page)
    .locator("..")
    .getByRole("button", { name: "close", exact: true });
}

export function workflowTypeFilter(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole("button", {
    name: /^Workflow Type(?: \d+)?$/,
  });
}

/** Open workflowTypeFilter popover — scoped by Activity checklist row per FR-LIB-003. */
export function workflowTypeFilterPopover(page: Page): Locator {
  return page.locator(".MuiPopover-root").filter({
    has: page.getByRole("menuitem", { name: "Activity", exact: true }),
  });
}

/** canonical: workflowTypeFilterSelectionIndicator — count badge on closed trigger */
export function workflowTypeFilterSelectionIndicator(page: Page): Locator {
  return workflowTypeFilter(page).locator("span").filter({ hasText: /^\d+$/ });
}

export function workflowTypeFilterAllOption(page: Page): Locator {
  return workflowTypeFilterPopover(page).getByRole("button", {
    name: "All",
    exact: true,
  });
}

export function workflowTypeFilterNoneOption(page: Page): Locator {
  return workflowTypeFilterPopover(page).getByRole("button", {
    name: "None",
    exact: true,
  });
}

export function workflowTypeFilterCheckboxOptions(page: Page): Locator {
  return workflowTypeFilterPopover(page).getByRole("menuitem");
}

export function workflowTypeFilterCheckboxOption(
  page: Page,
  label: string,
): Locator {
  return workflowTypeFilterCheckboxOptions(page).filter({
    hasText: label,
    exact: true,
  });
}

export async function openWorkflowTypeFilterPopover(page: Page): Promise<void> {
  await workflowTypeFilter(page).click();
  await expect(workflowTypeFilterAllOption(page)).toBeVisible();
}

export async function closeWorkflowTypeFilterPopover(
  page: Page,
): Promise<void> {
  await page.keyboard.press("Escape");
  await expect(workflowTypeFilterAllOption(page)).toBeHidden();
}

export async function workflowTypeFilterOptionLabels(
  page: Page,
): Promise<string[]> {
  const options = workflowTypeFilterCheckboxOptions(page);
  const count = await options.count();
  const labels: string[] = [];

  for (let i = 0; i < count; i++) {
    labels.push((await options.nth(i).innerText()).trim());
  }

  return labels;
}

/** canonical: disciplineFilter */
export function disciplineFilter(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole("button", {
    name: /^Discipline/,
  });
}

/** Open disciplineFilter popover — scoped by Find discipline search field. */
export function disciplineFilterPopover(page: Page): Locator {
  return page
    .locator(".MuiPopover-root")
    .filter({ has: page.getByLabel(DISCIPLINE_SEARCH_LABEL) });
}

/** canonical: disciplineFilterSearchField */
export function disciplineFilterSearchField(page: Page): Locator {
  return disciplineFilterPopover(page).getByLabel(DISCIPLINE_SEARCH_LABEL);
}

/** canonical: disciplineFilterAllOption */
export function disciplineFilterAllOption(page: Page): Locator {
  return disciplineFilterPopover(page).getByRole("button", {
    name: "All",
    exact: true,
  });
}

/** canonical: disciplineFilterNoneOption */
export function disciplineFilterNoneOption(page: Page): Locator {
  return disciplineFilterPopover(page).getByRole("button", {
    name: "None",
    exact: true,
  });
}

/** Checklist rows inside disciplineFilter popover. */
export function disciplineFilterCheckboxOptions(page: Page): Locator {
  return disciplineFilterPopover(page).getByRole("menuitem");
}

export function disciplineFilterCheckboxOption(
  page: Page,
  label: string,
): Locator {
  return disciplineFilterCheckboxOptions(page).filter({
    hasText: label,
    exact: true,
  });
}

/** canonical: disciplineFilterSelectionIndicator — count badge on closed trigger */
export function disciplineFilterSelectionIndicator(page: Page): Locator {
  return disciplineFilter(page).locator("span").filter({ hasText: /^\d+$/ });
}

export async function openDisciplineFilterPopover(page: Page): Promise<void> {
  await disciplineFilter(page).click();
  await expect(disciplineFilterSearchField(page)).toBeVisible();
}

export async function closeDisciplineFilterPopover(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await expect(disciplineFilterSearchField(page)).toBeHidden();
}

export async function disciplineFilterOptionLabels(
  page: Page,
): Promise<string[]> {
  const options = disciplineFilterCheckboxOptions(page);
  const count = await options.count();
  const labels: string[] = [];

  for (let i = 0; i < count; i++) {
    labels.push((await options.nth(i).innerText()).trim());
  }

  return labels;
}

/** canonical: templatesToggle / templateFilter */
export function templatesToggle(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole("button", {
    name: "Templates",
    exact: true,
  });
}

/** canonical: favouritesToggle */
export function favouritesToggle(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole("button", {
    name: "Favourites",
    exact: true,
  });
}

/** canonical: archiveToggle */
export function archiveToggle(page: Page): Locator {
  return libraryFilterToolbar(page).getByRole("button", {
    name: "Archive",
    exact: true,
  });
}

/** canonical: libraryLoadingSkeletons */
export function libraryLoadingSkeletons(page: Page): Locator {
  return page.locator('[data-test-id="library-loading-skeleton"]');
}

/** canonical: libraryEmptyState */
export function libraryEmptyState(page: Page): Locator {
  return page.getByText(LIBRARY_EMPTY_MESSAGE, { exact: true });
}

export function libraryErrorState(page: Page): Locator {
  return page.getByText(
    /An error occurred|The content you were looking for is not found/,
  );
}

/** canonical: exploreEmptyState — zero-result body text in resultsRegion (FR-EXP-001). */
export function exploreEmptyState(page: Page): Locator {
  return page.getByText(EXPLORE_EMPTY_MESSAGE, { exact: true });
}

/** canonical: exploreErrorState — FIGMA-EXPLORE-ERROR copy in resultsRegion (FR-EXP-001). */
export function exploreErrorState(page: Page): Locator {
  return page.getByText(EXPLORE_ERROR_MESSAGE, { exact: true });
}

/** FR-EXP-001 — failed listing query shows exploreErrorState in resultsRegion. */
export async function expectExploreErrorStateInResultsRegion(
  page: Page,
): Promise<void> {
  await expect(exploreErrorState(page)).toBeVisible();
  await expect(libraryCards(page)).toHaveCount(0);
  await expect(exploreEmptyState(page)).toBeHidden();
}

/**
 * canonical: projectCard | workflowCard — listing cards in library results grid.
 * Matches [data-test-id="project-card"] and [data-test-id="workflow-card"].
 */
export function libraryCards(page: Page): Locator {
  return page.locator(
    '[data-test-id="library-results"] [data-test-id$="-card"]',
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A project or workflow card with the exact resource title. */
export function libraryCardByTitle(page: Page, title: string): Locator {
  return libraryCards(page).filter({
    has: page.getByRole("heading", {
      name: new RegExp(`^${escapeRegExp(title)}(?: \\(deleted\\))?$`),
    }),
  });
}

export function archivedCardChip(card: Locator): Locator {
  return card.getByText("Archived", { exact: true });
}

export function projectCardRestoreButton(card: Locator): Locator {
  return card.locator('[data-test-id="project-card-restore"]');
}

export function projectCardDeletePermanentlyButton(card: Locator): Locator {
  return card.locator('[data-test-id="project-card-delete-permanently"]');
}

export function workflowCardRestoreButton(card: Locator): Locator {
  return card.locator('[data-test-id="workflow-card-restore"]');
}

export function workflowCardDeletePermanentlyButton(card: Locator): Locator {
  return card.locator('[data-test-id="workflow-card-delete-permanently"]');
}

/** projectCard instances within resultsRegion */
export function libraryResultsProjectCards(page: Page): Locator {
  return page.locator(
    '[data-test-id="library-results"] [data-test-id="project-card"]',
  );
}

/** workflowCard instances within resultsRegion */
export function libraryResultsWorkflowCards(page: Page): Locator {
  return page.locator(
    '[data-test-id="library-results"] [data-test-id="workflow-card"]',
  );
}

/** canonical: projectCard */
export function projectCard(page: Page): Locator {
  return page.locator('[data-test-id="project-card"]');
}

/** canonical: workflowCard */
export function workflowCard(page: Page): Locator {
  return page.locator('[data-test-id="workflow-card"]');
}

/** canonical: resultsRegion — listing grid for projectCard and workflowCard instances */
export function libraryResultsRegion(page: Page): Locator {
  return page.locator('[data-test-id="library-results"]');
}

/** canonical: resultsSummary — count summary between libraryFilterToolbar and resultsRegion */
export function resultsSummary(page: Page): Locator {
  return page.getByText(RESULTS_SUMMARY_REGEX);
}

export function libraryPagination(page: Page): Locator {
  return page.getByRole("navigation", { name: "pagination navigation" });
}

/** canonical: paginationPageNumberButton — clickable numeric page item within pagination */
export function paginationPageNumberButton(
  page: Page,
  pageNumber: number,
): Locator {
  return libraryPagination(page).getByRole("button", {
    name: new RegExp(`^(?:page|Go to page) ${pageNumber}$`, "i"),
  });
}

/** canonical: paginationPreviousNextButton — previous page control */
export function paginationPreviousButton(page: Page): Locator {
  return libraryPagination(page).getByRole("button", {
    name: "Go to previous page",
  });
}

/** canonical: paginationPreviousNextButton — next page control */
export function paginationNextButton(page: Page): Locator {
  return libraryPagination(page).getByRole("button", {
    name: "Go to next page",
  });
}

/** canonical: paginationFirstLastButton — first page control (visible when pages > 7) */
export function paginationFirstButton(page: Page): Locator {
  return libraryPagination(page).getByRole("button", {
    name: "Go to first page",
  });
}

/** canonical: paginationFirstLastButton — last page control (visible when pages > 7) */
export function paginationLastButton(page: Page): Locator {
  return libraryPagination(page).getByRole("button", {
    name: "Go to last page",
  });
}

export function firstLibraryCardTitle(page: Page): Locator {
  return libraryCards(page).first().locator("header").locator("> *").first();
}

export function libraryCardTitles(page: Page): Locator {
  return libraryCards(page).locator("header").getByRole("heading");
}

export async function expectLibraryCardTitles(
  page: Page,
  expectedTitles: string[],
): Promise<void> {
  await expect
    .poll(() => libraryCardTitles(page).allInnerTexts(), { timeout: 15_000 })
    .toEqual(expectedTitles);
}

export async function waitForLibraryResultsLoaded(page: Page): Promise<void> {
  await expect(libraryLoadingSkeletons(page)).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(
    libraryCards(page)
      .first()
      .or(libraryEmptyState(page))
      .or(libraryErrorState(page))
      .or(exploreErrorState(page)),
  ).toBeVisible({ timeout: 15_000 });
}

type LibrarySearchResponseBody = {
  items: Array<{
    uuid: string;
    contentType: string;
    title: string;
    isFavorite: boolean;
    workflowCount: number | null;
    permissions?: { resourceRole?: string | null };
  }>;
};

export type LibrarySearchRequestBody = {
  filters?: Record<string, unknown> | null;
  pagination?: Record<string, unknown> | null;
  sort?: Record<string, unknown> | null;
};

type LibrarySearchRequestMatcher =
  | Record<string, unknown>
  | ((requestBody: LibrarySearchRequestBody) => boolean);

function matchesRequestSubset(actual: unknown, expected: unknown): boolean {
  if (expected === null) {
    return actual === null || actual === undefined;
  }
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((value, index) =>
        matchesRequestSubset(actual[index], value),
      )
    );
  }
  if (typeof expected === "object") {
    if (typeof actual !== "object" || actual === null) {
      return false;
    }
    return Object.entries(expected as Record<string, unknown>).every(
      ([name, value]) =>
        matchesRequestSubset((actual as Record<string, unknown>)[name], value),
    );
  }
  return actual === expected;
}

/**
 * Run an action that triggers a library search and wait for that specific response to be rendered.
 * Filter refetches retain the previous query data, so existing cards do not establish completion.
 * Listing searches use 10 results per page; this excludes the sidebar favourites search (5 per page).
 */
export async function triggerLibrarySearchAndWait(
  page: Page,
  trigger: () => Promise<unknown>,
  expectedRequest: LibrarySearchRequestMatcher,
): Promise<LibrarySearchResponseBody> {
  const responsePromise = page.waitForResponse(
    (response) => {
      if (
        !response.url().includes("/api/library/search") ||
        response.request().method() !== "POST"
      ) {
        return false;
      }

      const requestBody = response
        .request()
        .postDataJSON() as LibrarySearchRequestBody;
      if (
        requestBody.pagination?.resultsPerPage !==
        LIBRARY_LISTING_RESULTS_PER_PAGE
      ) {
        return false;
      }
      return typeof expectedRequest === "function"
        ? expectedRequest(requestBody)
        : matchesRequestSubset(requestBody, expectedRequest);
    },
    { timeout: 15_000 },
  );

  await trigger();

  const response = await responsePromise;
  expect(
    response.ok(),
    `Library search failed with HTTP ${response.status()} for request ${
      typeof expectedRequest === "function"
        ? "[custom matcher]"
        : JSON.stringify(expectedRequest)
    }`,
  ).toBeTruthy();

  const body = (await response.json()) as LibrarySearchResponseBody;
  expect(
    Array.isArray(body.items),
    "Library search response must contain an items array",
  ).toBe(true);
  expect(
    body.items.every((item) => typeof item?.title === "string"),
    "Every library search item must contain a title",
  ).toBe(true);
  await expect(libraryCards(page)).toHaveCount(body.items.length, {
    timeout: 15_000,
  });

  if (body.items.length === 0) {
    await expect(libraryEmptyState(page)).toBeVisible({ timeout: 15_000 });
  } else {
    const requestBody = response
      .request()
      .postDataJSON() as LibrarySearchRequestBody;
    const archived = requestBody.filters?.isArchived === true;
    await expectLibraryCardTitles(
      page,
      body.items.map((item) =>
        archived ? `${item.title} (deleted)` : item.title,
      ),
    );
  }

  return body;
}

/** Sort menu item — canonical sortControl dropdown option. */
export function sortMenuItem(page: Page, optionLabel: string): Locator {
  return page.getByRole("menuitem", { name: optionLabel, exact: true });
}

export async function selectSortOption(
  page: Page,
  optionLabel: string,
  control: Locator = sortControl(page),
): Promise<void> {
  await control.click();
  await sortMenuItem(page, optionLabel).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
}

export async function selectFilterOption(
  page: Page,
  filter: Locator,
  optionLabel: string,
): Promise<void> {
  await filter.click();
  await page.getByRole("menuitem", { name: optionLabel, exact: true }).click();
}
