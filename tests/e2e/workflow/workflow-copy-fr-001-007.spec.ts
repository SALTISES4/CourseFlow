import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../../helpers/auth';
import {
  contributorByRole,
  getPrimaryWorkflow,
  loadWorkflowManifest,
} from '../../helpers/manifest';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { globalMessageSnackbar } from '../../shared/locators/global';
import {
  workflowChannelsHeaderRow,
  workflowSectionContainers,
  workflowTitle,
} from '../../shared/locators/workflow';
import { workflowChannelHeaders, workflowNodes } from './workflow-graph.locators';
import {
  copyWorkflowCancelButton,
  copyWorkflowDialog,
  copyWorkflowDialogTitle,
  copyWorkflowMenuItem,
  copyWorkflowNoEligibleProjectsState,
  copyWorkflowProjectCardByTitle,
  copyWorkflowProjectCards,
  copyWorkflowProjectPanel,
  copyWorkflowProjectSearchEmptyState,
  copyWorkflowProjectSearchField,
  copyWorkflowSubmitButton,
  copyWorkflowTitleField,
  workflowOverflowButton,
} from './workflow-copy.locators';

/**
 * FR-WF-COPY-001 through FR-WF-COPY-007.
 * Requirements: tests/docs/requirements/features/workflow/workflow_copy_requirements_v1.yaml
 * Default actor: teacher@courseflow.com. The viewer-only no-destination case explicitly logs in
 * as student@courseflow.com because that role is the behavior under test.
 */

const manifest = loadWorkflowManifest();
const sourceWorkflow = getPrimaryWorkflow(manifest);
const sourceTitle = manifest.navigation_linked_workflows?.activity.workflow_title ?? '';
const workflowType = sourceWorkflow.workflow_type;

async function openCopyWorkflowDialog(page: Page): Promise<void> {
  await gotoAuthenticatedShell(page, sourceWorkflow.workflow_path);
  await expect(workflowOverflowButton(page)).toBeVisible({ timeout: 15_000 });
  await workflowOverflowButton(page).click();
  await copyWorkflowMenuItem(page, workflowType).click();
  await expect(copyWorkflowDialog(page)).toBeVisible();
}

test.describe('Copy workflow — FR-WF-COPY-001–007', () => {
  test('FR-WF-COPY-001 opens a typed dialog with a prefilled copy title', async ({ page }) => {
    await openCopyWorkflowDialog(page);

    await expect(copyWorkflowDialogTitle(page)).toHaveText(`Copy ${workflowType}`);
    await expect(copyWorkflowTitleField(page)).toHaveValue(`${sourceTitle} (copy)`);
    await expect(copyWorkflowProjectPanel(page)).toBeVisible();
    await expect(copyWorkflowCancelButton(page)).toBeVisible();
    await expect(copyWorkflowSubmitButton(page)).toHaveText(`Copy ${workflowType}`);
  });

  test('FR-WF-COPY-002 lists at most four eligible projects, pins the current project, and handles search', async ({
    page,
  }) => {
    await openCopyWorkflowDialog(page);

    const cards = copyWorkflowProjectCards(page);
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    expect(await cards.count()).toBeLessThanOrEqual(4);

    const currentProject = copyWorkflowProjectCardByTitle(page, manifest.project_title);
    await expect(currentProject).toBeVisible();
    await expect(cards.first()).toContainText(manifest.project_title);
    await expect(currentProject).toHaveClass(/selected/);
    await expect(copyWorkflowSubmitButton(page)).toBeEnabled();

    await copyWorkflowProjectSearchField(page).fill('no-project-has-this-title');
    await expect(copyWorkflowProjectSearchEmptyState(page)).toBeVisible({ timeout: 15_000 });
    await expect(cards).toHaveCount(0);
    await expect(copyWorkflowSubmitButton(page)).toBeDisabled();

    await copyWorkflowProjectSearchField(page).fill('');
    await expect(currentProject).toBeVisible({ timeout: 15_000 });
    await expect(currentProject).toHaveClass(/selected/);
    await expect(copyWorkflowSubmitButton(page)).toBeEnabled();
  });

  test('FR-WF-COPY-003 copies graph content and navigates to the new workflow', async ({
    page,
  }) => {
    const copiedTitle = `E2E copied activity ${Date.now()}`;
    await openCopyWorkflowDialog(page);
    const sourceSectionCount = await workflowSectionContainers(page).count();
    const sourceNodeCount = await workflowNodes(page).count();
    const sourceChannelCount = await workflowChannelHeaders(page).count();
    await copyWorkflowTitleField(page).fill(copiedTitle);
    await expect(copyWorkflowSubmitButton(page)).toBeEnabled({ timeout: 15_000 });
    await copyWorkflowSubmitButton(page).click();

    await expect(copyWorkflowDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/workflow\/[0-9a-f-]+\/graph\/?$/);
    await expect(globalMessageSnackbar(page)).toHaveText(
      `The ${workflowType} has been successfully copied`,
    );
    await expect(workflowTitle(page)).toContainText(copiedTitle);
    await expect(workflowSectionContainers(page)).toHaveCount(sourceSectionCount);
    await expect(workflowNodes(page)).toHaveCount(sourceNodeCount);
    await expect(workflowChannelsHeaderRow(page)).toBeVisible();
    await expect(workflowChannelHeaders(page)).toHaveCount(sourceChannelCount);
  });

  test('FR-WF-COPY-004 cancel closes the dialog without submitting a copy', async ({ page }) => {
    let copyRequests = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && /\/api\/workflow\/[^/]+\/copy$/.test(request.url())) {
        copyRequests += 1;
      }
    });

    await openCopyWorkflowDialog(page);
    const routeBeforeCancel = page.url();
    await copyWorkflowTitleField(page).fill(`Must not be copied ${Date.now()}`);
    await copyWorkflowCancelButton(page).click();

    await expect(copyWorkflowDialog(page)).toBeHidden();
    expect(page.url()).toBe(routeBeforeCancel);
    expect(copyRequests).toBe(0);

    await openCopyWorkflowDialog(page);
    await expect(copyWorkflowTitleField(page)).toHaveValue(`${sourceTitle} (copy)`);
  });

  test('FR-WF-COPY-005 keeps the dialog values after an API failure', async ({ page }) => {
    await page.route('**/api/workflow/*/copy', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Injected copy failure' }),
      });
    });

    const retainedTitle = `Retained after failure ${Date.now()}`;
    await openCopyWorkflowDialog(page);
    await copyWorkflowTitleField(page).fill(retainedTitle);
    const selectedProject = copyWorkflowProjectCardByTitle(page, manifest.project_title);
    await expect(selectedProject).toHaveClass(/selected/);
    await copyWorkflowSubmitButton(page).click();

    await expect(globalMessageSnackbar(page)).toHaveText(
      `We encountered an issue and your ${workflowType} was not copied`,
    );
    await expect(copyWorkflowDialog(page)).toBeVisible();
    await expect(copyWorkflowTitleField(page)).toHaveValue(retainedTitle);
    await expect(selectedProject).toHaveClass(/selected/);
    await expect(copyWorkflowSubmitButton(page)).toBeEnabled();
  });

  test('FR-WF-COPY-007 enforces required and 200-character title validation', async ({ page }) => {
    await openCopyWorkflowDialog(page);

    await copyWorkflowTitleField(page).fill('   ');
    await expect(copyWorkflowDialog(page).getByText('Title is required', { exact: true })).toBeVisible();
    await expect(copyWorkflowSubmitButton(page)).toBeDisabled();

    await copyWorkflowTitleField(page).fill('x'.repeat(201));
    await expect(
      copyWorkflowDialog(page).getByText('Title cannot be longer than 200 characters', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(copyWorkflowSubmitButton(page)).toBeDisabled();

    await copyWorkflowTitleField(page).fill('x'.repeat(200));
    await expect(copyWorkflowSubmitButton(page)).toBeEnabled();
  });
});

test.describe('FR-WF-COPY-006: viewer with no eligible destination project', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('shows the exact no-eligible-project warning and disables copy', async ({ page }) => {
    const viewer = contributorByRole(manifest, 'viewer');
    await loginAs(page, { email: viewer.email, password: viewer.password });
    await openCopyWorkflowDialog(page);

    const warning = copyWorkflowNoEligibleProjectsState(page);
    await expect(warning).toBeVisible({ timeout: 15_000 });
    await expect(warning).toContainText('You are not an owner or editor of any projects');
    await expect(warning).toContainText(
      'All workflows, whether they are programs, courses, or activities, exist within projects. You must always start by creating a project before proceeding to create any type of workflow. Currently you are not the owner and have not been added as an editor of any project.',
    );
    await expect(copyWorkflowProjectSearchField(page)).toBeHidden();
    await expect(copyWorkflowProjectCards(page)).toHaveCount(0);
    await expect(copyWorkflowSubmitButton(page)).toBeDisabled();
    await expect(copyWorkflowCancelButton(page)).toBeEnabled();
  });
});
