import { expect, type Page, test } from '@playwright/test';
import { sectionContainers, sectionHeader } from '../e2e/workflow/edit-section.locators';
import { workflowOutcomeHeader } from '../e2e/workflow/workflow-outcome.locators';
import type { WorkflowHandle } from '../fixtures/workflow';

const REBUILD_HINT = 'Run from repo root: just rebuild-e2e-db';

/** Seeded root outcome title — course_flow/e2e_seed/constants.py */
export const E2E_SEED_OUTCOME_TITLE = 'E2E Outcome 1';

/**
 * Skip the current test when the shared E2E workflow has been mutated by a prior run
 * (extra sections, renamed titles, etc.).
 */
export async function skipUnlessPristineWorkflow(
  page: Page,
  workflow: WorkflowHandle,
): Promise<void> {
  await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });



  const count = await sectionContainers(page).count();
  const expectedCount = workflow.sections.length;

  console.log('workflow')
  console.log(workflow)
  console.log('count')
  console.log(count)

  if (count !== expectedCount) {
    test.skip(
      true,
      `Pristine E2E workflow required (${expectedCount} sections, found ${count}). ${REBUILD_HINT}`,
    );
  }

  const first = workflow.firstSection();
  if (first.title) {
    await expect(sectionHeader(page, first.uuid)).toContainText(first.title);
  }
}

/**
 * Skip when the shared E2E workflow root outcome title was renamed by a prior spec
 * (e.g. edit-outcome FR-WF-EO-006 title mutation without restore).
 */
export async function skipUnlessPristineOutcome(
  page: Page,
  workflow: WorkflowHandle,
  expectedTitle: string = E2E_SEED_OUTCOME_TITLE,
): Promise<void> {
  if (workflow.outcomes.length === 0) {
    test.skip(true, `E2E fixture has no outcomes; run just django-seed-e2e-tests. ${REBUILD_HINT}`);
  }

  const header = workflowOutcomeHeader(page, expectedTitle);
  if ((await header.count()) === 0) {
    test.skip(
      true,
      `Pristine E2E outcome required (title ${JSON.stringify(expectedTitle)}). ${REBUILD_HINT}`,
    );
  }
  await expect(header).toBeVisible({ timeout: 15_000 });
}

/** Restore seeded root outcome title when a prior spec left an untitled `1.` header. */
export async function ensureSeedOutcomeTitle(
  page: Page,
  expectedTitle: string = E2E_SEED_OUTCOME_TITLE,
): Promise<void> {
  if ((await workflowOutcomeHeader(page, expectedTitle).count()) > 0) {
    return;
  }

  const untitledRoot = page.getByText(/^1\.\s*$/);
  if ((await untitledRoot.count()) === 0) {
    return;
  }

  await untitledRoot.click();
  const titleField = page
    .locator('[data-test-id="workflow-right-sidebar"]')
    .getByRole('textbox', { name: 'Title' });
  await titleField.fill(expectedTitle);
  await page.waitForTimeout(500);
}
