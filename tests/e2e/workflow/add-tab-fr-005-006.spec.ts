import { test, expect } from '../../fixtures';
import { authenticatedApiRequest } from '../../helpers/api';
import { skipUnlessPristineWorkflow } from '../../helpers/workflow-pristine';
import {
  dragNodeCategoryOntoNode,
  workflowNodeCount,
  workflowNodeUuids,
} from './add-tab.helpers';
import {
  workflowAddTabInsertModeColumnButton,
  workflowAddTabInsertModeManualButton,
  workflowManualPlacementDialog,
  workflowManualPlacementDialogColumnButton,
  workflowManualPlacementDialogRowButton,
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
    const beforeNodeUuids = await workflowNodeUuids(page);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    let createdNodeUuid: string | undefined;

    try {
      await dragNodeCategoryOntoNode(page, E2E_CHANNEL_A, nodeUuid);

      await expect
        .poll(async () => workflowNodeCount(page), { timeout: 15_000 })
        .toBe(beforeCount + 1);

      const afterNodeUuids = await workflowNodeUuids(page);
      const createdNodeUuids = afterNodeUuids.filter(
        (uuid) => !beforeNodeUuids.includes(uuid),
      );
      expect(createdNodeUuids).toHaveLength(1);
      [createdNodeUuid] = createdNodeUuids;

      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditNodeForm(page)).toBeVisible();
    } finally {
      if (createdNodeUuid) {
        const response = await authenticatedApiRequest(
          page,
          'DELETE',
          `/api/node/${createdNodeUuid}`,
        );
        expect(response.ok()).toBeTruthy();
      }
    }
  });
});

test.describe('Add tab — manual insert mode (FR-WF-ADD-006)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await skipUnlessPristineWorkflow(page, workflow);
    await workflowRightSidebarAddTab(page).click();
    await workflowAddTabInsertModeManualButton(page).click();
  });

  test('FR-WF-ADD-006: manual drop defers creation until row placement is chosen', async ({
    page,
  }) => {
    const beforeCount = await workflowNodeCount(page);
    const beforeNodeUuids = await workflowNodeUuids(page);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    let createdNodeUuid: string | undefined;

    try {
      await dragNodeCategoryOntoNode(page, E2E_CHANNEL_A, nodeUuid);

      const manualDialog = workflowManualPlacementDialog(page);
      await expect(manualDialog).toBeVisible();
      await expect(manualDialog.getByRole('menuitem')).toHaveCount(2);
      await expect(workflowManualPlacementDialogRowButton(page)).toHaveText('Insert row');
      await expect(workflowManualPlacementDialogColumnButton(page)).toHaveText(
        'Keep in same column',
      );
      await expect.poll(async () => workflowNodeCount(page)).toBe(beforeCount);

      await workflowManualPlacementDialogRowButton(page).click();
      await expect
        .poll(async () => workflowNodeCount(page), { timeout: 15_000 })
        .toBe(beforeCount + 1);

      const afterNodeUuids = await workflowNodeUuids(page);
      const createdNodeUuids = afterNodeUuids.filter(
        (uuid) => !beforeNodeUuids.includes(uuid),
      );
      expect(createdNodeUuids).toHaveLength(1);
      [createdNodeUuid] = createdNodeUuids;

      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditNodeForm(page)).toBeVisible();
    } finally {
      if (createdNodeUuid) {
        const response = await authenticatedApiRequest(
          page,
          'DELETE',
          `/api/node/${createdNodeUuid}`,
        );
        expect(response.ok()).toBeTruthy();
      }
    }
  });
});
