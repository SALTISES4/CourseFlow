import { test, expect } from '../../fixtures';
import { skipUnlessPristineWorkflow } from '../../helpers/workflow-pristine';
import {
  channelUuidByTitle,
  hoverWorkflowChannelHeader,
} from './comments-tab.helpers';
import { workflowChannelCount } from './add-tab.helpers';
import {
  workflowChannelDeleteDialog,
  workflowChannelDeleteDialogCancelButton,
  workflowChannelDeleteDialogConfirmButton,
  workflowChannelHeader,
  workflowChannelHeaderByTitle,
  workflowChannelHoverDeleteItem,
  workflowChannelHoverDuplicateItem,
} from './workflow-graph.locators';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';

/**
 * Duplicate and delete channel — FR-CHAN-005, FR-CHAN-006 (hover menu paths).
 * Requirements: workflow_duplicate_channel_requirements_v1.yaml, workflow_delete_channel_requirements_v1.yaml
 */

const E2E_CHANNEL_A = 'E2E Channel A';
const E2E_CHANNEL_A_COPY = `${E2E_CHANNEL_A} (copy)`;
const E2E_CHANNEL_B = 'E2E Channel B';
const E2E_CHANNEL_B_COPY = `${E2E_CHANNEL_B} (copy)`;

test.describe('Duplicate channel — hover menu (FR-CHAN-005)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await skipUnlessPristineWorkflow(page, workflow);
  });

  test('FR-CHAN-005: hover duplicate creates workflowChannel with (copy) title immediately to the right', async ({
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

test.describe('Delete channel — hover menu (FR-CHAN-006)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await skipUnlessPristineWorkflow(page, workflow);
  });

  test('FR-CHAN-006: cancel keeps disposable duplicate channel in workflowChannelsHeaderRow', async ({
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

  test('FR-CHAN-006: confirm removes disposable duplicate channel from workflowChannelsHeaderRow', async ({
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
