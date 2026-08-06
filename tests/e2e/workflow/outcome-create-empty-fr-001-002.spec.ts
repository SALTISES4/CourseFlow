import { test, expect } from '../../fixtures';
import { gotoOutcomesView, hoverWorkflowOutcomeHeader } from './comments-tab.helpers';
import {
  workflowEditOutcomeForm,
  workflowOutcomeHeader,
  workflowOutcomeHeaderOrdinalOnly,
  workflowOutcomeHoverDeleteItem,
  workflowOutcomeViewAddOutcomeButton,
  workflowOutcomeViewEmptyStateAlert,
} from './workflow-outcome.locators';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';
import { workflowOutcomeHeaderCount } from './add-tab.helpers';

test.use({ seedAsset: 'workflow.standard_activity', actorAsset: 'actor.teacher', seedAccess: 'disposable-copy' });

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
    await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
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
    await expect(workflowOutcomeHeaderOrdinalOnly(page, '1')).toBeVisible();
    expect(await workflowOutcomeHeaderCount(page)).toBe(1);
    await expect(workflowEditOutcomeForm(page)).toHaveCount(0);
    await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
  });

});
