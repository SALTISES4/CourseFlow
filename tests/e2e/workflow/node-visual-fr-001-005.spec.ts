import { test, expect } from '../../fixtures';
import {
  firstWorkflowNodeUuid,
  hoverWorkflowNode,
  secondWorkflowNodeUuid,
} from './comments-tab.helpers';
import {
  workflowEditNodeForm,
  workflowNode,
  workflowNodeBorder,
  workflowNodeContent,
  workflowNodeHasSelectedBorder,
  workflowNodeHoverCommentsItem,
  workflowNodeHoverDeleteItem,
  workflowNodeHoverDuplicateItem,
  workflowNodeHoverInsertBelowItem,
} from './workflow-graph.locators';

/**
 * Workflow node visual — FR-WF-NODE-001 through FR-WF-NODE-005 (partial).
 * Requirements: workflow_node_visual_requirements_v1.yaml
 */

test.describe('Workflow node — static structure (FR-WF-NODE-001)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-NODE-001: workflowNode renders color band, title, and debug row label', async ({
    page,
  }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);
    const node = workflowNode(page, nodeUuid);

    await expect(node).toBeVisible();
    await expect(workflowNodeContent(page, nodeUuid)).toBeVisible();
    await expect(node.getByText(new RegExp(`#${nodeUuid}`))).toBeVisible();
    const borderHeight = await workflowNodeBorder(page, nodeUuid).evaluate((el) => el.getBoundingClientRect().height);
    expect(borderHeight).toBeGreaterThan(0);
  });
});

test.describe('Workflow node — selected border (FR-WF-NODE-002)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-NODE-002: bound workflowNode shows workflowNodeSelectedBorder exclusively', async ({
    page,
  }) => {
    const firstUuid = await firstWorkflowNodeUuid(page);
    const secondUuid = await secondWorkflowNodeUuid(page);

    await workflowNodeContent(page, firstUuid).click();
    await expect(workflowEditNodeForm(page)).toBeVisible();

    expect(await workflowNodeHasSelectedBorder(page, firstUuid)).toBe(true);
    expect(await workflowNodeHasSelectedBorder(page, secondUuid)).toBe(false);
  });
});

test.describe('Workflow node — outcome highlight (FR-WF-NODE-003)', () => {
  test('FR-WF-NODE-003: workflowNodeOutcomeHighlightBorder deferred until outcome assign fixture', async () => {
    test.skip(
      true,
      'Outcome highlight requires FR-WF-AO-005 assignment path and highlighted node in E2E fixture.',
    );
  });
});

test.describe('Workflow node — hover menu visibility (FR-WF-NODE-004)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-NODE-004: pointer hover shows workflowNodeHoverActionsMenu on one node only', async ({
    page,
  }) => {
    const firstUuid = await firstWorkflowNodeUuid(page);
    const secondUuid = await secondWorkflowNodeUuid(page);

    await hoverWorkflowNode(page, firstUuid);
    await expect(workflowNodeHoverCommentsItem(page, firstUuid)).toBeVisible();
    await expect(workflowNodeHoverCommentsItem(page, secondUuid)).toHaveCount(0);

    await page.mouse.move(0, 0);
    await expect(workflowNodeHoverCommentsItem(page, firstUuid)).toHaveCount(0);
  });
});

test.describe('Workflow node — hover menu composition (FR-WF-NODE-005)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-NODE-005: owner sees insert, duplicate, delete, and comments hover items', async ({
    page,
  }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await hoverWorkflowNode(page, nodeUuid);

    await expect(workflowNodeHoverInsertBelowItem(page, nodeUuid)).toBeEnabled();
    await expect(workflowNodeHoverDuplicateItem(page, nodeUuid)).toBeEnabled();
    await expect(workflowNodeHoverDeleteItem(page, nodeUuid)).toBeEnabled();
    await expect(workflowNodeHoverCommentsItem(page, nodeUuid)).toBeEnabled();
  });

  test('FR-WF-NODE-005: at most one node hover menu visible in workflowView', async ({ page }) => {
    const firstUuid = await firstWorkflowNodeUuid(page);
    const secondUuid = await secondWorkflowNodeUuid(page);

    await hoverWorkflowNode(page, firstUuid);

    await expect(workflowNodeHoverCommentsItem(page, firstUuid)).toBeVisible();
    await expect(workflowNodeHoverCommentsItem(page, secondUuid)).toHaveCount(0);
  });
});
