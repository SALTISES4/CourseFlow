import { test, expect } from '../../fixtures';
import {
  gotoOutcomesView,
  hoverWorkflowOutcomeHeader,
} from './comments-tab.helpers';
import { workflowOutcomeHeaderCount } from './add-tab.helpers';
import {
  workflowEditOutcomeForm,
  workflowEditOutcomeFormDeleteButton,
  workflowEditOutcomeFormDuplicateButton,
  workflowEditOutcomeFormTitleField,
  workflowOutcomeHeader,
  workflowOutcomeHoverDeleteItem,
  workflowOutcomeHoverDuplicateItem,
} from './workflow-outcome.locators';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';

/**
 * Outcome duplicate and delete — FR-WF-EO-009 through FR-WF-EO-014.
 * Requirements: workflow_duplicate_outcome_requirements_v1.yaml, workflow_delete_outcome_requirements_v1.yaml
 *
 * Product copy suffix is `(duplicate)`; FR-WF-EO-011 specifies `(copy)`.
 */

const E2E_OUTCOME_TITLE = 'E2E Outcome 1';
const E2E_OUTCOME_DUPLICATE = `${E2E_OUTCOME_TITLE} (duplicate)`;

test.describe('Outcome — duplicate and delete (FR-WF-EO-009–014)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    if (workflow.outcomes.length === 0) {
      test.skip(true, 'E2E fixture has no outcomes; run just django-seed-e2e-tests.');
    }
    await gotoOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toBeVisible();
  });

  test('FR-WF-EO-009: workflowEditOutcomeFormDuplicateButton creates sibling copy', async ({
    page,
    workflow,
  }) => {
    const beforeCount = await workflowOutcomeHeaderCount(page);

    await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();
    await expect(workflowEditOutcomeForm(page)).toBeVisible();
    await workflowEditOutcomeFormDuplicateButton(page).click();

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
    await expect(workflowEditOutcomeFormTitleField(page)).toHaveValue(workflow.firstOutcome().title);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_DUPLICATE)).toBeVisible();
  });

  test('FR-WF-EO-011: duplicate root title uses product (duplicate) suffix', async ({ page }) => {
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_DUPLICATE)).toBeVisible();
  });

  test('FR-WF-EO-010: hover Duplicate on duplicate adds another workflowOutcome sibling', async ({
    page,
  }) => {
    const beforeCount = await workflowOutcomeHeaderCount(page);

    await hoverWorkflowOutcomeHeader(page, E2E_OUTCOME_DUPLICATE);
    await workflowOutcomeHoverDuplicateItem(page, E2E_OUTCOME_DUPLICATE).click();

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
  });

  test('FR-WF-EO-013: hover Delete removes last disposable duplicate workflowOutcome immediately', async ({
    page,
  }) => {
    const beforeCount = await workflowOutcomeHeaderCount(page);
    const duplicateHeaders = page.getByText(
      new RegExp(`^\\d+\\.\\s*${E2E_OUTCOME_DUPLICATE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
    );
    const lastDuplicateTitle = await duplicateHeaders.last().textContent();
    const lastTitle = lastDuplicateTitle?.replace(/^\d+\.\s*/, '') ?? E2E_OUTCOME_DUPLICATE;

    await hoverWorkflowOutcomeHeader(page, lastTitle);
    await workflowOutcomeHoverDeleteItem(page, lastTitle).click();

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount - 1);
  });

  test('FR-WF-EO-012: workflowEditOutcomeFormDeleteButton removes remaining disposable duplicate', async ({
    page,
  }) => {
    const duplicatePattern = new RegExp(
      `${E2E_OUTCOME_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(duplicate\\)`,
    );
    const duplicateHeader = page.getByText(duplicatePattern);
    if ((await duplicateHeader.count()) === 0) {
      test.skip(true, 'No disposable outcome duplicate left to delete via sidebar.');
    }

    const beforeCount = await workflowOutcomeHeaderCount(page);
    const duplicateTitle =
      (await duplicateHeader.first().textContent())?.replace(/^\d+\.\s*/, '') ??
      E2E_OUTCOME_DUPLICATE;

    await duplicateHeader.first().click();
    await expect(workflowEditOutcomeForm(page)).toBeVisible();
    await workflowEditOutcomeFormDeleteButton(page).click();

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount - 1);
    await expect(workflowOutcomeHeader(page, duplicateTitle)).toHaveCount(0);
    await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
  });
});
