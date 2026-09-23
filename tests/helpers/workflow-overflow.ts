import { expect, type Page } from '@playwright/test';

import {
  archiveWorkflowOverflowMenuItem,
  copyWorkflowOverflowMenuItem,
  workflowOverflowMenu,
  workflowOverflowMenuRowLabels,
  workflowOverflowTrigger,
} from '../e2e/workflow/workflow-overflow.locators';

export async function openWorkflowOverflowMenu(page: Page): Promise<void> {
  await expect(workflowOverflowTrigger(page)).toBeVisible({ timeout: 15_000 });
  await workflowOverflowTrigger(page).click();
  await expect(workflowOverflowMenu(page)).toBeVisible();
}

export async function closeWorkflowOverflowMenu(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(workflowOverflowMenu(page)).toBeHidden();
}

/** FR-CAB-005 — exactly two rows labeled Copy then Archive, top to bottom. */
export async function expectWorkflowOverflowMenuCompositionPerFrCab005(
  page: Page,
  workflowType: string,
): Promise<void> {
  await openWorkflowOverflowMenu(page);

  const menu = workflowOverflowMenu(page);
  const [copyLabel, archiveLabel] = workflowOverflowMenuRowLabels(workflowType);

  await expect(menu.getByRole('menuitem')).toHaveCount(2);
  await expect(menu.getByRole('menuitem')).toHaveText([copyLabel, archiveLabel]);

  await closeWorkflowOverflowMenu(page);
}

/** FR-CAB-005 — owner: Copy and Archive are both actionable. */
export async function expectWorkflowOverflowMenuActionabilityForOwnerPerFrCab005(
  page: Page,
  workflowType: string,
): Promise<void> {
  await openWorkflowOverflowMenu(page);

  await expect(copyWorkflowOverflowMenuItem(page, workflowType)).toBeEnabled();
  await expect(archiveWorkflowOverflowMenuItem(page, workflowType)).toBeEnabled();

  await closeWorkflowOverflowMenu(page);
}

/** FR-CAB-005 — editor, viewer, commenter, user: Copy available; Archive readOnly. */
export async function expectWorkflowOverflowMenuActionabilityForNonOwnerPerFrCab005(
  page: Page,
  workflowType: string,
): Promise<void> {
  await openWorkflowOverflowMenu(page);

  await expect(copyWorkflowOverflowMenuItem(page, workflowType)).toBeEnabled();
  await expect(archiveWorkflowOverflowMenuItem(page, workflowType)).toBeVisible();
  await expect(archiveWorkflowOverflowMenuItem(page, workflowType)).toBeDisabled();

  await closeWorkflowOverflowMenu(page);
}
