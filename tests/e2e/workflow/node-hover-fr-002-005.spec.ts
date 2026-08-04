import { test, expect } from '../../fixtures';
import {
  assertNodeIsBelowSourceInSameColumn,
  findNodeBelowSourceInSection,
  firstNodeUuidInSection,
  setRowInsertMode,
  workflowNodeCount,
} from './add-tab.helpers';
import { hoverWorkflowNode } from './comments-tab.helpers';
import {
  workflowNode,
  workflowNodeHoverDuplicateItem,
  workflowNodeHoverInsertBelowItem,
} from './workflow-graph.locators';

test.use({ seedAsset: 'workflow.standard_activity', actorAsset: 'actor.teacher', seedAccess: 'disposable-copy' });

/**
 * Node hover actions — FR-WF-DUP-002, FR-WF-DUP-003, FR-WF-NODE-005.
 * Requirements: workflow_duplicate_node_requirements_v1.yaml, workflow_node_visual_requirements_v1.yaml
 */

test.describe('Node hover — insert and duplicate (FR-WF-NODE-005, FR-WF-DUP-002, FR-WF-DUP-003)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await setRowInsertMode(page);
  });

  test('FR-WF-NODE-005: Insert node below adds blank workflowNode in Row mode', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.sectionByTitle('E2E Section 3').uuid;
    const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);
    const beforeCount = await workflowNodeCount(page);

    await hoverWorkflowNode(page, sourceUuid);
    await workflowNodeHoverInsertBelowItem(page, sourceUuid).click();

    await expect
      .poll(async () => workflowNodeCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
  });

  test('FR-WF-DUP-002: Duplicate node below adds workflowNode in Row mode', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.sectionByTitle('E2E Section 3').uuid;
    const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);
    const beforeCount = await workflowNodeCount(page);

    await hoverWorkflowNode(page, sourceUuid);
    await workflowNodeHoverDuplicateItem(page, sourceUuid).click();

    await expect
      .poll(async () => workflowNodeCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
    await expect(workflowNode(page, sourceUuid)).toBeVisible();
  });

  test('FR-WF-DUP-003: Row duplicate places new workflowNode below source in same workflowChannel', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.sectionByTitle('E2E Section 3').uuid;
    const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);

    await hoverWorkflowNode(page, sourceUuid);
    await workflowNodeHoverDuplicateItem(page, sourceUuid).click();

    const duplicateUuid = await findNodeBelowSourceInSection(page, sectionUuid, sourceUuid);
    await assertNodeIsBelowSourceInSameColumn(page, sourceUuid, duplicateUuid);
  });
});
