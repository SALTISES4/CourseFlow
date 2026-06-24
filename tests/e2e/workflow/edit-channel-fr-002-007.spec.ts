import { test, expect } from '../../fixtures';
import {
  channelUuidByTitle,
  hoverWorkflowChannelHeader,
} from './comments-tab.helpers';
import {
  workflowChannelHeader,
  workflowChannelHeaderByTitle,
  workflowChannelHoverCommentsItem,
  workflowChannelHoverDeleteItem,
  workflowChannelHoverDuplicateItem,
  workflowChannelHoverInsertRightItem,
  workflowEditChannelForm,
  workflowEditChannelFormColorField,
  workflowEditChannelFormTitleField,
} from './workflow-graph.locators';

/**
 * Channel display, edit, and hover menu — FR-CHAN-002, FR-CHAN-003, FR-CHAN-007.
 * Requirements: workflow_edit_channel_requirements_v1.yaml
 */

const E2E_CHANNEL_A = 'E2E Channel A';
const E2E_CHANNEL_C = 'E2E Channel C';

test.describe('Edit channel — header display (FR-CHAN-002)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-CHAN-002: workflowChannelHeaderTitleText shows seeded channel title', async ({
    page,
  }) => {
    const header = workflowChannelHeaderByTitle(page, E2E_CHANNEL_A);
    await expect(header).toBeVisible();
    await expect(header).toContainText(E2E_CHANNEL_A);
  });
});

test.describe('Edit channel — title auto-save (FR-CHAN-003)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-CHAN-003: workflowEditChannelFormTitleField change updates workflowChannelHeaderTitleText', async ({
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

  test('FR-CHAN-003: workflowEditChannelFormColorField is rendered for owner', async ({
    page,
  }) => {
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);

    await workflowChannelHeader(page, channelUuid).click();
    await expect(workflowEditChannelFormColorField(page)).toBeVisible();
  });
});

test.describe('Edit channel — hover menu (FR-CHAN-007)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-CHAN-007: owner sees insert, duplicate, delete, and comments on channel hover', async ({
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
