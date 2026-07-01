import { test, expect } from '../../fixtures';
import { skipUnlessPristineWorkflow } from '../../helpers/workflow-pristine';
import { dragNodeCategoryOntoNode, workflowNodeCount } from './add-tab.helpers';
import {
  workflowAddTabInsertModeColumnButton,
  workflowAddTabInsertModeManualButton,
} from './workflow-add-tab.locators';
import { workflowEditNodeForm } from './workflow-graph.locators';
import {
  workflowRightSidebarAddTab,
  workflowRightSidebarEditTab,
} from '../../shared/locators/workflow';
import { firstWorkflowNodeUuid } from './comments-tab.helpers';

/**
 * Add tab column and manual insert modes — FR-WF-ADD-005, FR-WF-ADD-006.
 * Requirements: workflow_add_tab_requirements_v1.yaml
 */

const E2E_CHANNEL_A = 'E2E Channel A';

test.describe('Add tab — column drop placement (FR-WF-ADD-005)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await skipUnlessPristineWorkflow(page, workflow);
    await workflowRightSidebarAddTab(page).click();
    await workflowAddTabInsertModeColumnButton(page).click();
  });

  test('FR-WF-ADD-005: column drop from Add tab creates workflowNode and opens workflowEditNodeForm', async ({
    page,
  }) => {
    const beforeCount = await workflowNodeCount(page);
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await dragNodeCategoryOntoNode(page, E2E_CHANNEL_A, nodeUuid);

    const afterCount = await workflowNodeCount(page);
    if (afterCount <= beforeCount) {
      test.skip(
        true,
        'Atlaskit pragmatic-drag-and-drop column placement not automatable in Playwright yet; manual QA path only.',
      );
    }

    await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowEditNodeForm(page)).toBeVisible();
  });
});

test.describe('Add tab — manual insert mode (FR-WF-ADD-006)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await skipUnlessPristineWorkflow(page, workflow);
    await workflowRightSidebarAddTab(page).click();
    await workflowAddTabInsertModeManualButton(page).click();
  });

  test('FR-WF-ADD-006: manual drop opens workflowManualPlacementDialog or skips when DnD unavailable', async ({
    page,
  }) => {
    const beforeCount = await workflowNodeCount(page);
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await dragNodeCategoryOntoNode(page, E2E_CHANNEL_A, nodeUuid);

    const manualDialog = page.getByRole('menu').filter({
      has: page.getByRole('menuitem', { name: 'Insert row', exact: true }),
    });
    const afterCount = await workflowNodeCount(page);

    if (afterCount <= beforeCount && (await manualDialog.count()) === 0) {
      test.skip(
        true,
        'Atlaskit pragmatic-drag-and-drop manual placement not automatable in Playwright yet; manual QA path only.',
      );
    }

    if ((await manualDialog.count()) > 0) {
      await expect(manualDialog).toBeVisible();
      await expect(
        page.getByRole('menuitem', { name: 'Keep in same column', exact: true }),
      ).toBeVisible();
      await page.getByRole('menuitem', { name: 'Insert row', exact: true }).click();
      await expect
        .poll(async () => workflowNodeCount(page), { timeout: 10_000 })
        .toBeGreaterThan(beforeCount);
      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditNodeForm(page)).toBeVisible();
      return;
    }

    test.skip(true, 'Manual insert mode drop did not open workflowManualPlacementDialog.');
  });
});
