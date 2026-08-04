import { test, expect } from '../../../fixtures';
import {
  commentsTabInSidebar,
  editSectionForm,
  sectionHeader,
  titleFieldInEditSectionForm,
} from '../edit-section.locators';
import { openSectionCommentsViaHover, openNodeCommentsViaHover, openChannelCommentsViaHover, openOutcomeCommentsViaHover, firstWorkflowNodeUuid, channelUuidByTitle, gotoOutcomesView } from '../comments-tab.helpers';
import { workflowEditNodeForm, workflowEditChannelForm } from '../workflow-graph.locators';
import {
  workflowEditOutcomeForm,
  workflowEditOutcomeFormTitleField,
  workflowOutcomeHeader,
} from '../workflow-outcome.locators';
import { workflowRightSidebarEditTab } from '../../../shared/locators/workflow';

test.use({ seedAsset: 'workflow.standard_activity', actorAsset: 'actor.teacher', seedAccess: 'read-only' });

/**
 * Comments host identity — FR-WF-COMMENTS-005.
 * Requirements: workflow_comments_tab_requirements_v1.yaml
 */

const E2E_CHANNEL_A = 'E2E Channel A';
const E2E_OUTCOME_TITLE = 'E2E Outcome 1';

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

  test('FR-WF-COMMENTS-005: Edit tab after outcome comments shows workflowEditOutcomeForm for same outcome', async ({
    page,
    workflow,
  }) => {
    await gotoOutcomesView(page, workflow.path);
    const outcome = workflow.firstOutcome();

    await openOutcomeCommentsViaHover(page, E2E_OUTCOME_TITLE);
    await workflowRightSidebarEditTab(page).click();

    await expect(commentsTabInSidebar(page)).not.toHaveAttribute('aria-pressed', 'true');
    await expect(workflowEditOutcomeForm(page)).toBeVisible();
    await expect(workflowEditOutcomeFormTitleField(page)).toHaveValue(outcome.title);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toBeVisible();
  });
});
