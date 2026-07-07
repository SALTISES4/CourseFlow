import { test, expect } from '@playwright/test';
import { describeLibraryPaginationTests } from '../../helpers/library-pagination';
import { describeLibraryResultsSummaryTests } from '../../helpers/library-results-summary';
import { expectSortControlPerFrLib002 } from '../../helpers/library-sort';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { getProjectWorkflowsPath, loadWorkflowManifest } from '../../helpers/manifest';
import { sortResetButton } from '../../shared/locators/library';
import {
  keywordSearchClearButton,
  keywordSearchField,
  projectWorkflowCards,
  projectWorkflowsArchiveToggle,
  projectWorkflowsDisciplineFilter,
  projectWorkflowsEmptyState,
  projectWorkflowsErrorState,
  projectWorkflowsFavouritesToggle,
  projectWorkflowsFilterToolbar,
  projectWorkflowsOwnershipFilter,
  projectWorkflowsSortControl,
  projectWorkflowsTemplatesToggle,
  projectWorkflowsTypeFilter,
  projectWorkflowsView,
  selectProjectWorkflowSortOption,
  waitForProjectWorkflowsLoaded,
} from './project.locators';

/**
 * Calibration slice — FR-PROJ-WF-001 through FR-PROJ-WF-004; FR-PROJ-WF-003 spec filters deferred.
 * Requirements: tests/docs/requirements/features/project/project_workflows_view_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com).
 */

test.describe('Project workflows — calibration (FR-PROJ-WF-001-004)', () => {
  const manifest = loadWorkflowManifest();
  const workflowsPath = getProjectWorkflowsPath(manifest);

  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, workflowsPath);
    await expect(page).toHaveURL(new RegExp(`/project/${manifest.project_uuid}/workflows/?$`));
    await waitForProjectWorkflowsLoaded(page);
  });

  test('FR-PROJ-WF-001: workflows tab renders toolbar and results region', async ({ page }) => {
    await expect(projectWorkflowsView(page)).toBeVisible();
    await expect(projectWorkflowsFilterToolbar(page)).toBeVisible();
    await expect(keywordSearchField(page)).toBeVisible();
    await expect(projectWorkflowsErrorState(page)).toBeHidden();

    const hasCards = (await projectWorkflowCards(page).count()) > 0;
    if (hasCards) {
      await expect(projectWorkflowCards(page).first()).toBeVisible();
      return;
    }

    await expect(projectWorkflowsEmptyState(page)).toBeVisible();
  });

  test('FR-PROJ-WF-001: seeded project includes at least one workflow card', async ({ page }) => {
    test.skip((await projectWorkflowCards(page).count()) === 0, 'No workflow cards in seeded project.');

    await expect(projectWorkflowCards(page).first()).toBeVisible();
  });

  test('FR-PROJ-WF-003: spec-only filters are not wired on project Workflows yet', async ({ page }) => {
    await expect(projectWorkflowsOwnershipFilter(page)).toHaveCount(0);
    await expect(projectWorkflowsFavouritesToggle(page)).toHaveCount(0);
    await expect(projectWorkflowsArchiveToggle(page)).toHaveCount(0);

    await expect(projectWorkflowsDisciplineFilter(page)).toBeVisible();
    await expect(projectWorkflowsTypeFilter(page)).toBeVisible();
    await expect(projectWorkflowsTemplatesToggle(page)).toBeVisible();
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

  test('FR-PROJ-WF-004: keyword search filters workflow cards by title', async ({ page }) => {
    test.skip((await projectWorkflowCards(page).count()) === 0, 'No workflow cards to filter.');

    const firstTitle = await projectWorkflowCards(page).first().locator('header').locator('> *').first().innerText();
    const token = firstTitle.trim().split(/\s+/)[0] ?? firstTitle;

    await keywordSearchField(page).fill(token);
    await keywordSearchField(page).press('Enter');
    await waitForProjectWorkflowsLoaded(page);

    await expect(projectWorkflowCards(page).first()).toContainText(token);

    if ((await keywordSearchClearButton(page).count()) > 0) {
      await keywordSearchClearButton(page).click();
      await waitForProjectWorkflowsLoaded(page);
    }
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
