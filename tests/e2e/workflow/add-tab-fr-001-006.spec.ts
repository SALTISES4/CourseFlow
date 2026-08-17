import { test, expect } from '../../fixtures';
import { authenticatedApiRequest } from '../../helpers/api';
import {
  createBlankWorkflowFromHome,
  expectDefaultAddTabNodeCategories,
} from '../../helpers/create-workflow';
import { loadWorkflowManifest } from '../../helpers/manifest';
import { firstWorkflowNodeUuid, channelUuidByTitle } from './comments-tab.helpers';
import {
  addTabColumnDropBelowReferenceNodeAndWait,
  addTabCustomCategoryRowDropAndWait,
  addTabRowDropBelowReferenceNodeAndWait,
  dragNodeCategoryOntoNode,
  dragNodeCategoryOntoSection,
  expectCustomCategoryDropDefaults,
  expectCustomCategoryDropResult,
  workflowNodeCount,
  workflowNodeUuids,
} from './add-tab.helpers';
import {
  expectColumnInsertEmptyCellBelow,
  expectColumnInsertOccupiedChannelInsertsRow,
  expectColumnInsertOccupiedShiftToGap,
  expectRowInsertBelowReferenceNode,
  fetchGraphView,
  findNodeInSectionChannelAtRow,
  findSourceInChannelForColumnInsertBelow,
  findSourceWithNodesBelowInSection,
  workflowUuidFromPath,
} from './workflow-graph.helpers';
import {
  WORKFLOW_ADD_TAB_INSERT_MODE_HELP_TOOLTIP_COPY,
  workflowAddTabCustomNodeCategoryItem,
  workflowAddTabInsertModeColumnButton,
  workflowAddTabInsertModeGroup,
  workflowAddTabInsertModeHelpIcon,
  workflowAddTabInsertModeManualButton,
  workflowAddTabInsertModeRowButton,
  workflowAddTabNodeCategoriesGroup,
  workflowAddTabNodeCategoryItem,
  workflowAddTabNodeCategoryItems,
  workflowAddTabTitle,
  workflowManualPlacementDialog,
  workflowManualPlacementDialogColumnButton,
  workflowManualPlacementDialogRowButton,
} from './workflow-add-tab.locators';
import { workflowChannelHeader, workflowEditNodeForm } from './workflow-graph.locators';
import {
  workflowRightSidebarAddTab,
  workflowRightSidebarAddTabContent,
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
} from '../../shared/locators/workflow';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'project.recent_collection', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Add tab — FR-WF-ADD-001 through FR-WF-ADD-006.
 * Requirements: workflow_add_tab_requirements_v1.yaml
 */

const E2E_CHANNEL_A = 'E2E Channel A';
const disposableSectionTitle = 'E2E Section 3';

async function deleteWorkflowNodeViaApi(
  page: import('@playwright/test').Page,
  nodeUuid: string,
): Promise<void> {
  const response = await authenticatedApiRequest(page, 'DELETE', `/api/node/${nodeUuid}`);
  expect(response.ok()).toBeTruthy();
}

const BLANK_CREATE_WORKFLOW_TYPES = ['activity', 'course', 'program'] as const;

test.describe('add-tab-fr-001-006', () => {
  test.describe('Add tab — shell (FR-WF-ADD-001)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
    });

    test('FR-WF-ADD-001: workflowRightSidebarAddTab opens workflowRightSidebarAddTabContent', async ({
      page,
    }) => {
      await workflowRightSidebarAddTab(page).click();

      await expect(workflowRightSidebarContentPanel(page)).toBeVisible();
      await expect(workflowRightSidebarAddTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowAddTabTitle(page)).toBeVisible();
      await expect(workflowRightSidebarAddTabContent(page)).toBeVisible();
    });
  });

  test.describe('Add tab — insert mode (FR-WF-ADD-002)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await workflowRightSidebarAddTab(page).click();
      await expect(workflowAddTabTitle(page)).toBeVisible();
    });

    test('FR-WF-ADD-002: insert mode group renders Manual, Row, and Column toggles', async ({
      page,
    }) => {
      await expect(workflowAddTabInsertModeGroup(page)).toBeVisible();
      await expect(workflowAddTabInsertModeManualButton(page)).toBeVisible();
      await expect(workflowAddTabInsertModeRowButton(page)).toBeVisible();
      await expect(workflowAddTabInsertModeColumnButton(page)).toBeVisible();
    });

    test('FR-WF-ADD-002: selecting Row insert mode updates pressed toggle', async ({ page }) => {
      await workflowAddTabInsertModeRowButton(page).click();
      await expect(workflowAddTabInsertModeRowButton(page)).toHaveAttribute('aria-pressed', 'true');
    });

    test('FR-WF-ADD-002: selected insert mode is retained after reload', async ({
      page,
    }) => {
      await workflowAddTabInsertModeManualButton(page).click();
      await expect(workflowAddTabInsertModeManualButton(page)).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      await page.reload();
      await workflowRightSidebarAddTab(page).click();
      await expect(workflowAddTabInsertModeManualButton(page)).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    test('FR-WF-ADD-002: Insert mode help icon tooltip shows required copy on hover', async ({
      page,
    }) => {
      const helpIcon = workflowAddTabInsertModeHelpIcon(page);
      await expect(helpIcon).toBeVisible();
      await helpIcon.hover();
      await expect(page.getByRole('tooltip')).toHaveText(
        WORKFLOW_ADD_TAB_INSERT_MODE_HELP_TOOLTIP_COPY,
      );
    });
  });

  test.describe('Add tab — insert mode default after blank create (FR-WF-ADD-002)', () => {
    // FR: FR-WF-ADD-002 — default insert mode is Row after FR-WF-CREATE-STEPPER-005
    // Role: Owner/Editor (chromium storage state)

    test('FR-WF-ADD-002: newly created blank workflow defaults insert mode to Row', async ({
      page,
      workflowCleanup,
    }) => {
      const manifest = loadWorkflowManifest();
      const projectTitle = manifest.recent_projects[0]!.title;

      const createdWorkflowUuid = await createBlankWorkflowFromHome(page, {
        workflowType: 'activity',
        projectTitle,
        title: `E2E insert-mode default ${Date.now()}`,
      });
      workflowCleanup(createdWorkflowUuid);

      await workflowRightSidebarAddTab(page).click();
      await expect(workflowAddTabTitle(page)).toBeVisible();
      await expect(workflowAddTabInsertModeRowButton(page)).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
  });

  test.describe('Add tab — node category sources (FR-WF-ADD-003)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await workflowRightSidebarAddTab(page).click();
      await expect(workflowAddTabTitle(page)).toBeVisible();
    });

    test('FR-WF-ADD-003: node categories list includes fixture channels and custom item', async ({
      page,
    }) => {
      await expect(workflowAddTabNodeCategoriesGroup(page)).toBeVisible();
      await expect(workflowAddTabNodeCategoryItem(page, E2E_CHANNEL_A)).toBeVisible();
      await expect(workflowAddTabCustomNodeCategoryItem(page)).toBeVisible();
    });
  });

  test.describe('Add tab — default node categories after blank create (FR-WF-ADD-003)', () => {
    // FR: FR-WF-ADD-003 — default Add-tab categories after FR-WF-CREATE-STEPPER-005
    // Role: Owner/Editor (chromium storage state)

    for (const workflowType of BLANK_CREATE_WORKFLOW_TYPES) {
      test(`FR-WF-ADD-003: newly created blank ${workflowType} lists default node categories`, async ({
        page,
        workflowCleanup,
      }) => {
        const manifest = loadWorkflowManifest();
        const projectTitle = manifest.recent_projects[0]!.title;

        const createdWorkflowUuid = await createBlankWorkflowFromHome(page, {
          workflowType,
          projectTitle,
          title: `E2E add-tab defaults ${workflowType} ${Date.now()}`,
        });
        workflowCleanup(createdWorkflowUuid);

        await expectDefaultAddTabNodeCategories(page, workflowType);
      });
    }
  });

  test.describe('Add tab — row drop placement (FR-WF-ADD-004)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await workflowRightSidebarAddTab(page).click();
      await workflowAddTabInsertModeRowButton(page).click();
    });

    test('FR-WF-ADD-004: row drop from Add tab creates workflowNode and opens workflowEditNodeForm', async ({
      page,
      workflow,
    }) => {
      const beforeCount = await workflowNodeCount(page);
      const beforeNodeUuids = await workflowNodeUuids(page);
      const sectionUuid = workflow.blankSection().uuid;
      let createdNodeUuid: string | undefined;

      try {
        await dragNodeCategoryOntoSection(page, E2E_CHANNEL_A, sectionUuid);

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

    test('FR-WF-ADD-004: row drop below reference node shifts all workflowChannels down one workflowSectionRow', async ({
      page,
      workflow,
    }) => {
      const sectionUuid = workflow.sectionByTitle(disposableSectionTitle).uuid;
      const workflowUuid = workflowUuidFromPath(workflow.path);
      const before = await fetchGraphView(page, workflowUuid);
      const reference = findSourceWithNodesBelowInSection(before, sectionUuid);
      expect(
        reference,
        `Expected a reference workflowNode with nodes below in ${disposableSectionTitle}`,
      ).toBeTruthy();

      const targetChannelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
      const { after, newNodeUuid } = await addTabRowDropBelowReferenceNodeAndWait(
        page,
        E2E_CHANNEL_A,
        sectionUuid,
        reference!.uuid,
        workflowUuid,
        before,
      );

      expectRowInsertBelowReferenceNode(
        before,
        after,
        sectionUuid,
        reference!.uuid,
        newNodeUuid,
        targetChannelUuid,
      );
      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditNodeForm(page)).toBeVisible();
    });
  });

  test.describe('Add tab — custom node category drop (FR-WF-ADD-003, FR-WF-ADD-004)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await workflowRightSidebarAddTab(page).click();
      await workflowAddTabInsertModeRowButton(page).click();
    });

    test('FR-WF-ADD-003: custom category row drop adds rightmost workflowChannel, node, and Add-tab category row', async ({
      page,
      workflow,
    }) => {
      const sectionUuid = workflow.blankSection().uuid;
      const workflowUuid = workflowUuidFromPath(workflow.path);
      const before = await fetchGraphView(page, workflowUuid);
      const beforeCategoryCount = await workflowAddTabNodeCategoryItems(page).count();
      let createdNodeUuid: string | undefined;

      try {
        const { after, newNodeUuid, newChannelUuid } = await addTabCustomCategoryRowDropAndWait(
          page,
          sectionUuid,
          workflowUuid,
          before,
        );
        createdNodeUuid = newNodeUuid;

        expectCustomCategoryDropResult(
          before,
          after,
          sectionUuid,
          newNodeUuid,
          newChannelUuid,
        );

        await expect(workflowChannelHeader(page, newChannelUuid)).toBeVisible();
        await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
        await expect(workflowEditNodeForm(page)).toBeVisible();

        await workflowRightSidebarAddTab(page).click();
        await expect(workflowAddTabNodeCategoryItems(page)).toHaveCount(
          beforeCategoryCount + 1,
        );
        await expect(workflowAddTabNodeCategoryItems(page).last()).toHaveAttribute(
          'data-draggable-uuid',
          newChannelUuid,
        );
        await expect(workflowAddTabCustomNodeCategoryItem(page)).toBeVisible();
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

    test('FR-WF-ADD-003: custom category row drop uses default title and colour (FR-CHAN-004 parity)', async ({
      page,
      workflow,
    }) => {
      test.fail(
        true,
        'Add-tab custom-category drop creates channel with empty title instead of FR-CHAN-004 defaults',
      );

      const sectionUuid = workflow.blankSection().uuid;
      const workflowUuid = workflowUuidFromPath(workflow.path);
      const before = await fetchGraphView(page, workflowUuid);
      let createdNodeUuid: string | undefined;

      try {
        const { after, newNodeUuid, newChannelUuid } = await addTabCustomCategoryRowDropAndWait(
          page,
          sectionUuid,
          workflowUuid,
          before,
        );
        createdNodeUuid = newNodeUuid;

        await expectCustomCategoryDropDefaults(page, after, newChannelUuid);
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

  test.describe('Add tab — column drop placement (FR-WF-ADD-005)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
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

    test('FR-WF-ADD-005: column drop into empty cell below reference row leaves other workflowNodes unchanged', async ({
      page,
      workflow,
    }) => {
      test.fail(
        true,
        'Column add-tab drop on node lower half places new workflowNode one row below FR-WF-ADD-005 target cell',
      );

      const sectionUuid = workflow.blankSection().uuid;
      const workflowUuid = workflowUuidFromPath(workflow.path);
      const targetChannelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
      let before = await fetchGraphView(page, workflowUuid);
      const rowOneNode = findNodeInSectionChannelAtRow(before, sectionUuid, targetChannelUuid, 1);
      expect(rowOneNode, 'Expected channel A row 1 node in blank section').toBeTruthy();
      await deleteWorkflowNodeViaApi(page, rowOneNode!.uuid);
      before = await fetchGraphView(page, workflowUuid);

      const reference = findSourceInChannelForColumnInsertBelow(
        before,
        sectionUuid,
        targetChannelUuid,
        'empty-below',
      );
      expect(
        reference,
        'Expected a reference workflowNode with an empty target-channel cell below its row',
      ).toBeTruthy();
      expect(reference!.channelUuid).toBe(targetChannelUuid);

      const { after, newNodeUuid } = await addTabColumnDropBelowReferenceNodeAndWait(
        page,
        E2E_CHANNEL_A,
        reference!.uuid,
        workflowUuid,
        before,
      );
      expectColumnInsertEmptyCellBelow(
        before,
        after,
        sectionUuid,
        reference!.uuid,
        newNodeUuid,
        targetChannelUuid,
      );
      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditNodeForm(page)).toBeVisible();
    });

    test('FR-WF-ADD-005: column drop below occupied cell shifts target channel nodes to first empty cell', async ({
      page,
      workflow,
    }) => {
      test.fail(
        true,
        'Column add-tab drop on node lower half places new workflowNode one row below FR-WF-ADD-005 target cell',
      );

      const sectionUuid = workflow.blankSection().uuid;
      const workflowUuid = workflowUuidFromPath(workflow.path);
      const targetChannelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
      let before = await fetchGraphView(page, workflowUuid);
      const bottomNode = findNodeInSectionChannelAtRow(before, sectionUuid, targetChannelUuid, 3);
      expect(bottomNode, 'Expected channel A row 3 node in blank section').toBeTruthy();
      await deleteWorkflowNodeViaApi(page, bottomNode!.uuid);
      before = await fetchGraphView(page, workflowUuid);

      const reference = findSourceInChannelForColumnInsertBelow(
        before,
        sectionUuid,
        targetChannelUuid,
        'occupied-gap',
      );
      expect(
        reference,
        'Expected a reference workflowNode with occupied target-channel cell below and a gap further down',
      ).toBeTruthy();
      expect(reference!.channelUuid).toBe(targetChannelUuid);

      const { after, newNodeUuid } = await addTabColumnDropBelowReferenceNodeAndWait(
        page,
        E2E_CHANNEL_A,
        reference!.uuid,
        workflowUuid,
        before,
      );
      expectColumnInsertOccupiedShiftToGap(
        before,
        after,
        sectionUuid,
        reference!.uuid,
        newNodeUuid,
        targetChannelUuid,
      );
      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditNodeForm(page)).toBeVisible();
    });

    test('FR-WF-ADD-005: column drop below occupied cell inserts row in target channel only', async ({
      page,
      workflow,
    }) => {
      test.fail(
        true,
        'Column add-tab drop on node lower half places new workflowNode one row below FR-WF-ADD-005 target cell',
      );

      const sectionUuid = workflow.sectionByTitle(disposableSectionTitle).uuid;
      const workflowUuid = workflowUuidFromPath(workflow.path);
      const before = await fetchGraphView(page, workflowUuid);
      const targetChannelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
      const reference = findSourceInChannelForColumnInsertBelow(
        before,
        sectionUuid,
        targetChannelUuid,
        'occupied-no-gap',
      );
      expect(
        reference,
        `Expected a reference workflowNode with a full target channel below its row in ${disposableSectionTitle}`,
      ).toBeTruthy();
      expect(reference!.channelUuid).toBe(targetChannelUuid);

      const { after, newNodeUuid } = await addTabColumnDropBelowReferenceNodeAndWait(
        page,
        E2E_CHANNEL_A,
        reference!.uuid,
        workflowUuid,
        before,
      );
      expectColumnInsertOccupiedChannelInsertsRow(
        before,
        after,
        sectionUuid,
        reference!.uuid,
        newNodeUuid,
        targetChannelUuid,
      );
      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditNodeForm(page)).toBeVisible();
    });
  });

  test.describe('Add tab — manual insert mode (FR-WF-ADD-006)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
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
});
