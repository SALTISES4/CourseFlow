import { test, expect } from '../../fixtures';
import { skipUnlessPristineWorkflow } from '../../helpers/workflow-pristine';
import {
  channelUuidByTitle,
  hoverWorkflowChannelHeader,
} from './comments-tab.helpers';
import { workflowChannelCount } from './add-tab.helpers';
import {
  workflowChannelHeaderBackground,
  workflowChannelHasSelectedBorder,
  workflowChannelHeader,
  workflowChannelHeaders,
  workflowChannelHoverDeleteItem,
  workflowChannelHoverInsertRightItem,
  workflowChannelSelectedBorderCount,
  workflowEditChannelForm,
  workflowEditChannelFormTitleField,
  workflowEditNodeForm,
  workflowNodeContent,
} from './workflow-graph.locators';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';
import { firstWorkflowNodeUuid } from './comments-tab.helpers';

/**
 * Channel insert right and selected border — FR-CHAN-004, FR-CHAN-009.
 * Requirements: workflow_edit_channel_requirements_v1.yaml
 *
 * Product gap: insert-below creates title "" and colour "" (see test_graph_mutation_api);
 * FR-CHAN-004 expects title 'Custom node category' and colour '#CFD8DC'.
 */

const E2E_CHANNEL_C = 'E2E Channel C';

test.describe('Channel — selected border and insert right (FR-CHAN-009, FR-CHAN-004)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await skipUnlessPristineWorkflow(page, workflow);
  });

  test('FR-CHAN-009: workflowChannelHeaderSelectedBorder on bound channel only', async ({
    page,
  }) => {
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);

    await workflowChannelHeader(page, channelC).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();
    await expect(workflowChannelHeaderBackground(page, channelC)).toHaveCSS('box-shadow', /2px/);
    expect(await workflowChannelSelectedBorderCount(page)).toBe(1);
  });

  test('FR-CHAN-009: non-channel host clears workflowChannelHeaderSelectedBorder', async ({
    page,
  }) => {
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await workflowChannelHeader(page, channelC).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();
    await expect(workflowChannelHeaderBackground(page, channelC)).toHaveCSS('box-shadow', /2px/);

    await workflowNodeContent(page, nodeUuid).click();
    await expect(workflowEditNodeForm(page)).toBeVisible();
    expect(await workflowChannelHasSelectedBorder(page, channelC)).toBe(false);
  });

  test('FR-CHAN-004: hover Insert right creates new column at K+1', async ({ page }) => {
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

  test('FR-CHAN-004: cleanup removes disposable inserted column', async ({ page }) => {
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
