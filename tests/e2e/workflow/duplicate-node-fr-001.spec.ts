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
  workflowNodeHoverDuplicateItem,
} from './workflow-graph.locators';
import { workflowRightSidebarAddTab } from '../../shared/locators/workflow';
import { workflowAddTabInsertModeRowButton } from './workflow-add-tab.locators';

/**
 * Duplicate node — FR-WF-DUP-001 (Row insert mode via hover; sidebar button not wired).
 * Requirements: workflow_duplicate_node_requirements_v1.yaml
 */

test.describe('Duplicate node — Row mode (FR-WF-DUP-001)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await skipUnlessPristineWorkflow(page, workflow);
  });

  test('FR-WF-DUP-001: Row mode duplicate adds workflowNode via hover menu', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;
    const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);
    const beforeCount = await workflowNodeCount(page);

    await workflowRightSidebarAddTab(page).click();
    await workflowAddTabInsertModeRowButton(page).click();

    await hoverWorkflowNode(page, sourceUuid);
    await workflowNodeHoverDuplicateItem(page, sourceUuid).click();

    await expect
      .poll(async () => workflowNodeCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
    await expect(workflowNode(page, sourceUuid)).toBeVisible();
  });

  test('FR-WF-DUP-001: workflowEditNodeFormDuplicateButton sidebar path deferred until EditNode wires onClick', async () => {
    test.skip(
      true,
      'EditNode sidebar Duplicate button has no onClick handler; hover path covered above.',
    );
  });
});
