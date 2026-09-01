import { type Locator, type Page } from '@playwright/test';

/** Canonical workspace-access uiObjects from canonical_locators.yaml. */
export function projectAccessDeniedView(page: Page): Locator {
  return page.locator('[data-test-id="project-access-denied-view"]');
}

export function workflowAccessDeniedView(page: Page): Locator {
  return page.locator('[data-test-id="workflow-access-denied-view"]');
}

export function workflowAccessDeniedTitle(page: Page): Locator {
  return workflowAccessDeniedView(page).getByRole('heading', {
    name: 'No workflow access',
    exact: true,
  });
}

export function workflowAccessDeniedSubtitle(page: Page): Locator {
  return workflowAccessDeniedView(page).getByText(
    'This workflow is private. you need permission from the owner to view or edit its contents.',
    { exact: true },
  );
}
