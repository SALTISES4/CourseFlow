import { test, expect } from '../../fixtures';
import { gotoOutcomesView } from './comments-tab.helpers';
import {
  workflowEditOutcomeForm,
  workflowEditOutcomeFormCodeField,
  workflowEditOutcomeFormDeleteButton,
  workflowEditOutcomeFormDescriptionField,
  workflowEditOutcomeFormDuplicateButton,
  workflowEditOutcomeFormTagsField,
  workflowEditOutcomeFormTitleField,
  workflowOutcomeHeader,
} from './workflow-outcome.locators';

test.use({ seedAsset: 'workflow.standard_activity', actorAsset: 'actor.teacher', seedAccess: 'disposable-copy' });

/**
 * Edit outcome fields and auto-save — FR-WF-EO-005, FR-WF-EO-006.
 * Requirements: workflow_edit_outcome_requirements_v1.yaml
 */

const E2E_OUTCOME_TITLE = 'E2E Outcome 1';

test.describe('Edit outcome — fields and auto-save (FR-WF-EO-005, FR-WF-EO-006)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    expect(workflow.outcomes.length).toBeGreaterThan(0);
    await gotoOutcomesView(page, workflow.path);
    await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();
    await expect(workflowEditOutcomeForm(page)).toBeVisible();
  });

  test('FR-WF-EO-005: root workflowEditOutcomeForm renders level-1 fields and actions', async ({
    page,
  }) => {
    await expect(workflowEditOutcomeFormTitleField(page)).toBeVisible();
    await expect(workflowEditOutcomeFormDescriptionField(page)).toBeVisible();
    await expect(workflowEditOutcomeFormCodeField(page)).toBeVisible();
    await expect(workflowEditOutcomeFormTagsField(page)).toBeVisible();
    await expect(workflowEditOutcomeFormDuplicateButton(page)).toBeVisible();
    await expect(workflowEditOutcomeFormDeleteButton(page)).toBeVisible();
  });

  test('FR-WF-EO-006: workflowEditOutcomeForm does not show auto-save status indicator', async ({
    page,
  }) => {
    await workflowEditOutcomeFormDescriptionField(page).fill(`E2E autosave ${Date.now()}`);

    await expect(page.getByText(/^Saving/i)).toHaveCount(0);
    await expect(page.getByText(/^Saved/i)).toHaveCount(0);
  });

  test('FR-WF-EO-006: title change updates workflowOutcomeHeaderTitle', async ({ page }) => {
    const uniqueTitle = `E2E Out ${Date.now()}`;

    await workflowEditOutcomeFormTitleField(page).fill(uniqueTitle);
    await page.waitForTimeout(500);

    await expect(workflowOutcomeHeader(page, uniqueTitle)).toBeVisible();

    await workflowEditOutcomeFormTitleField(page).fill(E2E_OUTCOME_TITLE);
    await page.waitForTimeout(500);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toBeVisible();
  });
});
