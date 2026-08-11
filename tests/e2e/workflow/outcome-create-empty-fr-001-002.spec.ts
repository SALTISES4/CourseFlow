import { test, expect } from '../../fixtures';
import { loginAsTestUser } from '../../helpers/auth';
import { gotoOutcomesView, hoverWorkflowOutcomeHeader } from './comments-tab.helpers';
import { loginAsWorkflowContributor } from './role.helpers';
import {
  workflowEditOutcomeForm,
  workflowOutcomeHeader,
  workflowOutcomeHeaderTitleText,
  workflowOutcomeHoverDeleteItem,
  workflowOutcomeViewAddOutcomeButton,
  workflowOutcomeViewEmptyStateAlert,
} from './workflow-outcome.locators';
import {
  workflowRightSidebar,
  workflowRightSidebarContentPanel,
} from '../../shared/locators/workflow';
import { workflowOutcomeHeaderCount } from './add-tab.helpers';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Outcome empty state and first create — FR-WF-EO-001, FR-WF-EO-002.
 * Requirements: workflow_edit_outcome_requirements_v1.yaml
 */

async function removeSeededOutcome(
  page: import('@playwright/test').Page,
  title: string,
): Promise<void> {
  const seededHeader = workflowOutcomeHeader(page, title);
  await expect(seededHeader).toBeVisible();
  await hoverWorkflowOutcomeHeader(page, title);
  await workflowOutcomeHoverDeleteItem(page, title).click();
  await expect(seededHeader).toHaveCount(0);
}

test.describe('Outcome — empty state and first create (FR-WF-EO-001, FR-WF-EO-002)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
  });

  test('FR-WF-EO-001: empty state alert and Add outcome button after removing seeded outcome', async ({
    page,
    workflow,
  }) => {
    await removeSeededOutcome(page, workflow.firstOutcome().title);

    await expect(workflowOutcomeViewEmptyStateAlert(page)).toBeVisible();
    await expect(
      page.getByText(/In this view you can add and edit outcomes for this workflow\./),
    ).toBeVisible();
    await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeVisible();
    await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeEnabled();
    await expect(workflowRightSidebar(page)).toHaveCount(0);
    expect(await workflowOutcomeHeaderCount(page)).toBe(0);
  });

  test('FR-WF-EO-002: Add outcome creates root-level untitled workflowOutcome', async ({
    page,
    workflow,
  }) => {
    await removeSeededOutcome(page, workflow.firstOutcome().title);
    await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeVisible();

    await workflowOutcomeViewAddOutcomeButton(page).click();

    await expect(workflowOutcomeViewEmptyStateAlert(page)).toHaveCount(0);
    await expect(workflowOutcomeHeaderTitleText(page, '1', 'Untitled outcome')).toBeVisible();
    expect(await workflowOutcomeHeaderCount(page)).toBe(1);
    await expect(workflowEditOutcomeForm(page)).toHaveCount(0);
    await expect(workflowRightSidebar(page)).toBeVisible();
    await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
  });

  test.describe('Role behavior — Add outcome button (FR-WF-EO-001)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page, workflow }) => {
      await loginAsTestUser(page);
      await gotoOutcomesView(page, workflow.path);
      await removeSeededOutcome(page, workflow.firstOutcome().title);
      await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeVisible();
    });

    test('FR-WF-EO-001: commenter sees disabled Add outcome button', async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, 'commenter');
      await gotoOutcomesView(page, workflow.path);

      await expect(workflowOutcomeViewEmptyStateAlert(page)).toBeVisible();
      await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeDisabled();
      await workflowOutcomeViewAddOutcomeButton(page).click({ force: true });
      expect(await workflowOutcomeHeaderCount(page)).toBe(0);
    });

    test('FR-WF-EO-001: viewer sees disabled Add outcome button', async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, 'viewer');
      await gotoOutcomesView(page, workflow.path);

      await expect(workflowOutcomeViewEmptyStateAlert(page)).toBeVisible();
      await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeDisabled();
      await workflowOutcomeViewAddOutcomeButton(page).click({ force: true });
      expect(await workflowOutcomeHeaderCount(page)).toBe(0);
    });
  });
});
