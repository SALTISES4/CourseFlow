import type { Locator, Page } from '@playwright/test';

/**
 * Workflow Overview sub-view uiObjects — canonical_locators.yaml (workflowOverviewView, workflowMetadata*).
 */

export function workflowOverviewView(page: Page): Locator {
  return page.locator('[data-test-id="workflow-overview-view"]');
}

export function workflowMetadataFieldDescription(page: Page): Locator {
  return workflowOverviewView(page).getByText('Description', { exact: true }).first();
}

export function workflowMetadataDisciplinesBlock(page: Page): Locator {
  return workflowOverviewView(page).getByText('Disciplines', { exact: true }).locator('..');
}

export function workflowMetadataFieldCreatedOn(page: Page): Locator {
  return workflowOverviewView(page).getByText('Created on', { exact: true }).first();
}

export function workflowMetadataFieldCode(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Code$/i);
}

export function workflowMetadataSwitchCalculateTimeAutomatically(page: Page): Locator {
  return workflowOverviewView(page).getByRole('checkbox', {
    name: 'Calculate time automatically',
  });
}

export function workflowMetadataFieldTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Time$/i);
}

export function workflowMetadataPermissionsPanel(page: Page): Locator {
  return workflowOverviewView(page).getByText('Permissions', { exact: true });
}
