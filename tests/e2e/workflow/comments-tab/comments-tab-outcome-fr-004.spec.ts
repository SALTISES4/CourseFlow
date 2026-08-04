import { test, expect } from '../../../fixtures';
import { commentsTabInSidebar } from '../edit-section.locators';
import {
  gotoOutcomesView,
  openOutcomeCommentsViaHover,
  requireCommentsComposer,
} from '../comments-tab.helpers';
import { workflowOutcomeHeader } from '../workflow-outcome.locators';
import { workflowRightSidebarCommentsTabContent } from '../../../shared/locators/workflow';

test.use({ seedAsset: 'workflow.standard_activity', actorAsset: 'actor.teacher', seedAccess: 'read-only' });

/**
 * Outcome comments entry paths — FR-WF-COMMENTS-004.
 * Requirements: workflow_comments_tab_requirements_v1.yaml
 * Fixture outcome: E2E Outcome 1 (course_flow/e2e_seed/constants.py)
 */

const E2E_OUTCOME_TITLE = 'E2E Outcome 1';

test.describe('Comments tab — workflowOutcome host (FR-WF-COMMENTS-004)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    workflow.firstOutcome();
    await gotoOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-WF-COMMENTS-004: hover comments opens workflowRightSidebarCommentsTab for workflowOutcome', async ({
    page,
  }) => {
    await openOutcomeCommentsViaHover(page, E2E_OUTCOME_TITLE);
    await requireCommentsComposer(page);
  });

  test('FR-WF-COMMENTS-004: comments tab after outcome selection binds workflowRightSidebarCommentsTabContent', async ({
    page,
  }) => {
    await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();
    await commentsTabInSidebar(page).click();

    await expect(commentsTabInSidebar(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowRightSidebarCommentsTabContent(page)).toBeVisible();
    await requireCommentsComposer(page);
  });
});
