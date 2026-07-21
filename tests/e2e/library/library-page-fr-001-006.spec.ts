import { test, expect, type Page } from '@playwright/test';
import { authenticatedApiRequest } from '../../helpers/api';
import { loginAs } from '../../helpers/auth';
import { describeLibraryPaginationTests } from '../../helpers/library-pagination';
import { describeLibraryResultsSummaryTests } from '../../helpers/library-results-summary';
import {
  cleanupLibraryLifecycleFixture,
  createArchivedProjectFixture,
  createArchivedWorkflowFixture,
} from '../../helpers/library-lifecycle';
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
import { contributorByRole, loadWorkflowManifest } from '../../helpers/manifest';
import { gotoLibrary } from '../../helpers/navigation';
import { WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003 } from '../../shared/locators/library';
import {
  archiveToggle,
  archivedCardChip,
  keywordSearchClearButton,
  keywordSearchField,
  libraryCardByTitle,
  libraryCards,
  libraryEmptyState,
  libraryErrorState,
  libraryResultsProjectCards,
  libraryResultsWorkflowCards,
  projectCardDeletePermanentlyButton,
  projectCardRestoreButton,
  selectFilterOption,
  typeFilter,
  triggerLibrarySearchAndWait,
  waitForLibraryResultsLoaded,
  workflowCardDeletePermanentlyButton,
  workflowCardRestoreButton,
  workflowTypeFilter,
  firstLibraryCardTitle,
} from './library.locators';

/**
 * FR-LIB-001 through FR-LIB-004 and FR-LIB-006.
 * Requirements: tests/docs/requirements/features/library/library_page_requirements_v1.yaml
 * Auth: chromium project storage state (teacher@courseflow.com).
 */

test.describe('My library — listing and filtering (FR-LIB-001-004)', () => {
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
    test('Ownership filter - options and behaviour', async ({
      page,
    }) => {
      await expectOwnershipFilterCommittedStatePerFrLib003(page);
    });

    test('typeFilter commits Projects and resultsRegion shows only project cards', async ({
      page,
    }) => {
      await triggerLibrarySearchAndWait(
        page,
        () => selectFilterOption(page, typeFilter(page), 'Workflows'),
        { filters: { contentType: 'workflow' } },
      );
      await selectFilterOption(page, typeFilter(page), 'Projects');
      await expect(typeFilter(page)).toHaveText('Projects');
      await expectMyLibraryResultsContainOnlyProjectCards(page);
      await expect(libraryCards(page)).not.toHaveCount(0);
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
      await expect(libraryCards(page)).not.toHaveCount(0);
    });

    test('ownershipFilter Owned narrows results to owned in-scope cards', async ({ page }) => {
      expect(await ensureMyLibraryResultsHaveCards(page)).toBe(true);
      await expectOwnershipFilterOwnedNarrowsMyLibraryResults(page);
    });

    test('favouritesToggle restricts resultsRegion to favourited in-scope cards', async ({
      page,
    }) => {
      expect(await ensureMyLibraryResultsHaveCards(page)).toBe(true);
      await expectFavouritesToggleNarrowsMyLibraryResults(page);
    });

    test('selecting one workflow type narrows workflow results to that cardTypeChip', async ({
      page,
    }) => {
      expect(await ensureMyLibraryResultsHaveCards(page)).toBe(true);
      await expectWorkflowTypeFilterSingleSelectionNarrowsResults(
        page,
        WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003[0]!,
      );
    });
  });

  test('FR-LIB-004: keyword search narrows results and clear control resets field', async ({
    page,
  }) => {
    await expect(libraryCards(page)).not.toHaveCount(0);
    const title = (await firstLibraryCardTitle(page).innerText()).trim();
    const keyword = title.slice(0, Math.min(8, title.length));
    expect(keyword).not.toBe('');

    await expectKeywordSearchNarrowsMyLibraryResults(page, keyword);

    await expect(keywordSearchClearButton(page)).toBeVisible();
    await keywordSearchClearButton(page).click();
    await expect(keywordSearchField(page)).toHaveValue('');
  });
});

async function showArchivedProjects(page: Page): Promise<void> {
  await triggerLibrarySearchAndWait(page, () => archiveToggle(page).click(), {
    filters: { contentType: 'project', isArchived: true },
  });
}

async function showArchivedWorkflows(page: Page): Promise<void> {
  await triggerLibrarySearchAndWait(
    page,
    () => selectFilterOption(page, typeFilter(page), 'Workflows'),
    { filters: { contentType: 'workflow' } },
  );
  await triggerLibrarySearchAndWait(page, () => archiveToggle(page).click(), {
    filters: { contentType: 'workflow', isArchived: true },
  });
}

async function triggerLifecycleMutationAndWaitForRefresh(
  page: Page,
  method: 'POST' | 'DELETE',
  path: string,
  trigger: () => Promise<unknown>,
  contentType: 'project' | 'workflow',
): Promise<void> {
  const mutationResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === path && response.request().method() === method,
  );

  await triggerLibrarySearchAndWait(page, trigger, {
    filters: { contentType, isArchived: true },
  });

  const mutationResponse = await mutationResponsePromise;
  expect(
    mutationResponse.ok(),
    `${method} ${path} failed with HTTP ${mutationResponse.status()}`,
  ).toBeTruthy();
}

async function expectResourceRestored(
  page: Page,
  type: 'project' | 'workflow',
  uuid: string,
): Promise<void> {
  const response = await authenticatedApiRequest(page, 'GET', `/api/${type}/${uuid}`);
  expect(response.ok(), `Restored ${type} ${uuid} was not readable`).toBeTruthy();
  const body = (await response.json()) as { item?: { isArchived?: boolean } };
  expect(body.item?.isArchived).toBe(false);
}

async function expectResourceDeleted(
  page: Page,
  type: 'project' | 'workflow',
  uuid: string,
): Promise<void> {
  const response = await authenticatedApiRequest(page, 'GET', `/api/${type}/${uuid}`);
  expect(response.status(), `${type} ${uuid} still exists after permanent deletion`).toBe(404);
}

test.describe('My library — archived lifecycle (FR-LIB-006)', () => {
  const manifest = loadWorkflowManifest();

  test.beforeEach(async ({ page }) => {
    await gotoLibrary(page);
    await expect(page).toHaveURL(/\/library\/?$/);
    await waitForLibraryResultsLoaded(page);
  });

  test('archiveToggle shows disabled archived cards without favourite actions', async ({
    page,
  }) => {
    const fixture = await createArchivedProjectFixture(page, 'archived card');

    try {
      await showArchivedProjects(page);
      const card = libraryCardByTitle(page, fixture.projectTitle);

      await expect(card).toBeVisible();
      await expect(archivedCardChip(card)).toBeVisible();
      await expect(card.getByRole('button', { name: 'Favourite', exact: true })).toHaveCount(0);
      await expect(projectCardRestoreButton(card)).toBeVisible();
      await expect(projectCardDeletePermanentlyButton(card)).toBeVisible();

      await card.getByRole('heading').click();
      await expect(page).toHaveURL(/\/library\/?$/);
    } finally {
      await cleanupLibraryLifecycleFixture(page, fixture);
    }
  });

  test('owner restores an archived project from its card', async ({ page }) => {
    const fixture = await createArchivedProjectFixture(page, 'restore');

    try {
      await showArchivedProjects(page);
      const card = libraryCardByTitle(page, fixture.projectTitle);
      await expect(card).toBeVisible();

      await triggerLifecycleMutationAndWaitForRefresh(
        page,
        'POST',
        `/api/project/${fixture.projectUuid}/restore`,
        () => projectCardRestoreButton(card).click(),
        'project',
      );

      await expect(card).toHaveCount(0);
      await expectResourceRestored(page, 'project', fixture.projectUuid);
    } finally {
      await cleanupLibraryLifecycleFixture(page, fixture);
    }
  });

  test('project permanent-delete confirmation supports cancel and confirm', async ({ page }) => {
    const fixture = await createArchivedProjectFixture(page, 'delete');

    try {
      await showArchivedProjects(page);
      const card = libraryCardByTitle(page, fixture.projectTitle);
      await expect(card).toBeVisible();

      await projectCardDeletePermanentlyButton(card).click();
      const dialog = page.getByRole('dialog').filter({
        has: page.getByText('Permanently delete project', { exact: true }),
      });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(card).toBeVisible();

      await projectCardDeletePermanentlyButton(card).click();
      await triggerLifecycleMutationAndWaitForRefresh(
        page,
        'DELETE',
        `/api/project/${fixture.projectUuid}`,
        () => dialog.getByRole('button', { name: 'Delete project', exact: true }).click(),
        'project',
      );

      await expect(card).toHaveCount(0);
      await expectResourceDeleted(page, 'project', fixture.projectUuid);
    } finally {
      await cleanupLibraryLifecycleFixture(page, fixture);
    }
  });

  test('owner directly restores an archived workflow whose parent is active', async ({ page }) => {
    const fixture = await createArchivedWorkflowFixture(page, 'restore workflow');

    try {
      await showArchivedWorkflows(page);
      const card = libraryCardByTitle(page, fixture.workflowTitle!);
      await expect(card).toBeVisible();

      await triggerLifecycleMutationAndWaitForRefresh(
        page,
        'POST',
        `/api/workflow/${fixture.workflowUuid}/restore`,
        () => workflowCardRestoreButton(card).click(),
        'workflow',
      );

      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(card).toHaveCount(0);
      await expectResourceRestored(page, 'workflow', fixture.workflowUuid!);
    } finally {
      await cleanupLibraryLifecycleFixture(page, fixture);
    }
  });

  test('restoring an archived workflow under an archived parent restores the parent', async ({
    page,
  }) => {
    const fixture = await createArchivedProjectFixture(page, 'restore parent', {
      withWorkflow: true,
    });

    try {
      await showArchivedWorkflows(page);
      const card = libraryCardByTitle(page, fixture.workflowTitle!);
      await expect(card).toBeVisible();

      await workflowCardRestoreButton(card).click();
      const dialog = page.getByRole('dialog').filter({
        has: page.getByText('Restore parent project', { exact: true }),
      });
      await expect(dialog).toBeVisible();

      await triggerLifecycleMutationAndWaitForRefresh(
        page,
        'POST',
        `/api/project/${fixture.projectUuid}/restore`,
        () => dialog.getByRole('button', { name: 'Restore project', exact: true }).click(),
        'workflow',
      );

      await expect(dialog).toHaveCount(0);
      await expect(card).toHaveCount(0);
      await expectResourceRestored(page, 'project', fixture.projectUuid);
      await expectResourceRestored(page, 'workflow', fixture.workflowUuid!);
    } finally {
      await cleanupLibraryLifecycleFixture(page, fixture);
    }
  });

  test('owner permanently deletes an archived workflow even when its parent is archived', async ({
    page,
  }) => {
    const fixture = await createArchivedProjectFixture(page, 'delete workflow', {
      withWorkflow: true,
    });

    try {
      await showArchivedWorkflows(page);
      const card = libraryCardByTitle(page, fixture.workflowTitle!);
      await expect(card).toBeVisible();

      await workflowCardDeletePermanentlyButton(card).click();
      const dialog = page.getByRole('dialog').filter({
        has: page.getByText('Permanently delete workflow', { exact: true }),
      });
      await expect(dialog).toBeVisible();

      await triggerLifecycleMutationAndWaitForRefresh(
        page,
        'DELETE',
        `/api/workflow/${fixture.workflowUuid}`,
        () => dialog.getByRole('button', { name: 'Delete workflow', exact: true }).click(),
        'workflow',
      );

      await expect(card).toHaveCount(0);
      await expectResourceDeleted(page, 'workflow', fixture.workflowUuid!);
    } finally {
      await cleanupLibraryLifecycleFixture(page, fixture);
    }
  });

  for (const role of ['editor', 'commenter', 'viewer'] as const) {
    test(`${role} sees an archived project without owner lifecycle actions`, async ({ page }) => {
      const contributor = contributorByRole(manifest, role);
      await page.evaluate(() => window.localStorage.removeItem('cf2_access_token'));
      await loginAs(page, {
        email: contributor.email,
        password: contributor.password,
      });
      await gotoLibrary(page);
      await waitForLibraryResultsLoaded(page);

      const response = await triggerLibrarySearchAndWait(
        page,
        () => archiveToggle(page).click(),
        { filters: { contentType: 'project', isArchived: true } },
      );
      const item = response.items.find(
        ({ title }) => title === manifest.archived_home_project.title,
      );
      expect(item?.permissions?.resourceRole).toBe(role);

      const card = libraryCardByTitle(page, manifest.archived_home_project.title);
      await expect(card).toBeVisible();
      await expect(archivedCardChip(card)).toBeVisible();
      await expect(projectCardRestoreButton(card)).toHaveCount(0);
      await expect(projectCardDeletePermanentlyButton(card)).toHaveCount(0);
      await expect(card.getByRole('button', { name: 'Favourite', exact: true })).toHaveCount(0);

      await card.getByRole('heading').click();
      await expect(page).toHaveURL(/\/library\/?$/);
    });
  }
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
