import { test, expect } from '../../fixtures';
import { workflowOverviewPath, workflowOutcomesPath } from '../../helpers/workflow-navigation';
import {
  CARD_FAVOURITE_SNACKBAR_ADDED,
  CARD_FAVOURITE_SNACKBAR_REMOVED,
} from '../../shared/locators/cards';
import { globalMessageSnackbar } from '../../shared/locators/global';
import { sectionContainers } from './edit-section.locators';
import {
  workflowGraphTab,
  workflowHeaderFavouriteToggle,
  workflowOutcomesTab,
  workflowOverviewTab,
  workflowTitle,
  workflowViewTabSelector,
} from './workflow.locators';

test.use({ seedAsset: 'workflow.standard_activity', actorAsset: 'actor.teacher', seedAccess: 'disposable-copy' });

/**
 * Workflow header — FR-WF-HEADER-001, FR-WF-HEADER-002.
 * Requirements: workflow_header_requirements_v1.yaml
 */

test.describe('Workflow header — navigation (FR-WF-HEADER-001)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });
  });

  test('FR-WF-HEADER-001: graph route renders workflowTitle and workflowViewTabSelector tabs', async ({
    page,
  }) => {
    await expect(workflowTitle(page)).toBeVisible();
    await expect(workflowViewTabSelector(page)).toBeVisible();
    await expect(workflowOverviewTab(page)).toBeVisible();
    await expect(workflowGraphTab(page)).toBeVisible();
    await expect(workflowOutcomesTab(page)).toBeVisible();
    await expect(workflowGraphTab(page)).toHaveAttribute('aria-selected', 'true');
  });

  test('FR-WF-HEADER-001: Overview tab navigates to /workflow/{id}', async ({ page, workflow }) => {
    await workflowOverviewTab(page).click();
    await expect(page).toHaveURL(new RegExp(`${workflowOverviewPath(workflow.path)}/?$`));
    await expect(workflowOverviewTab(page)).toHaveAttribute('aria-selected', 'true');
  });

  test('FR-WF-HEADER-001: Outcomes tab navigates to /workflow/{id}/outcomes', async ({
    page,
    workflow,
  }) => {
    await workflowOutcomesTab(page).click();
    await expect(page).toHaveURL(new RegExp(`${workflowOutcomesPath(workflow.path)}/?$`));
    await expect(workflowOutcomesTab(page)).toHaveAttribute('aria-selected', 'true');
  });

  test('FR-WF-HEADER-001: Workflow tab returns to graph sub-view', async ({ page, workflow }) => {
    await workflowOverviewTab(page).click();
    await workflowGraphTab(page).click();
    await expect(page).toHaveURL(new RegExp(`${workflow.path}/?$`));
    await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Workflow header — favourite (FR-WF-HEADER-002)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-HEADER-002: workflowHeaderFavouriteToggle is visible on graph route', async ({
    page,
  }) => {
    await expect(workflowHeaderFavouriteToggle(page)).toBeVisible();
  });

  test('FR-WF-HEADER-002: favourite toggle add/remove round-trip shows snackbar feedback', async ({
    page,
  }) => {
    const toggle = workflowHeaderFavouriteToggle(page);
    await expect(toggle).toBeVisible();

    const urlBefore = page.url();

    await toggle.click();
    await expect(page).toHaveURL(urlBefore);
    await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
    await expect(globalMessageSnackbar(page)).toHaveText(
      new RegExp(`^(${CARD_FAVOURITE_SNACKBAR_ADDED}|${CARD_FAVOURITE_SNACKBAR_REMOVED})$`),
    );
    const firstMessage = await globalMessageSnackbar(page).textContent();

    await toggle.click();
    await expect(page).toHaveURL(urlBefore);
    const secondMessage =
      firstMessage === CARD_FAVOURITE_SNACKBAR_ADDED
        ? CARD_FAVOURITE_SNACKBAR_REMOVED
        : CARD_FAVOURITE_SNACKBAR_ADDED;
    await expect(globalMessageSnackbar(page).filter({ hasText: secondMessage })).toHaveText(
      secondMessage,
      { timeout: 15_000 },
    );
  });
});
