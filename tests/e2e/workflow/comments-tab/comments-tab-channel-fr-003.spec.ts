import { test, expect } from '../../../fixtures';
import { commentsTabInSidebar } from '../edit-section.locators';
import {
  channelUuidByTitle,
  openChannelCommentsViaHover,
  requireCommentsComposer,
} from '../comments-tab.helpers';
import {
  workflowEditChannelForm,
  workflowChannelHeader,
} from '../workflow-graph.locators';
import { workflowRightSidebarCommentsTabContent } from '../../../shared/locators/workflow';

/**
 * Channel comments entry paths — FR-WF-COMMENTS-003.
 * Requirements: workflow_comments_tab_requirements_v1.yaml
 * Fixture channels: E2E Channel A/B/C (course_flow/e2e_seed/constants.py)
 */

const E2E_CHANNEL_A = 'E2E Channel A';

test.describe('Comments tab — workflowChannel host (FR-WF-COMMENTS-003)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-COMMENTS-003: hover comments opens workflowRightSidebarCommentsTab for workflowChannel', async ({
    page,
  }) => {
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);

    await openChannelCommentsViaHover(page, channelUuid);
    await requireCommentsComposer(page);
  });

  test('FR-WF-COMMENTS-003: comments tab after channel selection binds workflowRightSidebarCommentsTabContent', async ({
    page,
  }) => {
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);

    await workflowChannelHeader(page, channelUuid).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();
    await commentsTabInSidebar(page).click();

    await expect(commentsTabInSidebar(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowRightSidebarCommentsTabContent(page)).toBeVisible();
    await requireCommentsComposer(page);
  });
});
