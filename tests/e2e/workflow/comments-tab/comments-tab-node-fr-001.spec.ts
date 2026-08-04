import { test, expect } from '../../../fixtures';
import { commentsTabInSidebar } from '../edit-section.locators';
import {
  firstWorkflowNodeUuid,
  openNodeCommentsViaHover,
  requireCommentsComposer,
} from '../comments-tab.helpers';
import {
  workflowEditNodeForm,
  workflowNodeContent,
} from '../workflow-graph.locators';
import { workflowRightSidebarCommentsTabContent } from '../../../shared/locators/workflow';

test.use({ seedAsset: 'workflow.standard_activity', actorAsset: 'actor.teacher', seedAccess: 'read-only' });

/**
 * Node comments entry paths — FR-WF-COMMENTS-001.
 * Requirements: workflow_comments_tab_requirements_v1.yaml
 */

test.describe('Comments tab — workflowNode host (FR-WF-COMMENTS-001)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-COMMENTS-001: hover comments opens workflowRightSidebarCommentsTab for workflowNode', async ({
    page,
  }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await openNodeCommentsViaHover(page, nodeUuid);
    await requireCommentsComposer(page);
  });

  test('FR-WF-COMMENTS-001: comments tab after node selection binds workflowRightSidebarCommentsTabContent', async ({
    page,
  }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await workflowNodeContent(page, nodeUuid).click();
    await expect(workflowEditNodeForm(page)).toBeVisible();
    await commentsTabInSidebar(page).click();

    await expect(commentsTabInSidebar(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowRightSidebarCommentsTabContent(page)).toBeVisible();
    await requireCommentsComposer(page);
  });
});
