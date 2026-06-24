import { expect, type Page, test } from '@playwright/test';
import { sectionContainers, sectionHeader } from '../e2e/workflow/edit-section.locators';
import type { WorkflowHandle } from '../fixtures/workflow';

const REBUILD_HINT = 'Run from repo root: just rebuild-e2e-db';

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
