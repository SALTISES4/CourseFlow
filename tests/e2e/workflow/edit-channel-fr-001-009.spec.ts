import { test, expect, type Page } from '../../fixtures';
import { authenticatedApiRequest } from '../../helpers/api';
import { skipUnlessPristineWorkflow } from '../../helpers/workflow-pristine';
import { commentsTabInSidebar } from './edit-section.locators';
import { workflowChannelCount } from './add-tab.helpers';
import {
  channelUuidByTitle,
  firstWorkflowNodeUuid,
  hoverWorkflowChannelHeader,
  openSectionCommentsViaHover,
} from './comments-tab.helpers';
import {
  workflowChannelHeaderColorIndicatorBackgroundColor,
  workflowNodeBorderBackgroundColor,
} from './node-visual.helpers';
import {
  workflowChannelDeleteDialog,
  workflowChannelDeleteDialogCancelButton,
  workflowChannelDeleteDialogConfirmButton,
  workflowChannelHeader,
  workflowChannelHeaderBackground,
  workflowChannelHeaderByTitle,
  workflowChannelHeaders,
  workflowChannelHasSelectedBorder,
  workflowChannelHoverCommentsItem,
  workflowChannelHoverDeleteItem,
  workflowChannelHoverDuplicateItem,
  workflowChannelHoverInsertRightItem,
  workflowChannelSelectedBorderCount,
  workflowEditChannelForm,
  workflowEditChannelFormColorField,
  workflowEditChannelFormTitleField,
  workflowEditNodeForm,
  workflowNode,
  workflowNodeContent,
} from './workflow-graph.locators';
import {
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
} from '../../shared/locators/workflow';

/**
 * Edit channel — FR-CHAN-001–007 and FR-CHAN-009.
 * Requirements: workflow_edit_channel_requirements_v1.yaml,
 *   workflow_duplicate_channel_requirements_v1.yaml (FR-CHAN-005),
 *   workflow_delete_channel_requirements_v1.yaml (FR-CHAN-006)
 * Fixture channels: E2E Channel A/B/C (course_flow/e2e_seed/constants.py)
 *
 * FR-CHAN-008 (lateral reorder) is not covered in this file.
 *
 * Product gap (FR-CHAN-004): insert creates blank title/colour; FR expects
 * 'Custom node category' and '#CFD8DC'.
 */

const E2E_CHANNEL_A = 'E2E Channel A';
const E2E_CHANNEL_A_COPY = `${E2E_CHANNEL_A} (copy)`;
const E2E_CHANNEL_B = 'E2E Channel B';
const E2E_CHANNEL_B_COPY = `${E2E_CHANNEL_B} (copy)`;
const E2E_CHANNEL_C = 'E2E Channel C';

/** Distinct from seeded channel colours so header/node updates are observable. */
const E2E_CHANNEL_COLOR_PATCH = '#E91E63';

function workflowUuidFromPath(path: string): string {
  const match = path.match(/\/workflow\/([^/]+)/);
  if (!match?.[1]) {
    throw new Error(`Cannot extract workflow UUID from path ${path}`);
  }
  return match[1];
}

function hexToRgbCss(hex: string): string {
  const normalized = hex.replace(/^#/, '');
  if (normalized.length !== 6) {
    throw new Error(`Expected 6-digit hex colour, got ${JSON.stringify(hex)}`);
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

async function nodeUuidsInChannel(page: Page, workflowUuid: string, channelUuid: string) {
  const response = await authenticatedApiRequest(page, 'GET', `/api/graph/${workflowUuid}/view`);
  expect(response.ok()).toBeTruthy();
  const graph = (await response.json()) as {
    nodes: Array<{ uuid: string; channelUuid: string | null }>;
  };
  return graph.nodes
    .filter((node) => node.channelUuid === channelUuid)
    .map((node) => node.uuid);
}

test.describe('Edit channel — FR-CHAN-001–007, FR-CHAN-009', () => {
  test.describe('FR-CHAN-001: open workflowEditChannelForm', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
    });

    test('click workflowChannelHeader expands sidebar on workflowRightSidebarEditTab', async ({
      page,
    }) => {
      const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);

      await expect(workflowRightSidebarContentPanel(page)).toBeHidden();

      await workflowChannelHeader(page, channelUuid).click();

      await expect(workflowRightSidebarContentPanel(page)).toBeVisible();
      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditChannelForm(page)).toBeVisible();
      await expect(workflowEditChannelFormTitleField(page)).toBeVisible();
    });

    test('channel header click from comments tab rebinds workflowEditChannelForm', async ({
      page,
      workflow,
    }) => {
      const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);

      await openSectionCommentsViaHover(page, workflow.firstSection().uuid);
      await expect(commentsTabInSidebar(page)).toHaveAttribute('aria-pressed', 'true');

      await workflowChannelHeader(page, channelUuid).click();

      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditChannelForm(page)).toBeVisible();
    });
  });

  test.describe('FR-CHAN-002: header display', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
    });

    test('workflowChannelHeaderTitleText shows seeded channel title', async ({ page }) => {
      const header = workflowChannelHeaderByTitle(page, E2E_CHANNEL_A);
      await expect(header).toBeVisible();
      await expect(header).toContainText(E2E_CHANNEL_A);
    });
  });

  test.describe('FR-CHAN-003: title and color auto-save', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
    });

    test('channel title field change updates channel header and nodes', async ({
      page,
    }) => {
      const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_C);
      const uniqueTitle = `E2E Ch ${Date.now()}`;

      await workflowChannelHeader(page, channelUuid).click();
      await expect(workflowEditChannelForm(page)).toBeVisible();

      await workflowEditChannelFormTitleField(page).fill(uniqueTitle);
      await page.waitForTimeout(500);

      await expect(workflowChannelHeader(page, channelUuid)).toContainText(uniqueTitle);
    });

    test('clearing title shows Untitled node category on header and blank Title field', async ({
      page,
    }) => {
      // Prefer Channel B — Channel C is mutated by the title-change test above.
      const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_B);
      const titleField = workflowEditChannelFormTitleField(page);

      await workflowChannelHeader(page, channelUuid).click();
      await expect(workflowEditChannelForm(page)).toBeVisible();

      const originalTitle = await titleField.inputValue();
      expect(originalTitle.length).toBeGreaterThan(0);

      try {
        await titleField.fill('');
        await titleField.blur();

        await expect(titleField).toHaveValue('', { timeout: 15_000 });
        await expect(workflowChannelHeader(page, channelUuid)).toContainText(
          'Untitled node category',
          { timeout: 15_000 },
        );
      } finally {
        await titleField.fill(originalTitle || E2E_CHANNEL_B);
        await titleField.blur();
        await expect(workflowChannelHeader(page, channelUuid)).toContainText(
          originalTitle || E2E_CHANNEL_B,
          { timeout: 15_000 },
        );
      }
    });

    test('color change updates channel header stripe and all node borders in that channel', async ({
      page,
      workflow,
    }) => {
      const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
      const workflowUuid = workflowUuidFromPath(workflow.path);
      const nodeUuids = await nodeUuidsInChannel(page, workflowUuid, channelUuid);
      expect(nodeUuids.length, 'Channel A must contain nodes to assert workflowNodeBorder').toBeGreaterThan(
        0,
      );

      await workflowChannelHeader(page, channelUuid).click();
      await expect(workflowEditChannelForm(page)).toBeVisible();

      // Color field is shown for all roles; owner/editor may edit it (FR-CHAN-003 roleBehavior).
      const colorField = workflowEditChannelFormColorField(page);
      await expect(colorField).toBeVisible();
      await expect(colorField).toBeEditable();

      const originalColor = await colorField.inputValue();
      const expectedRgb = hexToRgbCss(E2E_CHANNEL_COLOR_PATCH);

      try {
        await colorField.fill(E2E_CHANNEL_COLOR_PATCH);
        await expect(colorField).toHaveValue(E2E_CHANNEL_COLOR_PATCH);

        await expect
          .poll(
            async () => workflowChannelHeaderColorIndicatorBackgroundColor(page, channelUuid),
            { timeout: 10_000 },
          )
          .toBe(expectedRgb);

        for (const nodeUuid of nodeUuids) {
          await expect(workflowNode(page, nodeUuid)).toBeVisible();
          await expect
            .poll(async () => workflowNodeBorderBackgroundColor(page, nodeUuid), {
              timeout: 10_000,
            })
            .toBe(expectedRgb);
        }
      } finally {
        if (originalColor) {
          await colorField.fill(originalColor);
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('FR-CHAN-004: insert right', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await skipUnlessPristineWorkflow(page, workflow);
    });

    test('hover Insert right creates new column at K+1', async ({ page }) => {
      const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
      const beforeCount = await workflowChannelCount(page);
      const sidebarOpenBefore = await workflowEditChannelForm(page).isVisible();

      await hoverWorkflowChannelHeader(page, channelC);
      await workflowChannelHoverInsertRightItem(page, channelC).click();

      await expect
        .poll(async () => workflowChannelCount(page), { timeout: 10_000 })
        .toBe(beforeCount + 1);

      const headers = workflowChannelHeaders(page);
      let channelCIndex = -1;
      for (let i = 0; i < (await headers.count()); i += 1) {
        const uuid = await headers.nth(i).getAttribute('data-column-id');
        if (uuid === channelC) {
          channelCIndex = i;
          break;
        }
      }
      expect(channelCIndex).toBeGreaterThanOrEqual(0);

      const insertedHeader = headers.nth(channelCIndex + 1);
      const insertedUuid = await insertedHeader.getAttribute('data-column-id');
      expect(insertedUuid).toBeTruthy();
      expect(insertedUuid).not.toBe(channelC);

      expect(await workflowEditChannelForm(page).isVisible()).toBe(sidebarOpenBefore);

      await insertedHeader.click();
      await expect(workflowEditChannelForm(page)).toBeVisible();
      await expect(workflowRightSidebarContentPanel(page)).toBeVisible();
      // Product stores blank title until user edits; FR-CHAN-004 expects 'Custom node category'.
      await expect(workflowEditChannelFormTitleField(page)).toHaveValue('');
    });

    test('cleanup removes disposable inserted column', async ({ page }) => {
      const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
      const headers = workflowChannelHeaders(page);
      let channelCIndex = -1;
      for (let i = 0; i < (await headers.count()); i += 1) {
        const uuid = await headers.nth(i).getAttribute('data-column-id');
        if (uuid === channelC) {
          channelCIndex = i;
          break;
        }
      }
      const insertedUuid = await headers.nth(channelCIndex + 1).getAttribute('data-column-id');
      if (!insertedUuid) {
        test.skip(true, 'Insert-right column from prior test not found.');
      }

      const beforeCount = await workflowChannelCount(page);

      await hoverWorkflowChannelHeader(page, insertedUuid);
      await workflowChannelHoverDeleteItem(page, insertedUuid).click();
      await page.getByRole('button', { name: 'Delete node category', exact: true }).click();

      await expect
        .poll(async () => workflowChannelCount(page), { timeout: 10_000 })
        .toBe(beforeCount - 1);
      await expect(workflowChannelHeader(page, insertedUuid)).toHaveCount(0);
    });
  });

  test.describe('FR-CHAN-005: duplicate', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await skipUnlessPristineWorkflow(page, workflow);
    });

    test('hover duplicate creates workflowChannel with (copy) title immediately to the right', async ({
      page,
    }) => {
      const sourceUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
      const beforeCount = await workflowChannelCount(page);

      await hoverWorkflowChannelHeader(page, sourceUuid);
      await workflowChannelHoverDuplicateItem(page, sourceUuid).click();

      await expect
        .poll(async () => workflowChannelCount(page), { timeout: 10_000 })
        .toBeGreaterThanOrEqual(beforeCount + 1);
      await expect(workflowChannelHeaderByTitle(page, E2E_CHANNEL_A_COPY)).toBeVisible();
    });
  });

  test.describe('FR-CHAN-006: delete', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await skipUnlessPristineWorkflow(page, workflow);
    });

    test('cancel keeps disposable duplicate channel in workflowChannelsHeaderRow', async ({
      page,
    }) => {
      const sourceUuid = await channelUuidByTitle(page, E2E_CHANNEL_B);
      const beforeCount = await workflowChannelCount(page);

      await hoverWorkflowChannelHeader(page, sourceUuid);
      await workflowChannelHoverDuplicateItem(page, sourceUuid).click();
      await expect
        .poll(async () => workflowChannelCount(page), { timeout: 10_000 })
        .toBe(beforeCount + 1);

      const copyUuid = await channelUuidByTitle(page, E2E_CHANNEL_B_COPY);
      await hoverWorkflowChannelHeader(page, copyUuid);
      await workflowChannelHoverDeleteItem(page, copyUuid).click();

      await expect(workflowChannelDeleteDialog(page)).toBeVisible();
      await workflowChannelDeleteDialogCancelButton(page).click();

      await expect(workflowChannelDeleteDialog(page)).toHaveCount(0);
      await expect(workflowChannelHeader(page, copyUuid)).toBeVisible();
      await expect
        .poll(async () => workflowChannelCount(page))
        .toBe(beforeCount + 1);
    });

    test('confirm removes disposable duplicate channel from workflowChannelsHeaderRow', async ({
      page,
    }) => {
      const copyUuid = await channelUuidByTitle(page, E2E_CHANNEL_B_COPY);
      const beforeCount = await workflowChannelCount(page);

      await hoverWorkflowChannelHeader(page, copyUuid);
      await workflowChannelHoverDeleteItem(page, copyUuid).click();
      await expect(workflowChannelDeleteDialog(page)).toBeVisible();
      await workflowChannelDeleteDialogConfirmButton(page).click();

      await expect
        .poll(async () => workflowChannelCount(page), { timeout: 10_000 })
        .toBe(beforeCount - 1);
      await expect(workflowChannelHeaderByTitle(page, E2E_CHANNEL_B_COPY)).toHaveCount(0);
      await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
    });
  });

  test.describe('FR-CHAN-007: hover menu', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
    });

    test('owner and editors see insert, duplicate, delete, and comments on channel hover', async ({
      page,
    }) => {
      const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);

      await hoverWorkflowChannelHeader(page, channelUuid);

      await expect(workflowChannelHoverInsertRightItem(page, channelUuid)).toBeEnabled();
      await expect(workflowChannelHoverDuplicateItem(page, channelUuid)).toBeEnabled();
      await expect(workflowChannelHoverDeleteItem(page, channelUuid)).toBeEnabled();
      await expect(workflowChannelHoverCommentsItem(page, channelUuid)).toBeEnabled();
    });
  });

  test.describe('FR-CHAN-009: selected border', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await skipUnlessPristineWorkflow(page, workflow);
    });

    test('workflowChannelHeaderSelectedBorder on bound channel only', async ({ page }) => {
      const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);

      await workflowChannelHeader(page, channelC).click();
      await expect(workflowEditChannelForm(page)).toBeVisible();
      await expect(workflowChannelHeaderBackground(page, channelC)).toHaveCSS('box-shadow', /2px/);
      expect(await workflowChannelSelectedBorderCount(page)).toBe(1);
    });

    test('non-channel host clears workflowChannelHeaderSelectedBorder', async ({ page }) => {
      const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
      const nodeUuid = await firstWorkflowNodeUuid(page);

      await workflowChannelHeader(page, channelC).click();
      await expect(workflowEditChannelForm(page)).toBeVisible();
      await expect(workflowChannelHeaderBackground(page, channelC)).toHaveCSS('box-shadow', /2px/);

      await workflowNodeContent(page, nodeUuid).click();
      await expect(workflowEditNodeForm(page)).toBeVisible();
      expect(await workflowChannelHasSelectedBorder(page, channelC)).toBe(false);
    });
  });
});
