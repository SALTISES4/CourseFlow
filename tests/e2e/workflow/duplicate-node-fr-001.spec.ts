import { test, expect } from '../../fixtures';
import {
  firstNodeUuidInSection,
  lastNodeUuidInSection,
  workflowNodeCount,
} from './add-tab.helpers';
import { hoverWorkflowNode } from './comments-tab.helpers';
import { loginAsWorkflowContributor } from './role.helpers';
import {
  workflowNode,
  workflowNodeHoverDuplicateItem,
} from './workflow-graph.locators';
import { workflowRightSidebarAddTab } from '../../shared/locators/workflow';
import { workflowAddTabInsertModeRowButton } from './workflow-add-tab.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Duplicate node — FR-WF-DUP-001 (Row insert mode via hover; sidebar button not wired).
 * Requirements: workflow_duplicate_node_requirements_v1.yaml
 */

test.describe('Duplicate node — Row mode (FR-WF-DUP-001)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
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

  test.fixme(
    'FR-WF-DUP-001: workflowEditNodeFormDuplicateButton sidebar path deferred until EditNode wires onClick',
    async () => {},
  );
});

test.describe('Duplicate node — role behavior (FR-WF-DUP-002, FR-WF-NODE-005)', () => {
  test.describe('commenter', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-DUP-002: commenter sees disabled hover duplicate item', async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, 'commenter');
      await page.goto(workflow.path);

      const sectionUuid = workflow.firstSection().uuid;
      const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);
      const beforeCount = await workflowNodeCount(page);

      await hoverWorkflowNode(page, sourceUuid);
      await expect(workflowNodeHoverDuplicateItem(page, sourceUuid)).toBeDisabled();
      await workflowNodeHoverDuplicateItem(page, sourceUuid).click({ force: true });

      expect(await workflowNodeCount(page)).toBe(beforeCount);
    });
  });

  test.describe('viewer', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-DUP-002: viewer cannot reach hover duplicate item', async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, 'viewer');
      await page.goto(workflow.path);

      const sectionUuid = workflow.firstSection().uuid;
      const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);

      await hoverWorkflowNode(page, sourceUuid);
      await expect(workflowNodeHoverDuplicateItem(page, sourceUuid)).toHaveCount(0);
    });
  });
});
