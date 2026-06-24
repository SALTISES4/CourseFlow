import { test, expect } from '../../fixtures';
import {
  commentsTabInSidebar,
  editSectionForm,
  sectionHeader,
  titleFieldInEditSectionForm,
} from './edit-section.locators';
import { openSectionCommentsViaHover, openNodeCommentsViaHover, openChannelCommentsViaHover, firstWorkflowNodeUuid, channelUuidByTitle } from './comments-tab.helpers';
import { workflowEditNodeForm, workflowEditChannelForm } from './workflow-graph.locators';
import { workflowRightSidebarEditTab } from '../../shared/locators/workflow';

/**
 * Comments host identity — FR-WF-COMMENTS-005.
 * Requirements: workflow_comments_tab_requirements_v1.yaml
 */

const E2E_CHANNEL_A = 'E2E Channel A';

test.describe('Comments tab — host matches Edit tab (FR-WF-COMMENTS-005)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionHeader(page, workflow.firstSection().uuid)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-WF-COMMENTS-005: Edit tab after section comments shows workflowEditSectionForm for same section', async ({
    page,
    workflow,
  }) => {
    const section = workflow.firstSection();

    await openSectionCommentsViaHover(page, section.uuid);
    await workflowRightSidebarEditTab(page).click();

    await expect(commentsTabInSidebar(page)).not.toHaveAttribute('aria-pressed', 'true');
    await expect(editSectionForm(page)).toBeVisible();
    await expect(titleFieldInEditSectionForm(page)).toHaveValue(section.title);
  });

  test('FR-WF-COMMENTS-005: Edit tab after node comments shows workflowEditNodeForm for same node', async ({
    page,
  }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await openNodeCommentsViaHover(page, nodeUuid);
    await workflowRightSidebarEditTab(page).click();

    await expect(commentsTabInSidebar(page)).not.toHaveAttribute('aria-pressed', 'true');
    await expect(workflowEditNodeForm(page)).toBeVisible();
  });

  test('FR-WF-COMMENTS-005: Edit tab after channel comments shows workflowEditChannelForm for same channel', async ({
    page,
  }) => {
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);

    await openChannelCommentsViaHover(page, channelUuid);
    await workflowRightSidebarEditTab(page).click();

    await expect(commentsTabInSidebar(page)).not.toHaveAttribute('aria-pressed', 'true');
    await expect(workflowEditChannelForm(page)).toBeVisible();
  });
});
