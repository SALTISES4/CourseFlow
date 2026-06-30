import { test, expect } from '../../fixtures';
import { skipUnlessPristineWorkflow } from '../../helpers/workflow-pristine';
import {
  firstNodeUuidInSection,
  lastNodeUuidInSection,
  workflowNodeCount,
} from './add-tab.helpers';
import { hoverWorkflowNode } from './comments-tab.helpers';
import {
  workflowNode,
  workflowNodeHoverDeleteItem,
  workflowNodeHoverDuplicateItem,
} from './workflow-graph.locators';
import {
  workflowRightSidebarAddTab,
} from '../../shared/locators/workflow';
import { workflowAddTabInsertModeRowButton } from './workflow-add-tab.locators';

/**
 * Delete node — FR-WF-DEL-001 (sidebar deferred), FR-WF-DEL-002 (hover menu).
 * Requirements: workflow_delete_node_requirements_v1.yaml
 */

test.describe('Delete node — hover menu (FR-WF-DEL-002)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await skipUnlessPristineWorkflow(page, workflow);
  });

  test('FR-WF-DEL-002: hover delete removes disposable workflowNode immediately', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.blankSection().uuid;
    const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);
    const beforeCount = await workflowNodeCount(page);

    await workflowRightSidebarAddTab(page).click();
    await workflowAddTabInsertModeRowButton(page).click();

    await hoverWorkflowNode(page, sourceUuid);
    await workflowNodeHoverDuplicateItem(page, sourceUuid).click();
    await expect
      .poll(async () => workflowNodeCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);

    const disposableUuid = await lastNodeUuidInSection(page, sectionUuid);
    await hoverWorkflowNode(page, disposableUuid);
    await workflowNodeHoverDeleteItem(page, disposableUuid).click();

    await expect
      .poll(async () => workflowNodeCount(page), { timeout: 10_000 })
      .toBe(beforeCount);
    await expect(workflowNode(page, disposableUuid)).toHaveCount(0);
  });

  test('FR-WF-DEL-001: workflowEditNodeFormDeleteButton sidebar path deferred until EditNode wires onClick', async () => {
    test.skip(
      true,
      'EditNode sidebar Delete button has no onClick handler; hover path covered above.',
    );
  });
});
