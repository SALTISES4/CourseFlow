import { expect, test, type Page } from '../../fixtures';

import { loginAs } from '../../helpers/auth';
import { fetchWorkflowDetail } from '../../helpers/edit-workflow-form';
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
  copyWorkflowMenuItem,
  copyWorkflowNoEligibleProjectsState,
  copyWorkflowProjectCardByTitle,
  copyWorkflowProjectCards,
  copyWorkflowProjectPanel,
  copyWorkflowProjectSearchEmptyState,
  copyWorkflowProjectSearchField,
  copyWorkflowSubmitButton,
  copyWorkflowTitleField,
  expectCopyWorkflowCombinedDialogShell,
  expectCopyWorkflowSingleDialogShell,
  workflowOverflowButton,
} from './workflow-copy.locators';

test.use({
  seedDependencies: ['actor.teacher', 'project.primary', 'workflow.standard_activity'],
});

/**
 * FR-WF-COPY-001 through FR-WF-COPY-007.
 * Requirements: tests/docs/requirements/features/workflow/workflow_copy_requirements_v1.yaml
 * Copy is a single combined dialog (title + destination project), not a two-step / create
 * stepper flow. Default actor: teacher@courseflow.com. The viewer-only no-destination case
 * explicitly logs in as student@courseflow.com because that role is the behavior under test.
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
  await expectCopyWorkflowCombinedDialogShell(page, workflowType);
}

async function openCopyWorkflowDialogAsViewerWithNoEligibleProjects(page: Page): Promise<void> {
  await gotoAuthenticatedShell(page, sourceWorkflow.workflow_path);
  await expect(workflowOverflowButton(page)).toBeVisible({ timeout: 15_000 });
  await workflowOverflowButton(page).click();
  await copyWorkflowMenuItem(page, workflowType).click();
  // Same single dialog as eligible path; destination panel may be replaced by warning.
  await expectCopyWorkflowSingleDialogShell(page, workflowType);
}

function workflowUuidFromGraphUrl(url: string): string {
  const match = url.match(/\/workflow\/([0-9a-f-]+)\/graph\/?$/i);
  if (!match?.[1]) {
    throw new Error(`Expected /workflow/{uuid}/graph URL, got ${url}`);
  }
  return match[1];
}

/** FR-WF-COPY-003 — actor who initiated copy is owner of the copied workflow. */
async function expectActorIsOwnerOfCopiedWorkflow(page: Page): Promise<void> {
  const copiedUuid = workflowUuidFromGraphUrl(page.url());
  expect(copiedUuid).not.toBe(sourceWorkflow.workflow_uuid);
  const detail = await fetchWorkflowDetail(page, copiedUuid);
  expect(detail.permissions?.resourceRole).toBe('owner');
}

test.describe('Copy workflow — FR-WF-COPY-001–007', () => {
  test('FR-WF-COPY-001 opens one dialog with prefilled title and destination project panel', async ({
    page,
  }) => {
    await gotoAuthenticatedShell(page, sourceWorkflow.workflow_path);
    await expect(workflowOverflowButton(page)).toBeVisible({ timeout: 15_000 });
    await workflowOverflowButton(page).click();
    await copyWorkflowMenuItem(page, workflowType).click();

    // Strict: title must not appear alone before destination UI (no deferred project step).
    await expectCopyWorkflowCombinedDialogShell(page, workflowType);

    await expect(copyWorkflowTitleField(page)).toHaveValue(`${sourceTitle} (copy)`);
    await expect(copyWorkflowTitleField(page)).toBeVisible();
    await expect(copyWorkflowProjectPanel(page)).toBeVisible();
    await expect(copyWorkflowProjectSearchField(page)).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(1);
  });

  test('FR-WF-COPY-002 lists at most four eligible projects, pins the current project, and handles search', async ({
    page,
  }) => {
    await openCopyWorkflowDialog(page);

    // Destination selection is on the same dialog as the title field (not a second dialog).
    await expect(copyWorkflowTitleField(page)).toBeVisible();
    await expect(copyWorkflowTitleField(page)).toHaveValue(`${sourceTitle} (copy)`);

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
    await expect(copyWorkflowTitleField(page)).toBeVisible();
    await expect(copyWorkflowDialog(page)).toHaveCount(1);

    await copyWorkflowProjectSearchField(page).fill('');
    await expect(currentProject).toBeVisible({ timeout: 15_000 });
    await expect(currentProject).toHaveClass(/selected/);
    await expect(copyWorkflowSubmitButton(page)).toBeEnabled();
    await expect(copyWorkflowTitleField(page)).toBeVisible();
  });

  test('FR-WF-COPY-003 copies graph content and navigates to the new workflow', async ({
    page,
  }) => {
    const copiedTitle = `E2E copied activity ${Date.now()}`;
    await openCopyWorkflowDialog(page);
    const sourceSectionCount = await workflowSectionContainers(page).count();
    const sourceNodeCount = await workflowNodes(page).count();
    const sourceChannelCount = await workflowChannelHeaders(page).count();

    await expect(copyWorkflowProjectPanel(page)).toBeVisible();
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
    await expectActorIsOwnerOfCopiedWorkflow(page);
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

    // Re-open the same combined dialog; state resets (not a second concurrent dialog).
    await openCopyWorkflowDialog(page);
    await expect(copyWorkflowDialog(page)).toHaveCount(1);
    await expect(copyWorkflowTitleField(page)).toHaveValue(`${sourceTitle} (copy)`);
    await expect(copyWorkflowProjectPanel(page)).toBeVisible();
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
    await expect(copyWorkflowDialog(page)).toHaveCount(1);
    await expect(copyWorkflowDialog(page)).toBeVisible();
    await expect(copyWorkflowTitleField(page)).toHaveValue(retainedTitle);
    await expect(copyWorkflowProjectPanel(page)).toBeVisible();
    await expect(selectedProject).toHaveClass(/selected/);
    await expect(copyWorkflowSubmitButton(page)).toBeEnabled();
  });

  test('FR-WF-COPY-007 enforces required and 200-character title validation', async ({ page }) => {
    await openCopyWorkflowDialog(page);

    await expect(copyWorkflowProjectPanel(page)).toBeVisible();

    await copyWorkflowTitleField(page).fill('   ');
    await expect(
      copyWorkflowDialog(page).getByText('Title is required', { exact: true }),
    ).toBeVisible();
    await expect(copyWorkflowSubmitButton(page)).toBeDisabled();
    await expect(copyWorkflowProjectPanel(page)).toBeVisible();

    await copyWorkflowTitleField(page).fill('x'.repeat(201));
    await expect(
      copyWorkflowDialog(page).getByText('Title cannot be longer than 200 characters', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(copyWorkflowSubmitButton(page)).toBeDisabled();

    await copyWorkflowTitleField(page).fill('x'.repeat(200));
    await expect(copyWorkflowSubmitButton(page)).toBeEnabled();
    await expect(copyWorkflowProjectPanel(page)).toBeVisible();
  });
});

test.describe('FR-WF-COPY-003: editor becomes owner of the copied workflow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('editor who copies is owner of the new workflow', async ({ page }) => {
    // Editor is a contributor on the fixture project but not author of the source workflow.
    const editor = contributorByRole(manifest, 'editor');
    await loginAs(page, { email: editor.email, password: editor.password });

    const copiedTitle = `E2E editor-owned copy ${Date.now()}`;
    await openCopyWorkflowDialog(page);
    await copyWorkflowTitleField(page).fill(copiedTitle);
    await expect(copyWorkflowSubmitButton(page)).toBeEnabled({ timeout: 15_000 });
    await copyWorkflowSubmitButton(page).click();

    await expect(copyWorkflowDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/workflow\/[0-9a-f-]+\/graph\/?$/);
    await expect(workflowTitle(page)).toContainText(copiedTitle);
    await expectActorIsOwnerOfCopiedWorkflow(page);
  });
});

test.describe('FR-WF-COPY-006: viewer with no eligible destination project', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('shows the exact no-eligible-project warning and disables copy', async ({ page }) => {
    const viewer = contributorByRole(manifest, 'viewer');
    await loginAs(page, { email: viewer.email, password: viewer.password });
    await openCopyWorkflowDialogAsViewerWithNoEligibleProjects(page);

    await expect(copyWorkflowTitleField(page)).toHaveValue(`${sourceTitle} (copy)`);

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
    await expect(copyWorkflowDialog(page)).toHaveCount(1);
  });
});
