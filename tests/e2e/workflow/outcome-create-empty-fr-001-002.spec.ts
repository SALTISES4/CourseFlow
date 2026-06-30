import { test, expect } from '../../fixtures';
import { gotoOutcomesView, hoverWorkflowOutcomeHeader } from './comments-tab.helpers';
import {
  E2E_SEED_OUTCOME_TITLE,
} from '../../helpers/workflow-pristine';
import {
  workflowEditOutcomeForm,
  workflowEditOutcomeFormTitleField,
  workflowOutcomeHeader,
  workflowOutcomeHeaderOrdinalOnly,
  workflowOutcomeHoverDeleteItem,
  workflowOutcomeViewAddOutcomeButton,
  workflowOutcomeViewEmptyStateAlert,
} from './workflow-outcome.locators';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';
import { workflowOutcomeHeaderCount } from './add-tab.helpers';

/**
 * Outcome empty state and first create — FR-WF-EO-001, FR-WF-EO-002.
 * Requirements: workflow_edit_outcome_requirements_v1.yaml
 *
 * Serial spec deletes the seeded outcome then restores its title at the end.
 */

test.describe('Outcome — empty state and first create (FR-WF-EO-001, FR-WF-EO-002)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
  });

  test('FR-WF-EO-001: empty state alert and Add outcome button after removing seeded outcome', async ({
    page,
    workflow,
  }) => {
    const seededHeader = workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE);
    if ((await seededHeader.count()) > 0) {
      await hoverWorkflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE);
      await workflowOutcomeHoverDeleteItem(page, E2E_SEED_OUTCOME_TITLE).click();
    } else if ((await workflowOutcomeViewEmptyStateAlert(page).count()) === 0) {
      test.skip(true, 'Neither seeded outcome nor empty state; reseed E2E workflow.');
    }

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
  }) => {
    await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeVisible();

    await workflowOutcomeViewAddOutcomeButton(page).click();

    await expect(workflowOutcomeViewEmptyStateAlert(page)).toHaveCount(0);
    await expect(workflowOutcomeHeaderOrdinalOnly(page, '1')).toBeVisible();
    expect(await workflowOutcomeHeaderCount(page)).toBe(1);
    await expect(workflowEditOutcomeForm(page)).toHaveCount(0);
    await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
  });

  test('FR-WF-EO-002: restore seeded outcome title for downstream specs', async ({ page }) => {
    await workflowOutcomeHeaderOrdinalOnly(page, '1').click();
    await expect(workflowEditOutcomeForm(page)).toBeVisible();

    await workflowEditOutcomeFormTitleField(page).fill(E2E_SEED_OUTCOME_TITLE);
    await page.waitForTimeout(500);

    await expect(workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE)).toBeVisible();
  });
});
