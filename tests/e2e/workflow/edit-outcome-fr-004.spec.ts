import { test, expect } from '../../fixtures';
import { gotoOutcomesView } from './comments-tab.helpers';
import {
  workflowEditOutcomeForm,
  workflowEditOutcomeFormTitleField,
  workflowOutcomeHeader,
} from './workflow-outcome.locators';
import {
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
} from '../../shared/locators/workflow';

test.use({ seedAsset: 'workflow.standard_activity', actorAsset: 'actor.teacher', seedAccess: 'read-only' });

/**
 * Open edit outcome form — FR-WF-EO-004.
 * Requirements: workflow_edit_outcome_requirements_v1.yaml
 */

const E2E_OUTCOME_TITLE = 'E2E Outcome 1';

test.describe('Edit outcome — open workflowEditOutcomeForm (FR-WF-EO-004)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    expect(workflow.outcomes.length).toBeGreaterThan(0);
    await gotoOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-WF-EO-004: click workflowOutcomeHeader expands sidebar on workflowRightSidebarEditTab', async ({
    page,
  }) => {
    await expect(workflowRightSidebarContentPanel(page)).toBeHidden();

    await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();

    await expect(workflowRightSidebarContentPanel(page)).toBeVisible();
    await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowEditOutcomeForm(page)).toBeVisible();
    await expect(workflowEditOutcomeFormTitleField(page)).toBeVisible();
  });
});
