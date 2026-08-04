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

test.use({ seedAsset: 'workflow.standard_activity', actorAsset: 'actor.teacher', seedAccess: 'disposable-copy' });

/**
 * Outcome duplicate and delete — FR-WF-EO-009 through FR-WF-EO-014.
 * Requirements: workflow_duplicate_outcome_requirements_v1.yaml, workflow_delete_outcome_requirements_v1.yaml
 *
 * Product copy suffix is `(duplicate)`; FR-WF-EO-011 specifies `(copy)`.
 */

const E2E_OUTCOME_TITLE = 'E2E Outcome 1';
const E2E_OUTCOME_DUPLICATE = `${E2E_OUTCOME_TITLE} (duplicate)`;

async function createSidebarDuplicate(page: import('@playwright/test').Page): Promise<void> {
  await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();
  await expect(workflowEditOutcomeForm(page)).toBeVisible();
  await workflowEditOutcomeFormDuplicateButton(page).click();
  await expect(workflowOutcomeHeader(page, E2E_OUTCOME_DUPLICATE)).toBeVisible();
}

test.describe('Outcome — duplicate and delete (FR-WF-EO-009-014)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, workflow.firstOutcome().title)).toBeVisible();
  });

  test('FR-WF-EO-009: workflowEditOutcomeFormDuplicateButton creates sibling copy', async ({
    page,
    workflow,
  }) => {
    const beforeCount = await workflowOutcomeHeaderCount(page);

    await createSidebarDuplicate(page);

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
    await expect(workflowEditOutcomeFormTitleField(page)).toHaveValue(workflow.firstOutcome().title);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_DUPLICATE)).toBeVisible();
  });

  test('FR-WF-EO-011: duplicate root title uses product (duplicate) suffix', async ({ page }) => {
    await createSidebarDuplicate(page);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_DUPLICATE)).toBeVisible();
  });

  test('FR-WF-EO-010: hover Duplicate on duplicate adds another workflowOutcome sibling', async ({
    page,
  }) => {
    await createSidebarDuplicate(page);
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
    await createSidebarDuplicate(page);
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
    await createSidebarDuplicate(page);
    const duplicatePattern = new RegExp(
      `${E2E_OUTCOME_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(duplicate\\)`,
    );
    const duplicateHeader = page.getByText(duplicatePattern);
    await expect(duplicateHeader.first()).toBeVisible();

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
