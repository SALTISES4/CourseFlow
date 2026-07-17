import { test, expect } from '@playwright/test';
import { describeLibraryPaginationTests } from '../../helpers/library-pagination';
import { describeLibraryResultsSummaryTests } from '../../helpers/library-results-summary';
import { expectSortControlPerFrLib002 } from '../../helpers/library-sort';
import { expectOwnershipFilterCommittedStatePerFrLib003 } from '../../helpers/library-ownership-filter';
import {
  expectWorkflowTypeFilterPopoverShell,
  expectWorkflowTypeFilterSelectionIndicatorBehaviour,
  expectWorkflowTypeFilterSingleSelectionNarrowsWorkflowOnlyResults,
} from '../../helpers/explore-type-filter';
import {
  expectFavouritesToggleNarrowsProjectWorkflowsResults,
  expectKeywordSearchNarrowsProjectWorkflowsResults,
  expectOwnershipFilterOwnedNarrowsProjectWorkflowsResults,
  expectProjectWorkflowListingItemsBelongToCurrentProject,
  expectProjectWorkflowsFilterToolbarPerFrProjWf001,
  expectProjectWorkflowsViewShowsOnlyWorkflowCards,
  waitForProjectWorkflowsLoaded,
} from '../../helpers/project-workflows';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { getProjectWorkflowsPath, loadWorkflowManifest } from '../../helpers/manifest';
import {
  firstLibraryCardTitle,
  sortResetButton,
  WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003,
} from '../../shared/locators/library';
import {
  keywordSearchClearButton,
  keywordSearchField,
  projectWorkflowCards,
  projectWorkflowsEmptyState,
  projectWorkflowsErrorState,
  projectWorkflowsFilterToolbar,
  projectWorkflowsOwnershipFilter,
  projectWorkflowsOwnershipFilterResetButton,
  projectWorkflowsResultsWorkflowCards,
  projectWorkflowsSortControl,
  projectWorkflowsView,
  selectProjectWorkflowSortOption,
} from './project.locators';

/**
 * Calibration slice — FR-PROJ-WF-001 through FR-PROJ-WF-004.
 * Requirements: tests/docs/requirements/features/project/project_workflows_view_requirements_v1.yaml
 * Auth: chromium project storage state (teacher@courseflow.com).
 */

test.describe('Project workflows — calibration (FR-PROJ-WF-001-004)', () => {
  const manifest = loadWorkflowManifest();
  const workflowsPath = getProjectWorkflowsPath(manifest);

  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, workflowsPath);
    await expect(page).toHaveURL(new RegExp(`/project/${manifest.project_uuid}/workflows/?$`));
    await waitForProjectWorkflowsLoaded(page);
  });

  test('FR-PROJ-WF-001: workflows tab renders filter toolbar and results region', async ({
    page,
  }) => {
    await expect(projectWorkflowsView(page)).toBeVisible();
    await expectProjectWorkflowsFilterToolbarPerFrProjWf001(page);
    await expect(projectWorkflowsErrorState(page)).toBeHidden();

    const hasCards = (await projectWorkflowCards(page).count()) > 0;
    if (hasCards) {
      await expectProjectWorkflowsViewShowsOnlyWorkflowCards(page);
      await expect(projectWorkflowsResultsWorkflowCards(page)).toHaveCount(
        await projectWorkflowCards(page).count(),
      );
      return;
    }

    await expect(projectWorkflowsEmptyState(page)).toBeVisible();
  });

  test.describe('FR-PROJ-WF-001: project-scoped listing', () => {
    test('project workflows returns only workflows belonging to the current project', async ({
      page,
    }) => {
      await expectProjectWorkflowListingItemsBelongToCurrentProject(page, manifest.project_uuid);
    });
  });

  test('FR-PROJ-WF-002: selected option replaces Sort placeholder; sortResetButton restores default', async ({
    page,
  }) => {
    await expectSortControlPerFrLib002(page, {
      sortControl: projectWorkflowsSortControl(page),
      sortResetButton: sortResetButton(page, projectWorkflowsFilterToolbar(page)),
      selectSortOption: selectProjectWorkflowSortOption,
    });
  });

  test.describe('FR-PROJ-WF-003: workflow type filter', () => {
    test('workflowTypeFilter popover is multiselect with Activity, Course, and Program options', async ({
      page,
    }) => {
      await expectWorkflowTypeFilterPopoverShell(page);
    });

    test('workflowTypeFilterSelectionIndicator shows selected count and hides when unset', async ({
      page,
    }) => {
      await expectWorkflowTypeFilterSelectionIndicatorBehaviour(page);
    });
  });

  test.describe('FR-PROJ-WF-003: filter results', () => {
    test('ownershipFilter committed option replaces Ownership and shows ownershipFilterResetButton', async ({
      page,
    }) => {
      await expectOwnershipFilterCommittedStatePerFrLib003(page, {
        ownershipFilter: projectWorkflowsOwnershipFilter(page),
        ownershipFilterResetButton: projectWorkflowsOwnershipFilterResetButton(page),
      });
    });

    test('ownershipFilter Owned narrows results to owned workflow cards', async ({ page }) => {
      test.skip((await projectWorkflowCards(page).count()) === 0, 'No workflow cards in seeded project.');

      await expectOwnershipFilterOwnedNarrowsProjectWorkflowsResults(page);
    });

    test('favouritesToggle restricts resultsRegion to favourited workflow cards', async ({
      page,
    }) => {
      test.skip((await projectWorkflowCards(page).count()) === 0, 'No workflow cards in seeded project.');

      const narrowed = await expectFavouritesToggleNarrowsProjectWorkflowsResults(page);
      if (!narrowed) {
        test.skip(true, 'No favourited workflows in current project seed.');
      }
    });

    test('selecting one workflow type narrows workflow results to that cardTypeChip', async ({
      page,
    }) => {
      test.skip((await projectWorkflowCards(page).count()) === 0, 'No workflow cards in seeded project.');

      await expectWorkflowTypeFilterSingleSelectionNarrowsWorkflowOnlyResults(
        page,
        WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003[0]!,
      );
    });
  });

  test('FR-PROJ-WF-004: keyword search narrows results and clear control resets field', async ({
    page,
  }) => {
    test.skip((await projectWorkflowCards(page).count()) === 0, 'No workflow cards to filter.');

    const title = (await firstLibraryCardTitle(page).innerText()).trim();
    const keyword = title.slice(0, Math.min(8, title.length));
    if (!keyword) {
      test.skip(true, 'First workflow card has no title text for keyword search.');
    }

    await expectKeywordSearchNarrowsProjectWorkflowsResults(page, keyword);

    await expect(keywordSearchClearButton(page)).toBeVisible();
    await keywordSearchClearButton(page).click();
    await expect(keywordSearchField(page)).toHaveValue('');
  });
});

const projectWorkflowsManifest = loadWorkflowManifest();
const projectWorkflowsPath = getProjectWorkflowsPath(projectWorkflowsManifest);

describeLibraryPaginationTests({
  suiteLabel: 'Project workflows',
  frRef: 'FR-PROJ-WF-001',
  gotoListing: async (page) => {
    await gotoAuthenticatedShell(page, projectWorkflowsPath);
    await expect(page).toHaveURL(
      new RegExp(`/project/${projectWorkflowsManifest.project_uuid}/workflows/?$`),
    );
  },
  waitForLoaded: waitForProjectWorkflowsLoaded,
  cards: projectWorkflowCards,
});

describeLibraryResultsSummaryTests({
  suiteLabel: 'Project workflows',
  frRef: 'FR-PROJ-WF-001',
  gotoListing: async (page) => {
    await gotoAuthenticatedShell(page, projectWorkflowsPath);
    await expect(page).toHaveURL(
      new RegExp(`/project/${projectWorkflowsManifest.project_uuid}/workflows/?$`),
    );
  },
  waitForLoaded: waitForProjectWorkflowsLoaded,
  cards: projectWorkflowCards,
});
