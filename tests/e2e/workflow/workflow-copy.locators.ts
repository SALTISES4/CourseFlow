import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export function workflowOverflowButton(page: Page): Locator {
  return page.locator('[data-test-id="overflow-button"]');
}

export function copyWorkflowMenuItem(page: Page, workflowType: string): Locator {
  return page.getByRole('menuitem', {
    name: `Copy ${workflowType}`,
    exact: true,
  });
}

export function copyWorkflowDialog(page: Page): Locator {
  return page.locator('[data-test-id="copy-workflow-dialog"]');
}

export function copyWorkflowDialogTitle(page: Page): Locator {
  return copyWorkflowDialog(page).locator('[data-test-id="copy-workflow-dialog-title"]');
}

export function copyWorkflowTitleField(page: Page): Locator {
  return copyWorkflowDialog(page).locator('[data-test-id="copy-workflow-title-field"]');
}

export function copyWorkflowProjectPanel(page: Page): Locator {
  return copyWorkflowDialog(page).locator(
    '[data-test-id="copy-workflow-select-project-panel"]',
  );
}

export function copyWorkflowProjectSearchField(page: Page): Locator {
  return copyWorkflowDialog(page).locator('[data-test-id="workflow-project-search-field"]');
}

export function copyWorkflowProjectCards(page: Page): Locator {
  return copyWorkflowDialog(page).locator('[data-test-id="project-card"]');
}

export function copyWorkflowProjectCardByTitle(page: Page, title: string): Locator {
  return copyWorkflowProjectCards(page).filter({
    has: page.getByRole('heading', { name: title, exact: true }),
  });
}

export function copyWorkflowProjectSearchEmptyState(page: Page): Locator {
  return copyWorkflowDialog(page).locator(
    '[data-test-id="workflow-project-search-empty-state"]',
  );
}

export function copyWorkflowNoEligibleProjectsState(page: Page): Locator {
  return copyWorkflowDialog(page).locator('[data-test-id="no-eligible-projects"]');
}

export function copyWorkflowCancelButton(page: Page): Locator {
  return copyWorkflowDialog(page).locator('[data-test-id="copy-workflow-cancel-button"]');
}

export function copyWorkflowSubmitButton(page: Page): Locator {
  return copyWorkflowDialog(page).locator('[data-test-id="copy-workflow-submit-button"]');
}

/** Destination UI required by FR-WF-COPY-001 alongside the title field. */
export function copyWorkflowDestinationSurface(page: Page): Locator {
  return copyWorkflowProjectPanel(page).or(copyWorkflowNoEligibleProjectsState(page));
}

/**
 * Reject create-stepper chrome and assert typed single-dialog chrome.
 * Does not wait for destination content (use expectCopyWorkflowTitleAndDestinationInSameDialog).
 */
export async function expectCopyWorkflowDialogChrome(
  page: Page,
  workflowType: string,
): Promise<void> {
  await expect(copyWorkflowDialog(page)).toHaveCount(1);
  await expect(copyWorkflowDialog(page)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(copyWorkflowDialogTitle(page)).toHaveText(`Copy ${workflowType}`);
  await expect(copyWorkflowCancelButton(page)).toBeVisible();
  await expect(copyWorkflowSubmitButton(page)).toBeVisible();
  await expect(copyWorkflowSubmitButton(page)).toHaveText(`Copy ${workflowType}`);

  await expect(
    copyWorkflowDialog(page).getByRole('button', { name: 'Next step', exact: true }),
  ).toHaveCount(0);
  await expect(
    copyWorkflowDialog(page).getByRole('button', { name: 'Previous step', exact: true }),
  ).toHaveCount(0);
  await expect(copyWorkflowDialog(page).locator('.MuiStepper-root')).toHaveCount(0);
}

/**
 * FR-WF-COPY-001 — title and destination are presented in the same dialog.
 *
 * The destination component loads eligible projects asynchronously, so its visible
 * surface may appear after the title field. The single-dialog and no-stepper assertions
 * distinguish this flow from a deferred project-selection step without imposing a
 * same-render-tick requirement that the product contract does not specify.
 */
export async function expectCopyWorkflowTitleAndDestinationInSameDialog(
  page: Page,
): Promise<void> {
  await expect(copyWorkflowDialog(page)).toBeVisible({ timeout: 15_000 });

  const title = copyWorkflowTitleField(page);
  const destination = copyWorkflowDestinationSurface(page);

  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(copyWorkflowDialog(page).locator('.MuiStepper-root')).toHaveCount(0);
  await expect(title).toBeVisible({ timeout: 15_000 });
  await expect(destination).toBeVisible({ timeout: 15_000 });
}

/**
 * FR-WF-COPY-001 shell for eligible destinations: co-appearing title + destination,
 * then project panel specifically.
 */
export async function expectCopyWorkflowCombinedDialogShell(
  page: Page,
  workflowType: string,
): Promise<void> {
  await expectCopyWorkflowTitleAndDestinationInSameDialog(page);
  await expectCopyWorkflowDialogChrome(page, workflowType);
  await expect(copyWorkflowProjectPanel(page)).toBeVisible();
  await expect(copyWorkflowProjectSearchField(page)).toBeVisible();
  await expect(copyWorkflowTitleField(page)).toBeVisible();
}

/**
 * FR-WF-COPY-006 shell: same single dialog; destination may be the no-eligible warning.
 */
export async function expectCopyWorkflowSingleDialogShell(
  page: Page,
  workflowType: string,
): Promise<void> {
  await expectCopyWorkflowTitleAndDestinationInSameDialog(page);
  await expectCopyWorkflowDialogChrome(page, workflowType);
  await expect(copyWorkflowTitleField(page)).toBeVisible();
}
