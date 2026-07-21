import type { Locator, Page } from '@playwright/test';

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
