import { expect, type Page } from '@playwright/test';

import {
  favouritesSectionLabel,
  favouritedItemLinks,
  waitForMainNavigationReady,
} from '../shared/locators/navigation';
import { authenticatedApiRequest } from './api';
import { fetchWorkflowDetail } from './edit-workflow-form';

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

/** Bump workflow recency so it wins default sidebar favourites sort (DATE_MODIFIED DESC). */
export async function touchWorkflowModifiedOn(
  page: Page,
  workflowUuid: string,
): Promise<{ restore: () => Promise<void> }> {
  const workflow = await fetchWorkflowDetail(page, workflowUuid);
  const touchedDescription = workflow.description?.endsWith(' ')
    ? workflow.description.trimEnd()
    : `${workflow.description ?? ''} `;

  const response = await authenticatedApiRequest(page, 'PATCH', `/api/workflow/${workflowUuid}`, {
    data: {
      title: workflow.title,
      description: touchedDescription,
    },
  });
  expect(
    response.ok(),
    `Could not touch modified_on for workflow ${workflowUuid}.`,
  ).toBeTruthy();

  return {
    restore: async () => {
      const restoreResponse = await authenticatedApiRequest(
        page,
        'PATCH',
        `/api/workflow/${workflowUuid}`,
        {
          data: {
            title: workflow.title,
            description: workflow.description ?? '',
          },
        },
      );
      expect(
        restoreResponse.ok(),
        `Could not restore description for workflow ${workflowUuid}.`,
      ).toBeTruthy();
    },
  };
}

/**
 * Sidebar favourites are sorted by modified_on. Seed data includes five favourited
 * projects that crowd workflows out of the top five, so FR-NAV-005 regressions
 * would not surface unless favourited projects are temporarily cleared.
 */
export async function withFavouritedProjectsClearedFromSidebarFeed(
  page: Page,
  assertion: () => Promise<void>,
): Promise<void> {
  const favouritedProjects = await listFavouritedProjects(page);
  expect(
    favouritedProjects.length,
    'Precondition: account must have favourited projects to clear from sidebar feed.',
  ).toBeGreaterThan(0);

  const initialStates = await Promise.all(
    favouritedProjects.map(async (project) => ({
      project,
      favourited: await readLibraryObjectFavouriteState(page, {
        uuid: project.uuid,
        title: project.title,
        contentType: 'project',
      }),
    })),
  );

  for (const project of favouritedProjects) {
    await setLibraryObjectFavouriteState(
      page,
      { uuid: project.uuid, title: project.title, contentType: 'project' },
      false,
    );
  }

  try {
    await assertion();
  } finally {
    for (const { project, favourited } of initialStates) {
      await setLibraryObjectFavouriteState(
        page,
        { uuid: project.uuid, title: project.title, contentType: 'project' },
        favourited,
      );
    }
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

export async function querySidebarFavouritesFeed(
  page: Page,
): Promise<LibrarySearchResponseBody> {
  const response = await authenticatedApiRequest(page, 'POST', '/api/library/search', {
    data: {
      pagination: { page: 0, resultsPerPage: SIDEBAR_FAVOURITES_RESULTS_PER_PAGE },
      filters: { isFavorite: true, isArchived: false },
    },
  });
  expect(response.ok(), 'Could not query sidebar favourites feed.').toBeTruthy();
  return (await response.json()) as LibrarySearchResponseBody;
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

export async function listFavouritedWorkflows(
  page: Page,
): Promise<Array<{ uuid: string; title: string }>> {
  const response = await authenticatedApiRequest(page, 'POST', '/api/library/search', {
    data: {
      pagination: { page: 0, resultsPerPage: 50 },
      filters: {
        isFavorite: true,
        contentType: 'workflow',
        isArchived: false,
      },
    },
  });
  expect(response.ok(), 'Could not list favourited workflows.').toBeTruthy();

  const body = (await response.json()) as LibrarySearchResponseBody;
  return body.items
    .filter((item) => item.contentType === 'workflow' && item.isFavorite)
    .map((item) => ({ uuid: item.uuid, title: item.title }));
}

/**
 * FR-NAV-005 — sidebar Favourites lists favourited projects only.
 * Uses the sidebar's own library-search payload (resultsPerPage 5) plus DOM rows.
 */
export async function expectSidebarFavouritesShowProjectsOnly(
  page: Page,
  options: { requireWorkflowInSidebarFeed?: boolean } = {},
): Promise<void> {
  const requireWorkflowInSidebarFeed = options.requireWorkflowInSidebarFeed ?? true;

  const runAssertion = async (): Promise<void> => {
    const favouritedWorkflows = await listFavouritedWorkflows(page);
    expect(
      favouritedWorkflows.length,
      'Precondition: account must have at least one favourited workflow in library data.',
    ).toBeGreaterThan(0);

    const sidebarResponse = await waitForSidebarFavouritesSearchResponse(page, async () => {
      await page.reload();
    });
    await waitForMainNavigationReady(page);
    await expect(favouritesSectionLabel(page)).toBeVisible();

    const sidebarApiWorkflows = sidebarResponse.items.filter(
      (item) => item.contentType === 'workflow',
    );
    if (requireWorkflowInSidebarFeed) {
      expect(
        sidebarApiWorkflows.length,
        `Sidebar favourites query must include at least one workflow in the top ${SIDEBAR_FAVOURITES_RESULTS_PER_PAGE} so FR-NAV-005 can detect workflow rows.`,
      ).toBeGreaterThan(0);
    }

    const visibleEntries = await readSidebarFavouriteEntries(page);

    expect(
      visibleEntries.length,
      'Sidebar Favourites row count must match sidebar favourites query payload.',
    ).toBe(sidebarResponse.items.length);

    const visibleTitles = visibleEntries.map((entry) => entry.title);

    for (const workflow of sidebarApiWorkflows) {
      expect(
        visibleTitles,
        `Sidebar must not render workflow "${workflow.title}" returned by sidebar favourites query (FR-NAV-005).`,
      ).not.toContain(workflow.title);
    }

    for (const workflow of favouritedWorkflows) {
      expect(
        visibleTitles,
        `Sidebar must not render favourited workflow "${workflow.title}" (FR-NAV-005).`,
      ).not.toContain(workflow.title);
    }

    for (const [index, entry] of visibleEntries.entries()) {
      expect(
        entry.pathname,
        `Sidebar favourite[${index}] must route to a project (FR-NAV-005).`,
      ).toMatch(/^\/project\/[0-9a-f-]+/);
      expect(
        entry.pathname,
        `Sidebar favourite[${index}] must not route to a workflow (FR-NAV-005).`,
      ).not.toMatch(/^\/workflow\//);
    }
  };

  if (requireWorkflowInSidebarFeed) {
    await withFavouritedProjectsClearedFromSidebarFeed(page, runAssertion);
    return;
  }

  await runAssertion();
}

/**
 * FR-NAV-005 — after favouriting a workflow, sidebar feed includes it but DOM must not.
 */
export async function expectFavouritedWorkflowInSidebarFeedButNotInDom(
  page: Page,
  workflow: FavouritableLibraryObject,
): Promise<void> {
  expect(workflow.contentType).toBe('workflow');
  expect(await readLibraryObjectFavouriteState(page, workflow)).toBe(true);

  const { restore: restoreWorkflowDescription } = await touchWorkflowModifiedOn(
    page,
    workflow.uuid,
  );

  try {
    const sidebarResponse = await waitForSidebarFavouritesSearchResponse(page, async () => {
      await page.reload();
    });
    await waitForMainNavigationReady(page);
    await expect(favouritesSectionLabel(page)).toBeVisible();

    const workflowInSidebarFeed = sidebarResponse.items.some(
      (item) => item.uuid === workflow.uuid && item.contentType === 'workflow',
    );
    expect(
      workflowInSidebarFeed,
      `Favourited workflow "${workflow.title}" must appear in sidebar favourites query top ${SIDEBAR_FAVOURITES_RESULTS_PER_PAGE} so FR-NAV-005 can be exercised.`,
    ).toBe(true);

    const visibleEntries = await readSidebarFavouriteEntries(page);
    const visibleTitles = visibleEntries.map((entry) => entry.title);

    expect(
      visibleTitles,
      `Sidebar must not render newly favourited workflow "${workflow.title}" (FR-NAV-005).`,
    ).not.toContain(workflow.title);

    for (const [index, entry] of visibleEntries.entries()) {
      expect(entry.pathname).not.toMatch(new RegExp(`/workflow/${workflow.uuid}(?:/|$)`));
      expect(
        entry.pathname,
        `Sidebar favourite[${index}] must route to a project (FR-NAV-005).`,
      ).toMatch(/^\/project\/[0-9a-f-]+/);
    }
  } finally {
    await restoreWorkflowDescription();
  }
}
