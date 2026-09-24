import type { Locator, Page } from '@playwright/test';

/** canonical: contextActionBarOverflowTrigger */
export function workflowOverflowTrigger(page: Page): Locator {
  return page.locator('[data-test-id="overflow-button"]');
}

/** canonical: contextActionBarOverflowMenu — MenuWithOverflow surface (#basic-menu). */
export function workflowOverflowMenu(page: Page): Locator {
  return page.locator('#basic-menu');
}

/** canonical: contextActionBarOverflowItemCopyWorkflow */
export function copyWorkflowOverflowMenuItem(page: Page, workflowType: string): Locator {
  return page.getByRole('menuitem', {
    name: `Copy ${workflowType}`,
    exact: true,
  });
}

/** canonical: contextActionBarOverflowItemArchiveWorkflow */
export function archiveWorkflowOverflowMenuItem(page: Page, workflowType: string): Locator {
  return page.getByRole('menuitem', {
    name: `Archive ${workflowType}`,
    exact: true,
  });
}

/** FR-CAB-005 — required top-to-bottom row labels after [workflow type] substitution. */
export function workflowOverflowMenuRowLabels(workflowType: string): [string, string] {
  return [`Copy ${workflowType}`, `Archive ${workflowType}`];
}

/** @deprecated Prefer workflowOverflowTrigger — kept for copy/archive spec imports. */
export function workflowOverflowButton(page: Page): Locator {
  return workflowOverflowTrigger(page);
}

/** @deprecated Prefer copyWorkflowOverflowMenuItem — kept for copy spec imports. */
export function copyWorkflowMenuItem(page: Page, workflowType: string): Locator {
  return copyWorkflowOverflowMenuItem(page, workflowType);
}
