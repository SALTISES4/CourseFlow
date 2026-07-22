import { test, expect } from '../../fixtures';
import { authenticatedApiRequest } from '../../helpers/api';
import {
  createBlankWorkflowFromHome,
  expectDefaultAddTabNodeCategories,
} from '../../helpers/create-workflow';
import { loadWorkflowManifest } from '../../helpers/manifest';
import { skipUnlessPristineWorkflow } from '../../helpers/workflow-pristine';
import { firstWorkflowNodeUuid } from './comments-tab.helpers';
import {
  dragNodeCategoryOntoNode,
  dragNodeCategoryOntoSection,
  workflowNodeCount,
  workflowNodeUuids,
} from './add-tab.helpers';
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
  workflowAddTabTitle,
  workflowManualPlacementDialog,
  workflowManualPlacementDialogColumnButton,
  workflowManualPlacementDialogRowButton,
} from './workflow-add-tab.locators';
import { workflowEditNodeForm } from './workflow-graph.locators';
import {
  workflowRightSidebarAddTab,
  workflowRightSidebarAddTabContent,
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
} from '../../shared/locators/workflow';

/**
 * Add tab — FR-WF-ADD-001 through FR-WF-ADD-006.
 * Requirements: workflow_add_tab_requirements_v1.yaml
 */

const E2E_CHANNEL_A = 'E2E Channel A';

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
    }) => {
      const manifest = loadWorkflowManifest();
      const projectTitle = manifest.recent_projects[0]!.title;

      await createBlankWorkflowFromHome(page, {
        workflowType: 'activity',
        projectTitle,
        title: `E2E insert-mode default ${Date.now()}`,
      });

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
      }) => {
        const manifest = loadWorkflowManifest();
        const projectTitle = manifest.recent_projects[0]!.title;

        await createBlankWorkflowFromHome(page, {
          workflowType,
          projectTitle,
          title: `E2E add-tab defaults ${workflowType} ${Date.now()}`,
        });

        await expectDefaultAddTabNodeCategories(page, workflowType);
      });
    }
  });

  test.describe('Add tab — row drop placement (FR-WF-ADD-004)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await skipUnlessPristineWorkflow(page, workflow);
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
  });

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
});
