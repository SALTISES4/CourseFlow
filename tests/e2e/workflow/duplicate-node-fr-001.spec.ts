import { test, expect } from '../../fixtures';
import type { Page } from '@playwright/test';
import { authenticatedApiRequest } from '../../helpers/api';
import {
  firstNodeUuidInSection,
  setColumnInsertMode,
  setManualInsertMode,
  setRowInsertMode,
  workflowNodeCount,
} from './add-tab.helpers';
import { channelUuidByTitle, hoverWorkflowNode } from './comments-tab.helpers';
import {
  clickSidebarDuplicateButton,
  duplicateViaHoverAndWait,
  duplicateViaManualAndWait,
  expectColumnDuplicateEmptyCellPlacement,
  expectColumnDuplicateOccupiedChannelInsertsRow,
  expectColumnDuplicateOccupiedShiftToGap,
  expectDuplicateEdgeIntegrity,
  expectRowDuplicatePlacement,
  findNodeWithIncidentEdges,
  findSourceWithEmptyCellBelowInSameChannel,
  findSourceWithOccupiedCellBelowAndGapInChannel,
  findSourceWithNodesBelowInSection,
  findSourceWithOccupiedCellBelowAndNoGapInChannel,
} from './duplicate-node.helpers';
import { patchNodeMetaViaApi } from './node-visual.helpers';
import { loginAsWorkflowContributor } from './role.helpers';
import {
  fetchGraphView,
  findNodeInSectionChannelAtRow,
  nodeByUuid,
  type GraphViewPayload,
  workflowUuidFromPath,
} from './workflow-graph.helpers';
import {
  workflowNode,
  workflowNodeHoverDuplicateItem,
} from './workflow-graph.locators';
import {
  workflowManualPlacementDialog,
  workflowManualPlacementDialogColumnButton,
  workflowManualPlacementDialogRowButton,
} from './workflow-add-tab.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Duplicate node — FR-WF-DUP-001 through FR-WF-DUP-004.
 * Requirements: workflow_duplicate_node_requirements_v1.yaml
 *
 * Trigger paths (hover menu FR-WF-DUP-002, sidebar button FR-WF-DUP-001) share the same
 * placement and duplicate-result rules; sidebar FR-WF-DUP-001 tests fail until EditNode
 * wires workflowEditNodeFormDuplicateButton onClick.
 */

const disposableSectionTitle = 'E2E Section 3';
const E2E_CHANNEL_A = 'E2E Channel A';

async function deleteWorkflowNodeViaApi(page: Page, nodeUuid: string): Promise<void> {
  const response = await authenticatedApiRequest(page, 'DELETE', `/api/node/${nodeUuid}`);
  expect(response.ok()).toBeTruthy();
}

/** Remove bottom-most node in channel A of the blank section to expose an occupied+gap column case. */
async function prepareBlankSectionOccupiedGapColumnCase(
  page: Page,
  workflowUuid: string,
  sectionUuid: string,
): Promise<GraphViewPayload> {
  const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
  let before = await fetchGraphView(page, workflowUuid);
  const bottomNode = findNodeInSectionChannelAtRow(before, sectionUuid, channelUuid, 3);
  expect(bottomNode, 'Expected channel A row 3 node in blank section').toBeTruthy();
  await deleteWorkflowNodeViaApi(page, bottomNode!.uuid);
  before = await fetchGraphView(page, workflowUuid);
  return before;
}

test.describe('Duplicate node', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test.describe('Duplicate result (FR-WF-DUP-004)', () => {
    test.beforeEach(async ({ page }) => {
      await setRowInsertMode(page);
    });

    test('FR-WF-DUP-004: duplicate has no workflowEdges; source edge counts and graph edges unchanged', async ({
      page,
      workflow,
    }) => {
      const workflowUuid = workflowUuidFromPath(workflow.path);
      const before = await fetchGraphView(page, workflowUuid);
      const source = findNodeWithIncidentEdges(before);
      expect(
        source,
        'Expected a workflowNode with incident workflowEdges in seed graph',
      ).toBeTruthy();

      const { after, duplicateUuid } = await duplicateViaHoverAndWait(
        page,
        workflowUuid,
        source!.uuid,
        before,
      );
      expectDuplicateEdgeIntegrity(before, after, source!.uuid, duplicateUuid);
    });

    test('FR-WF-DUP-004: duplicate title appends (copy) when source has persisted title', async ({
      page,
      workflow,
    }) => {
      const sectionUuid = workflow.sectionByTitle(disposableSectionTitle).uuid;
      const workflowUuid = workflowUuidFromPath(workflow.path);
      const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);
      const sourceTitle = `E2E dup title ${Date.now()}`;

      await patchNodeMetaViaApi(page, sourceUuid, { title: sourceTitle });

      const before = await fetchGraphView(page, workflowUuid);
      expect(nodeByUuid(before, sourceUuid)?.title).toBe(sourceTitle);

      const { after, duplicateUuid } = await duplicateViaHoverAndWait(
        page,
        workflowUuid,
        sourceUuid,
        before,
      );
      expect(nodeByUuid(after, duplicateUuid)?.title).toBe(`${sourceTitle} (copy)`);
      expect(nodeByUuid(after, sourceUuid)?.title).toBe(sourceTitle);
    });
  });

  test.describe('Placement (FR-WF-DUP-003)', () => {
    test.describe('Row insert mode', () => {
      test.beforeEach(async ({ page }) => {
        await setRowInsertMode(page);
      });

      test('FR-WF-DUP-003: duplicate shifts all workflowChannels below source down one workflowSectionRow', async ({
        page,
        workflow,
      }) => {
        const sectionUuid = workflow.sectionByTitle(disposableSectionTitle).uuid;
        const workflowUuid = workflowUuidFromPath(workflow.path);
        const before = await fetchGraphView(page, workflowUuid);
        const source = findSourceWithNodesBelowInSection(before, sectionUuid);
        expect(
          source,
          `Expected a source workflowNode with nodes below in ${disposableSectionTitle}`,
        ).toBeTruthy();

        const { after, duplicateUuid } = await duplicateViaHoverAndWait(
          page,
          workflowUuid,
          source!.uuid,
          before,
        );
        expectRowDuplicatePlacement(before, after, sectionUuid, source!.uuid, duplicateUuid);
      });
    });

    test.describe('Column insert mode', () => {
      test.beforeEach(async ({ page }) => {
        await setColumnInsertMode(page);
      });

      test('FR-WF-DUP-003: duplicate into empty cell below source leaves other workflowNodes unchanged', async ({
        page,
        workflow,
      }) => {
        const sectionUuid = workflow.sectionByTitle(disposableSectionTitle).uuid;
        const workflowUuid = workflowUuidFromPath(workflow.path);
        const before = await fetchGraphView(page, workflowUuid);
        const source = findSourceWithEmptyCellBelowInSameChannel(before, sectionUuid);
        expect(
          source,
          `Expected a source workflowNode with an empty cell below in ${disposableSectionTitle}`,
        ).toBeTruthy();

        const { after, duplicateUuid } = await duplicateViaHoverAndWait(
          page,
          workflowUuid,
          source!.uuid,
          before,
        );
        expectColumnDuplicateEmptyCellPlacement(
          before,
          after,
          sectionUuid,
          source!.uuid,
          duplicateUuid,
        );
      });

      test('FR-WF-DUP-003: duplicate below occupied cell shifts channel nodes to first empty cell', async ({
        page,
        workflow,
      }) => {
        const sectionUuid = workflow.blankSection().uuid;
        const workflowUuid = workflowUuidFromPath(workflow.path);
        const before = await prepareBlankSectionOccupiedGapColumnCase(
          page,
          workflowUuid,
          sectionUuid,
        );
        const source = findSourceWithOccupiedCellBelowAndGapInChannel(before, sectionUuid);
        expect(
          source,
          'Expected a source workflowNode with occupied cell below and a gap further down in the same channel',
        ).toBeTruthy();

        const { after, duplicateUuid } = await duplicateViaHoverAndWait(
          page,
          workflowUuid,
          source!.uuid,
          before,
        );
        expectColumnDuplicateOccupiedShiftToGap(
          before,
          after,
          sectionUuid,
          source!.uuid,
          duplicateUuid,
        );
      });

      test('FR-WF-DUP-003: duplicate below occupied cell inserts row in source channel only', async ({
        page,
        workflow,
      }) => {
        const sectionUuid = workflow.sectionByTitle(disposableSectionTitle).uuid;
        const workflowUuid = workflowUuidFromPath(workflow.path);
        const before = await fetchGraphView(page, workflowUuid);
        const source = findSourceWithOccupiedCellBelowAndNoGapInChannel(before, sectionUuid);
        expect(
          source,
          `Expected a source workflowNode with occupied cell below and no channel gap in ${disposableSectionTitle}`,
        ).toBeTruthy();

        const { after, duplicateUuid } = await duplicateViaHoverAndWait(
          page,
          workflowUuid,
          source!.uuid,
          before,
        );
        expectColumnDuplicateOccupiedChannelInsertsRow(
          before,
          after,
          sectionUuid,
          source!.uuid,
          duplicateUuid,
        );
      });
    });

    test.describe('Manual insert mode', () => {
      test.beforeEach(async ({ page }) => {
        await setManualInsertMode(page);
      });

      test('FR-WF-DUP-003: row choice shifts all workflowChannels below source down one workflowSectionRow', async ({
        page,
        workflow,
      }) => {
        const sectionUuid = workflow.sectionByTitle(disposableSectionTitle).uuid;
        const workflowUuid = workflowUuidFromPath(workflow.path);
        const before = await fetchGraphView(page, workflowUuid);
        const source = findSourceWithNodesBelowInSection(before, sectionUuid);
        expect(
          source,
          `Expected a source workflowNode with nodes below in ${disposableSectionTitle}`,
        ).toBeTruthy();

        const { after, duplicateUuid } = await duplicateViaManualAndWait(
          page,
          workflowUuid,
          source!.uuid,
          before,
          'row',
        );
        expectRowDuplicatePlacement(before, after, sectionUuid, source!.uuid, duplicateUuid);
      });

      test('FR-WF-DUP-003: column choice into empty cell below source leaves other workflowNodes unchanged', async ({
        page,
        workflow,
      }) => {
        const sectionUuid = workflow.sectionByTitle(disposableSectionTitle).uuid;
        const workflowUuid = workflowUuidFromPath(workflow.path);
        const before = await fetchGraphView(page, workflowUuid);
        const source = findSourceWithEmptyCellBelowInSameChannel(before, sectionUuid);
        expect(
          source,
          `Expected a source workflowNode with an empty cell below in ${disposableSectionTitle}`,
        ).toBeTruthy();

        const { after, duplicateUuid } = await duplicateViaManualAndWait(
          page,
          workflowUuid,
          source!.uuid,
          before,
          'column',
        );
        expectColumnDuplicateEmptyCellPlacement(
          before,
          after,
          sectionUuid,
          source!.uuid,
          duplicateUuid,
        );
      });

      test('FR-WF-DUP-003: column choice below occupied cell shifts channel nodes to first empty cell', async ({
        page,
        workflow,
      }) => {
        const sectionUuid = workflow.blankSection().uuid;
        const workflowUuid = workflowUuidFromPath(workflow.path);
        const before = await prepareBlankSectionOccupiedGapColumnCase(
          page,
          workflowUuid,
          sectionUuid,
        );
        const source = findSourceWithOccupiedCellBelowAndGapInChannel(before, sectionUuid);
        expect(
          source,
          'Expected a source workflowNode with occupied cell below and a gap further down in the same channel',
        ).toBeTruthy();

        const { after, duplicateUuid } = await duplicateViaManualAndWait(
          page,
          workflowUuid,
          source!.uuid,
          before,
          'column',
        );
        expectColumnDuplicateOccupiedShiftToGap(
          before,
          after,
          sectionUuid,
          source!.uuid,
          duplicateUuid,
        );
      });

      test('FR-WF-DUP-003: column choice below occupied cell inserts row in source channel only', async ({
        page,
        workflow,
      }) => {
        const sectionUuid = workflow.sectionByTitle(disposableSectionTitle).uuid;
        const workflowUuid = workflowUuidFromPath(workflow.path);
        const before = await fetchGraphView(page, workflowUuid);
        const source = findSourceWithOccupiedCellBelowAndNoGapInChannel(before, sectionUuid);
        expect(
          source,
          `Expected a source workflowNode with occupied cell below and no channel gap in ${disposableSectionTitle}`,
        ).toBeTruthy();

        const { after, duplicateUuid } = await duplicateViaManualAndWait(
          page,
          workflowUuid,
          source!.uuid,
          before,
          'column',
        );
        expectColumnDuplicateOccupiedChannelInsertsRow(
          before,
          after,
          sectionUuid,
          source!.uuid,
          duplicateUuid,
        );
      });
    });
  });

  test.describe('Manual insert mode trigger (FR-WF-DUP-001, FR-WF-DUP-002)', () => {
    test.beforeEach(async ({ page }) => {
      await setManualInsertMode(page);
    });

    test('FR-WF-DUP-002: duplicate opens placement dialog without creating a node', async ({
      page,
      workflow,
    }) => {
      const sectionUuid = workflow.firstSection().uuid;
      const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);
      const beforeCount = await workflowNodeCount(page);

      await hoverWorkflowNode(page, sourceUuid);
      await workflowNodeHoverDuplicateItem(page, sourceUuid).click();

      await expect(workflowManualPlacementDialog(page)).toBeVisible();
      await expect(workflowManualPlacementDialogRowButton(page)).toHaveText('Insert row');
      await expect(workflowManualPlacementDialogColumnButton(page)).toHaveText(
        'Keep in same column',
      );
      expect(await workflowNodeCount(page)).toBe(beforeCount);
    });

    test('FR-WF-DUP-002: dismissing placement dialog cancels without creating a node', async ({
      page,
      workflow,
    }) => {
      const sectionUuid = workflow.firstSection().uuid;
      const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);
      const beforeCount = await workflowNodeCount(page);

      await hoverWorkflowNode(page, sourceUuid);
      await workflowNodeHoverDuplicateItem(page, sourceUuid).click();
      await expect(workflowManualPlacementDialog(page)).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(workflowManualPlacementDialog(page)).toBeHidden();
      expect(await workflowNodeCount(page)).toBe(beforeCount);
    });

    test('FR-WF-DUP-001: workflowEditNodeFormDuplicateButton opens placement dialog without creating a node', async ({
      page,
      workflow,
    }) => {
      const sectionUuid = workflow.firstSection().uuid;
      const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);
      const beforeCount = await workflowNodeCount(page);

      await clickSidebarDuplicateButton(page, sourceUuid);

      await expect(workflowManualPlacementDialog(page)).toBeVisible();
      await expect(workflowManualPlacementDialogRowButton(page)).toHaveText('Insert row');
      await expect(workflowManualPlacementDialogColumnButton(page)).toHaveText(
        'Keep in same column',
      );
      expect(await workflowNodeCount(page)).toBe(beforeCount);
    });

    test('FR-WF-DUP-001: dismissing sidebar duplicate placement dialog cancels without creating a node', async ({
      page,
      workflow,
    }) => {
      const sectionUuid = workflow.firstSection().uuid;
      const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);
      const beforeCount = await workflowNodeCount(page);

      await clickSidebarDuplicateButton(page, sourceUuid);
      await expect(workflowManualPlacementDialog(page)).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(workflowManualPlacementDialog(page)).toBeHidden();
      expect(await workflowNodeCount(page)).toBe(beforeCount);
    });
  });
});

test.describe('Duplicate node — permissions (FR-WF-DUP-002)', () => {
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

      await workflowNode(page, sourceUuid).hover();
      await expect(workflowNodeHoverDuplicateItem(page, sourceUuid)).toHaveCount(0);
    });
  });
});
