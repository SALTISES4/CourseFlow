import { test, expect } from '../../fixtures';
import { firstWorkflowNodeUuid } from './comments-tab.helpers';
import {
  workflowEditNodeForm,
  workflowEditNodeFormDeleteButton,
  workflowEditNodeFormDescriptionField,
  workflowEditNodeFormDuplicateButton,
  workflowEditNodeFormTagsField,
  workflowEditNodeFormTaskTypeField,
  workflowEditNodeFormTimeAmountField,
  workflowEditNodeFormTimeUnitField,
  workflowEditNodeFormTitleField,
  workflowNode,
  workflowNodeContent,
} from './workflow-graph.locators';

/**
 * Edit node fields and auto-save — FR-WF-EN-002 (activity), FR-WF-EN-007; FR-WF-EN-003 deferred.
 * Requirements: workflow_edit_node_requirements_v1.yaml
 */

test.describe('Edit node — activity field set (FR-WF-EN-002)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    await workflowNodeContent(page, nodeUuid).click();
    await expect(workflowEditNodeForm(page)).toBeVisible();
  });

  test('FR-WF-EN-002: activity workflowEditNodeForm renders core editable fields', async ({
    page,
  }) => {
    await expect(workflowEditNodeFormTitleField(page)).toBeVisible();
    await expect(workflowEditNodeFormDescriptionField(page)).toBeVisible();
    await expect(workflowEditNodeFormTaskTypeField(page)).toBeVisible();
    await expect(workflowEditNodeFormTimeAmountField(page)).toBeVisible();
    await expect(workflowEditNodeFormTimeUnitField(page)).toBeVisible();
    await expect(workflowEditNodeFormTagsField(page)).toBeVisible();
  });

  test('FR-WF-EN-002: activity workflowEditNodeForm shows Duplicate and Delete actions', async ({
    page,
  }) => {
    await expect(workflowEditNodeFormDuplicateButton(page)).toBeVisible();
    await expect(workflowEditNodeFormDeleteButton(page)).toBeVisible();
  });

  test('FR-WF-EN-003: course field set deferred until course workflow E2E fixture', async () => {
    test.skip(true, 'E2E fixture workflow_type is activity; FR-WF-EN-003 requires course workflow.');
  });
});

test.describe('Edit node — auto-save (FR-WF-EN-007)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-EN-007: title change persists without explicit save control', async ({ page }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);
    const uniqueTitle = `E2E Node ${Date.now()}`;

    await workflowNodeContent(page, nodeUuid).click();
    await expect(workflowEditNodeForm(page)).toBeVisible();

    await workflowEditNodeFormTitleField(page).fill(uniqueTitle);
    await page.waitForTimeout(500);

    await page.reload();
    await expect(workflowNode(page, nodeUuid)).toBeVisible({ timeout: 15_000 });
    await workflowNodeContent(page, nodeUuid).click();
    await expect(workflowEditNodeFormTitleField(page)).toHaveValue(uniqueTitle);
  });

  test('FR-WF-EN-007: workflowEditNodeForm does not show auto-save status indicator', async ({
    page,
  }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await workflowNodeContent(page, nodeUuid).click();
    await workflowEditNodeFormTitleField(page).fill(`E2E autosave ${Date.now()}`);

    await expect(page.getByText(/^Saving/i)).toHaveCount(0);
    await expect(page.getByText(/^Saved/i)).toHaveCount(0);
  });
});
