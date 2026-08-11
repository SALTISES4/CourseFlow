import { test, expect } from '../../fixtures';
import { workflowOverviewPath, workflowOutcomesPath } from '../../helpers/workflow-navigation';
import { loginAsWorkflowContributor } from './role.helpers';
import {
  editSectionForm,
  sectionHeader,
} from './edit-section.locators';
import {
  workflowGraphTab,
  workflowOverviewTab,
  workflowOutcomesTab,
} from './workflow.locators';
import {
  workflowRightSidebar,
  workflowRightSidebarAddTab,
  workflowRightSidebarAddTabContent,
  workflowRightSidebarCommentsTab,
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
  workflowRightSidebarOutcomesTab,
  workflowRightSidebarOutcomesTabContent,
  workflowRightSidebarTabStrip,
  workflowRightSidebarToggleButton,
} from '../../shared/locators/workflow';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'read-only',
});

/**
 * Right sidebar shell — FR-WF-RS-001 through FR-WF-RS-004 (partial).
 * Requirements: workflow_right_sidebar_requirements_v1.yaml
 */

async function expectSidebarCollapsed(page: import('@playwright/test').Page) {
  await expect(workflowRightSidebar(page)).toBeVisible();
  await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
}

async function expectNoSidebarTabSelected(page: import('@playwright/test').Page) {
  const strip = workflowRightSidebarTabStrip(page);
  const tabLabels = ['edit tab', 'add tab', 'outcomes tab', 'comments tab', 'related tab'];

  for (const label of tabLabels) {
    const tab = strip.getByRole('button', { name: label });
    if ((await tab.count()) === 0) {
      continue;
    }
    await expect(tab).not.toHaveAttribute('aria-pressed', 'true');
  }
}

test.describe('Right sidebar — visibility and collapse (FR-WF-RS-001)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionHeader(page, workflow.firstSection().uuid)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-WF-RS-001: graph route renders workflowRightSidebar collapsed with tab strip only', async ({
    page,
  }) => {
    await expect(workflowRightSidebar(page)).toBeVisible();
    await expect(workflowRightSidebarTabStrip(page)).toBeVisible();
    await expectSidebarCollapsed(page);
    await expectNoSidebarTabSelected(page);
  });

  test('FR-WF-RS-001: section selection expands workflowRightSidebar on workflowRightSidebarEditTab', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;

    await sectionHeader(page, sectionUuid).click();

    await expect(workflowRightSidebarContentPanel(page)).toBeVisible();
    await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(editSectionForm(page)).toBeVisible();
  });

  test('FR-WF-RS-001: workflowRightSidebarToggleButton collapses expanded sidebar', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;

    await sectionHeader(page, sectionUuid).click();
    await expect(workflowRightSidebarContentPanel(page)).toBeVisible();

    await workflowRightSidebarToggleButton(page).click();
    await expectSidebarCollapsed(page);
  });

  test('FR-WF-RS-001: clicking a tab icon while collapsed expands workflowRightSidebar', async ({
    page,
  }) => {
    await expectSidebarCollapsed(page);

    await workflowRightSidebarAddTab(page).click();

    await expect(workflowRightSidebarContentPanel(page)).toBeVisible();
    await expect(workflowRightSidebarAddTab(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowRightSidebarAddTabContent(page)).toBeVisible();
  });

  test('FR-WF-RS-001: Overview route does not render workflowRightSidebar', async ({
    page,
    workflow,
  }) => {
    await workflowOverviewTab(page).click();
    await expect(page).toHaveURL(new RegExp(`${workflowOverviewPath(workflow.path)}/?$`));
    await expect(workflowRightSidebar(page)).toHaveCount(0);
  });

  test('FR-WF-RS-001: sub-view navigation resets sidebar to collapsed default', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;

    await sectionHeader(page, sectionUuid).click();
    await expect(editSectionForm(page)).toBeVisible();

    await workflowOverviewTab(page).click();
    await workflowGraphTab(page).click();
    await expect(page).toHaveURL(new RegExp(`${workflow.path}/?$`));

    await expectSidebarCollapsed(page);
    await expect(editSectionForm(page)).toBeHidden();
    await expectNoSidebarTabSelected(page);
  });
});

test.describe('Right sidebar — tab strip (FR-WF-RS-002)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(workflowRightSidebar(page)).toBeVisible({ timeout: 15_000 });
  });

  test('FR-WF-RS-002: graph view tab strip order is Edit, Add, Outcomes, Comments', async ({
    page,
  }) => {
    const tabs = workflowRightSidebarTabStrip(page).getByRole('button');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toHaveAttribute('aria-label', 'edit tab');
    await expect(tabs.nth(1)).toHaveAttribute('aria-label', 'add tab');
    await expect(tabs.nth(2)).toHaveAttribute('aria-label', 'outcomes tab');
    await expect(tabs.nth(3)).toHaveAttribute('aria-label', 'comments tab');
  });

  test('FR-WF-RS-002: outcomes sub-view tab strip shows Edit and Comments tabs', async ({
    page,
    workflow,
  }) => {
    await workflowOutcomesTab(page).click();
    await expect(page).toHaveURL(new RegExp(`${workflowOutcomesPath(workflow.path)}/?$`));

    await expect(workflowRightSidebar(page)).toBeVisible();

    const tabs = workflowRightSidebarTabStrip(page).getByRole('button');
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(0)).toHaveAttribute('aria-label', 'edit tab');
    await expect(tabs.nth(1)).toHaveAttribute('aria-label', 'comments tab');
    await expect(workflowRightSidebarAddTab(page)).toHaveCount(0);
    await expect(workflowRightSidebarOutcomesTab(page)).toHaveCount(0);
  });
});

test.describe('Right sidebar — tab actionability (FR-WF-RS-003)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionHeader(page, workflow.firstSection().uuid)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-WF-RS-003: without selection Edit and Comments tabs are disabled; Add and Outcomes enabled for owner', async ({
    page,
  }) => {
    await expect(workflowRightSidebarEditTab(page)).toBeDisabled();
    await expect(workflowRightSidebarAddTab(page)).toBeEnabled();
    await expect(workflowRightSidebarOutcomesTab(page)).toBeEnabled();
    await expect(workflowRightSidebarCommentsTab(page)).toBeVisible();
    await expect(workflowRightSidebarCommentsTab(page)).toBeDisabled();
  });

  test('FR-WF-RS-003: section selection enables Edit and Comments tabs', async ({
    page,
    workflow,
  }) => {
    await sectionHeader(page, workflow.firstSection().uuid).click();

    await expect(workflowRightSidebarEditTab(page)).toBeEnabled();
    await expect(workflowRightSidebarCommentsTab(page)).toBeEnabled();
    await expect(editSectionForm(page)).toBeVisible();
  });

  test('FR-WF-RS-003: clicking enabled Outcomes tab shows workflowRightSidebarOutcomesTabContent', async ({
    page,
  }) => {
    await workflowRightSidebarOutcomesTab(page).click();

    await expect(workflowRightSidebarOutcomesTab(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowRightSidebarOutcomesTabContent(page)).toBeVisible();
  });
});

test.describe('Right sidebar — default presentation reset (FR-WF-RS-004)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionHeader(page, workflow.firstSection().uuid)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-WF-RS-004: deselecting section clears edit binding and returns to collapsed default', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;

    await sectionHeader(page, sectionUuid).click();
    await expect(editSectionForm(page)).toBeVisible();

    await sectionHeader(page, sectionUuid).click();

    await expect(editSectionForm(page)).toBeHidden();
    await expectSidebarCollapsed(page);
    await expect(workflowRightSidebarEditTab(page)).toBeDisabled();
    await expectNoSidebarTabSelected(page);
  });
});

test.describe('Right sidebar — role behavior (FR-WF-RS-003)', () => {
  test.describe('commenter', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-RS-003: commenter has Add tab disabled; Comments enabled after selection', async ({
      page,
      workflow,
    }) => {
      await loginAsWorkflowContributor(page, workflow, 'commenter');
      await page.goto(workflow.path);
      await expect(sectionHeader(page, workflow.firstSection().uuid)).toBeVisible({
        timeout: 15_000,
      });

      await expect(workflowRightSidebarAddTab(page)).toBeDisabled();
      await expect(workflowRightSidebarOutcomesTab(page)).toBeEnabled();
      await expect(workflowRightSidebarCommentsTab(page)).toBeDisabled();

      await sectionHeader(page, workflow.firstSection().uuid).click();
      await expect(workflowRightSidebarCommentsTab(page)).toBeEnabled();
      await expect(workflowRightSidebarAddTab(page)).toBeDisabled();
    });
  });

  test.describe('viewer', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-RS-003: viewer has Add and Comments tabs disabled', async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, 'viewer');
      await page.goto(workflow.path);
      await expect(sectionHeader(page, workflow.firstSection().uuid)).toBeVisible({
        timeout: 15_000,
      });

      await expect(workflowRightSidebarAddTab(page)).toBeDisabled();
      await expect(workflowRightSidebarCommentsTab(page)).toBeDisabled();

      await sectionHeader(page, workflow.firstSection().uuid).click();
      await expect(workflowRightSidebarCommentsTab(page)).toBeDisabled();
      await expect(workflowRightSidebarAddTab(page)).toBeDisabled();
      await expect(editSectionForm(page)).toBeVisible();
    });
  });
});
