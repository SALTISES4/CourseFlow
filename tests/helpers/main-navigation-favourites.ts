import { expect, type Page } from '@playwright/test';

import {
  favouritesSectionLabel,
  favouritedItemLinks,
  waitForMainNavigationReady,
} from '../shared/locators/navigation';
import { authenticatedApiRequest } from './api';

/** Sidebar Favourites query in MainSidebar/index.tsx */
export const SIDEBAR_FAVOURITES_RESULTS_PER_PAGE = 5;

type FavouritableLibraryObject = {
  uuid: string;
  title: string;
  contentType: 'project' | 'workflow';
};

type LibrarySearchItem = {
  uuid: string;
  title: string;
  contentType: string;
  isFavorite: boolean;
};

type LibrarySearchRequestBody = {
  filters?: Record<string, unknown> | null;
  pagination?: { page?: number; resultsPerPage?: number } | null;
};

type LibrarySearchResponseBody = {
  items: LibrarySearchItem[];
};

export type SidebarFavouriteEntry = {
  title: string;
  pathname: string;
};

function isSidebarFavouritesSearchRequest(body: LibrarySearchRequestBody): boolean {
  return (
    body.filters?.isFavorite === true &&
    body.filters?.contentType === 'project' &&
    body.pagination?.resultsPerPage === SIDEBAR_FAVOURITES_RESULTS_PER_PAGE &&
    (body.pagination?.page ?? 0) === 0
  );
}

export async function waitForSidebarFavouritesSearchResponse(
  page: Page,
  trigger: () => Promise<unknown>,
): Promise<LibrarySearchResponseBody> {
  const responsePromise = page.waitForResponse(
    (response) => {
      if (
        !response.url().includes('/api/library/search') ||
        response.request().method() !== 'POST'
      ) {
        return false;
      }

      const requestBody = response.request().postDataJSON() as LibrarySearchRequestBody;
      return isSidebarFavouritesSearchRequest(requestBody);
    },
    { timeout: 15_000 },
  );

  await trigger();

  const response = await responsePromise;
  expect(
    response.ok(),
    'Sidebar favourites library search must succeed.',
  ).toBeTruthy();

  return (await response.json()) as LibrarySearchResponseBody;
}

async function readLibraryObjectFavouriteState(
  page: Page,
  item: FavouritableLibraryObject,
): Promise<boolean> {
  const response = await authenticatedApiRequest(page, 'POST', '/api/library/search', {
    data: {
      pagination: { page: 0, resultsPerPage: 10 },
      filters: {
        keyword: item.title,
        contentType: item.contentType,
        isArchived: false,
      },
    },
  });
  expect(
    response.ok(),
    `Could not read favourite state for ${item.contentType} ${item.uuid}`,
  ).toBeTruthy();

  const body = (await response.json()) as LibrarySearchResponseBody;
  const match = body.items.find(
    (candidate) =>
      candidate.uuid === item.uuid && candidate.contentType === item.contentType,
  );
  expect(
    match,
    `Library search did not return ${item.contentType} ${item.uuid}`,
  ).toBeDefined();
  return match!.isFavorite;
}

async function setLibraryObjectFavouriteState(
  page: Page,
  item: FavouritableLibraryObject,
  favourited: boolean,
): Promise<void> {
  if ((await readLibraryObjectFavouriteState(page, item)) === favourited) {
    return;
  }

  const response = await authenticatedApiRequest(page, 'POST', '/api/library/favorite', {
    data: { uuid: item.uuid },
  });
  expect(
    response.ok(),
    `Could not set favourite state for ${item.contentType} ${item.uuid}`,
  ).toBeTruthy();
  expect(await readLibraryObjectFavouriteState(page, item)).toBe(favourited);
}

export async function withLibraryObjectFavouriteState(
  page: Page,
  item: FavouritableLibraryObject,
  favourited: boolean,
  assertion: () => Promise<void>,
): Promise<void> {
  const initialState = await readLibraryObjectFavouriteState(page, item);
  await setLibraryObjectFavouriteState(page, item, favourited);
  try {
    await assertion();
  } finally {
    await setLibraryObjectFavouriteState(page, item, initialState);
  }
}

/** Read visible sidebar Favourites rows (title + resolved link pathname). */
export async function readSidebarFavouriteEntries(page: Page): Promise<SidebarFavouriteEntry[]> {
  const links = favouritedItemLinks(page);
  const linkCount = await links.count();
  const entries: SidebarFavouriteEntry[] = [];

  for (let index = 0; index < linkCount; index++) {
    const link = links.nth(index);
    await expect(link).toBeVisible();

    const entry = await link.evaluate((element) => {
      const anchor =
        element instanceof HTMLAnchorElement
          ? element
          : element.querySelector('a') ?? element.closest('a');
      const href = anchor instanceof HTMLAnchorElement ? anchor.href : '';
      const pathname = href ? new URL(href).pathname : '';

      return {
        title: (element.textContent ?? '').replace(/\s+/g, ' ').trim(),
        pathname,
      };
    });

    expect(entry.pathname, `Sidebar favourite link[${index}] must resolve to a pathname`).not.toBe(
      '',
    );
    entries.push(entry);
  }

  return entries;
}

export async function listFavouritedProjects(
  page: Page,
): Promise<Array<{ uuid: string; title: string }>> {
  const response = await authenticatedApiRequest(page, 'POST', '/api/library/search', {
    data: {
      pagination: { page: 0, resultsPerPage: 50 },
      filters: {
        isFavorite: true,
        contentType: 'project',
        isArchived: false,
      },
    },
  });
  expect(response.ok(), 'Could not list favourited projects.').toBeTruthy();

  const body = (await response.json()) as LibrarySearchResponseBody;
  return body.items
    .filter((item) => item.contentType === 'project' && item.isFavorite)
    .map((item) => ({ uuid: item.uuid, title: item.title }));
}

/**
 * FR-NAV-005 — sidebar Favourites lists favourited projects only.
 * Verifies both the sidebar's project-only query and the rendered rows.
 */
export async function expectSidebarFavouritesShowProjectsOnly(
  page: Page,
): Promise<void> {
  const favouritedProjects = await listFavouritedProjects(page);
  expect(
    favouritedProjects.length,
    'Precondition: account must have at least one favourited project.',
  ).toBeGreaterThan(0);

  const sidebarResponse = await waitForSidebarFavouritesSearchResponse(page, async () => {
    await page.reload();
  });
  await waitForMainNavigationReady(page);
  await expect(favouritesSectionLabel(page)).toBeVisible();

  expect(sidebarResponse.items.length).toBeGreaterThan(0);
  expect(
    sidebarResponse.items.every(
      (item) => item.contentType === 'project' && item.isFavorite,
    ),
    'Sidebar favourites query must return favourited projects only.',
  ).toBe(true);

  const visibleEntries = await readSidebarFavouriteEntries(page);
  expect(
    visibleEntries.length,
    'Sidebar Favourites row count must match sidebar favourites query payload.',
  ).toBe(sidebarResponse.items.length);
  expect(visibleEntries.map((entry) => entry.title)).toEqual(
    sidebarResponse.items.map((item) => item.title),
  );

  for (const [index, entry] of visibleEntries.entries()) {
    expect(
      entry.pathname,
      `Sidebar favourite[${index}] must route to a project (FR-NAV-005).`,
    ).toMatch(/^\/project\/[0-9a-f-]+/);
  }
}

/**
 * FR-NAV-005 — a favourited workflow is excluded from the project-only sidebar query and DOM.
 */
export async function expectFavouritedWorkflowInSidebarFeedButNotInDom(
  page: Page,
  workflow: FavouritableLibraryObject,
): Promise<void> {
  expect(workflow.contentType).toBe('workflow');
  expect(await readLibraryObjectFavouriteState(page, workflow)).toBe(true);

  const sidebarResponse = await waitForSidebarFavouritesSearchResponse(page, async () => {
    await page.reload();
  });
  await waitForMainNavigationReady(page);
  await expect(favouritesSectionLabel(page)).toBeVisible();

  expect(
    sidebarResponse.items.some((item) => item.uuid === workflow.uuid),
    `Project-only sidebar query must exclude favourited workflow "${workflow.title}".`,
  ).toBe(false);
  expect(
    sidebarResponse.items.every((item) => item.contentType === 'project'),
    'Sidebar favourites query must return projects only.',
  ).toBe(true);

  const visibleEntries = await readSidebarFavouriteEntries(page);
  const visibleTitles = visibleEntries.map((entry) => entry.title);
  expect(
    visibleTitles,
    `Sidebar must not render favourited workflow "${workflow.title}" (FR-NAV-005).`,
  ).not.toContain(workflow.title);

  for (const [index, entry] of visibleEntries.entries()) {
    expect(entry.pathname).not.toMatch(new RegExp(`/workflow/${workflow.uuid}(?:/|$)`));
    expect(
      entry.pathname,
      `Sidebar favourite[${index}] must route to a project (FR-NAV-005).`,
    ).toMatch(/^\/project\/[0-9a-f-]+/);
  }
}
