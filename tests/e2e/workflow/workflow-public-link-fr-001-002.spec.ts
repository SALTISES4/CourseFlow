import { expect, test } from '../../fixtures';
import { apiRequestWithAccessToken, readPrimaryActorAccessToken } from '../../helpers/api';
import { workflowOutcomesPath, workflowOverviewPath } from '../../helpers/workflow-navigation';
import { globalMessageSnackbar } from '../../shared/locators/global';
import { mainNavigation, topNavigationBar } from '../../shared/locators/navigation';
import { workflowRightSidebar } from '../../shared/locators/workflow';
import { sectionContainers } from './edit-section.locators';
import { loginAsWorkflowContributor, type WorkflowContributorRole } from './role.helpers';
import {
  workflowGraphTab,
  workflowHeaderFavouriteToggle,
  workflowOutcomesTab,
  workflowOutcomeView,
  workflowOverviewTab,
  workflowTitle,
  workflowView,
  workflowViewTabSelector,
} from './workflow.locators';
import {
  workflowCopyPublicLinkButton,
  workflowGeneratePublicLinkButton,
  workflowMetadataPermissionsPanel,
  workflowOverviewView,
  workflowRemovePublicLinkButton,
} from './workflow-overview.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Workflow public link — FR-WF-PUBLIC-001 and FR-WF-PUBLIC-002.
 * Requirements: workflow_public_link_requirements_v1.yaml
 */
test.describe('authenticated public-link lifecycle (FR-WF-PUBLIC-001)', () => {
  test('owner enables and removes anonymous access from the existing Overview control', async ({
    context,
    page,
    workflow,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(workflowOverviewPath(workflow.path));

    await expect(workflowGeneratePublicLinkButton(page)).toBeVisible();
    await workflowGeneratePublicLinkButton(page).click();

    await expect(workflowGeneratePublicLinkButton(page)).toHaveCount(0);
    await expect(workflowCopyPublicLinkButton(page)).toBeVisible();
    await expect(workflowRemovePublicLinkButton(page)).toBeVisible();
    await expect(globalMessageSnackbar(page).filter({ hasText: 'Public link enabled' })).toHaveText(
      'Public link enabled',
    );

    await workflowCopyPublicLinkButton(page).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(new URL(workflowOverviewPath(workflow.path), page.url()).toString());
    await expect(globalMessageSnackbar(page).filter({ hasText: 'Public link copied' })).toHaveText(
      'Public link copied',
    );

    await page.reload();
    await expect(workflowCopyPublicLinkButton(page)).toBeVisible();

    await workflowRemovePublicLinkButton(page).click();
    await expect(workflowGeneratePublicLinkButton(page)).toBeVisible();
    await expect(workflowCopyPublicLinkButton(page)).toHaveCount(0);
    await expect(globalMessageSnackbar(page).filter({ hasText: 'Public link removed' })).toHaveText(
      'Public link removed',
    );
  });

  for (const role of ['editor', 'commenter', 'viewer'] as WorkflowContributorRole[]) {
    test(`${role} sees the role-appropriate public-link control`, async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, role);
      await page.goto(workflowOverviewPath(workflow.path));

      if (role === 'editor') {
        await expect(workflowGeneratePublicLinkButton(page)).toBeVisible();
        await expect(workflowGeneratePublicLinkButton(page)).toBeEnabled();
      } else {
        await expect(workflowGeneratePublicLinkButton(page)).toHaveCount(0);
      }
    });
  }
});

test.describe('anonymous read-only workflow (FR-WF-PUBLIC-002)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ request, workflow }) => {
    const response = await apiRequestWithAccessToken(
      request,
      readPrimaryActorAccessToken(),
      'PATCH',
      `/api/workflow/${workflow.workflowUuid}/public-link`,
      { data: { enabled: true } },
    );
    expect(response.ok(), await response.text()).toBe(true);
  });

  test('anonymous viewer can switch among Overview, Workflow, and Outcomes without authenticated chrome', async ({
    page,
    workflow,
  }) => {
    const overviewPath = workflowOverviewPath(workflow.path);
    await page.goto(overviewPath);

    await expect(page).toHaveURL(new RegExp(`${overviewPath}/?$`));
    await expect(workflowTitle(page)).toBeVisible();
    await expect(workflowOverviewView(page)).toBeVisible();
    await expect(workflowViewTabSelector(page).getByRole('tab')).toHaveText([
      'Overview',
      'Workflow',
      'Outcomes',
    ]);
    await expect(mainNavigation(page)).toHaveCount(0);
    await expect(topNavigationBar(page)).toHaveCount(0);
    await expect(page.locator('[data-test-id="actions-bar"]')).toHaveCount(0);
    await expect(workflowRightSidebar(page)).toHaveCount(0);
    await expect(workflowHeaderFavouriteToggle(page)).toHaveCount(0);
    await expect(workflowMetadataPermissionsPanel(page)).toHaveCount(0);
    await expect(workflowGeneratePublicLinkButton(page)).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /export/i })).toHaveCount(0);

    await workflowGraphTab(page).click();
    await expect(page).toHaveURL(new RegExp(`${workflow.path}/?$`));
    await expect(workflowView(page)).toBeVisible();
    await expect(sectionContainers(page).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(workflowRightSidebar(page)).toHaveCount(0);

    await workflowOutcomesTab(page).click();
    await expect(page).toHaveURL(new RegExp(`${workflowOutcomesPath(workflow.path)}/?$`));
    await expect(workflowOutcomeView(page)).toBeVisible();
    await expect(workflowRightSidebar(page)).toHaveCount(0);

    await workflowOverviewTab(page).click();
    await expect(page).toHaveURL(new RegExp(`${overviewPath}/?$`));
    await expect(workflowOverviewView(page)).toBeVisible();
  });

  test('revocation prevents the anonymous page from rendering workflow content immediately', async ({
    page,
    request,
    workflow,
  }) => {
    const revoke = await apiRequestWithAccessToken(
      request,
      readPrimaryActorAccessToken(),
      'PATCH',
      `/api/workflow/${workflow.workflowUuid}/public-link`,
      { data: { enabled: false } },
    );
    expect(revoke.ok(), await revoke.text()).toBe(true);

    await page.goto(workflowOverviewPath(workflow.path));

    await expect(workflowTitle(page)).toHaveCount(0);
    await expect(workflowOverviewView(page)).toHaveCount(0);
    await expect(page).not.toHaveURL(/\/login\/?(?:[?#].*)?$/);
  });

  test('anonymous viewer can open the Workflow and Outcomes sub-view URLs directly', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    await expect(workflowView(page)).toBeVisible();
    await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });
    await expect(mainNavigation(page)).toHaveCount(0);

    const outcomesPath = workflowOutcomesPath(workflow.path);
    await page.goto(outcomesPath);
    await expect(page).toHaveURL(new RegExp(`${outcomesPath}/?$`));
    await expect(workflowOutcomeView(page)).toBeVisible();
    await expect(mainNavigation(page)).toHaveCount(0);
  });
});
