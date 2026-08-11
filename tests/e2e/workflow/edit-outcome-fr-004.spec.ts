import { test, expect } from '../../fixtures';
import { gotoOutcomesView } from './comments-tab.helpers';
import {
  expectReadOnlyWorkflowEditOutcomeForm,
  loginAsWorkflowContributor,
} from './role.helpers';
import {
  workflowEditOutcomeForm,
  workflowEditOutcomeFormTitleField,
  workflowOutcomeHeader,
} from './workflow-outcome.locators';
import {
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
} from '../../shared/locators/workflow';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'read-only',
});

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

  test.describe('Role behavior — read-only form (FR-WF-EO-004)', () => {
    test.describe('commenter', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('FR-WF-EO-004: commenter opens read-only workflowEditOutcomeForm', async ({
        page,
        workflow,
      }) => {
        await loginAsWorkflowContributor(page, workflow, 'commenter');
        await gotoOutcomesView(page, workflow.path);
        await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();

        await expectReadOnlyWorkflowEditOutcomeForm(page);
      });
    });

    test.describe('viewer', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('FR-WF-EO-004: viewer opens read-only workflowEditOutcomeForm', async ({
        page,
        workflow,
      }) => {
        await loginAsWorkflowContributor(page, workflow, 'viewer');
        await gotoOutcomesView(page, workflow.path);
        await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();

        await expectReadOnlyWorkflowEditOutcomeForm(page);
      });
    });
  });
});
