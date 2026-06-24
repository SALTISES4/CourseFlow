import { test, expect } from '../../fixtures';
import { commentsTabInSidebar } from './edit-section.locators';
import {
  channelUuidByTitle,
  openSectionCommentsViaHover,
} from './comments-tab.helpers';
import {
  workflowEditChannelForm,
  workflowEditChannelFormTitleField,
  workflowChannelHeader,
} from './workflow-graph.locators';
import {
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
} from '../../shared/locators/workflow';

/**
 * Open edit channel form — FR-CHAN-001.
 * Requirements: workflow_edit_channel_requirements_v1.yaml
 * Fixture channels: E2E Channel A/B/C (course_flow/e2e_seed/constants.py)
 */

const E2E_CHANNEL_A = 'E2E Channel A';

test.describe('Edit channel — open workflowEditChannelForm (FR-CHAN-001)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-CHAN-001: click workflowChannelHeader expands sidebar on workflowRightSidebarEditTab', async ({
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

  test('FR-CHAN-001: channel header click from comments tab rebinds workflowEditChannelForm', async ({
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
