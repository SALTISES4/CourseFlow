import { test, expect } from '../../fixtures';
import {
  firstWorkflowNodeUuid,
  secondWorkflowNodeUuid,
} from './comments-tab.helpers';
import {
  workflowEditNodeForm,
  workflowEditNodeFormContextField,
  workflowEditNodeFormTitleField,
  workflowNodeContent,
} from './workflow-graph.locators';
import {
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
} from '../../shared/locators/workflow';

/**
 * Open edit node form — FR-WF-EN-001 (partial FR-WF-EN-002 activity fields).
 * Requirements: workflow_edit_node_requirements_v1.yaml
 */

test.describe('Edit node — open workflowEditNodeForm (FR-WF-EN-001)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-EN-001: click workflowNode expands sidebar on workflowRightSidebarEditTab', async ({
    page,
  }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await expect(workflowRightSidebarContentPanel(page)).toBeHidden();

    await workflowNodeContent(page, nodeUuid).click();

    await expect(workflowRightSidebarContentPanel(page)).toBeVisible();
    await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowEditNodeForm(page)).toBeVisible();
  });

  test('FR-WF-EN-001: click second workflowNode rebinds workflowEditNodeForm', async ({
    page,
  }) => {
    const firstUuid = await firstWorkflowNodeUuid(page);
    const secondUuid = await secondWorkflowNodeUuid(page);

    await workflowNodeContent(page, firstUuid).click();
    await expect(workflowEditNodeForm(page)).toBeVisible();

    await workflowNodeContent(page, secondUuid).click();

    await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowEditNodeForm(page)).toBeVisible();
  });

  test('FR-WF-EN-002: activity workflowEditNodeForm shows Title and Context fields', async ({
    page,
  }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await workflowNodeContent(page, nodeUuid).click();
    await expect(workflowEditNodeForm(page)).toBeVisible();

    await expect(workflowEditNodeFormTitleField(page)).toBeVisible();
    await expect(workflowEditNodeFormContextField(page)).toBeVisible();
  });
});
