import type { Locator, Page } from '@playwright/test';

/**
 * Workflow Overview sub-view uiObjects — canonical_locators.yaml (workflowOverviewView, workflowMetadata*).
 */

export function workflowOverviewView(page: Page): Locator {
  return page.locator('[data-test-id="workflow-overview-view"]');
}

export function workflowMetadataFieldDescription(page: Page): Locator {
  return workflowOverviewView(page).getByText('Description', { exact: true }).first().locator('..');
}

export function workflowMetadataSection(page: Page): Locator {
  return workflowOverviewView(page).locator('[data-test-id="workflow-metadata-section"]');
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

export function workflowMetadataFieldCredits(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Credits$/i);
}

export function workflowMetadataSwitchCalculatePonderationAutomatically(page: Page): Locator {
  return workflowOverviewView(page).getByRole('checkbox', {
    name: 'Calculate ponderation automatically',
  });
}

export function workflowMetadataFieldTheoryTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Theory$/i);
}

export function workflowMetadataFieldPracticalTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Practical$/i);
}

export function workflowMetadataFieldIndividualTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Individual$/i);
}

export function workflowMetadataSwitchCalculateCreditsAutomatically(page: Page): Locator {
  return workflowOverviewView(page).getByRole('checkbox', {
    name: 'Calculate credits automatically',
  });
}

export function workflowMetadataSwitchCalculateClassificationAutomatically(page: Page): Locator {
  return workflowOverviewView(page).getByRole('checkbox', {
    name: 'Calculate classification automatically',
  });
}

export function workflowMetadataFieldGeneralTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^General time$/i);
}

export function workflowMetadataFieldSpecificTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Specific time$/i);
}

export function workflowMetadataWarningBanner(page: Page): Locator {
  return workflowOverviewView(page).locator('[data-test-id="workflow-ponderation-warning"]');
}

export function workflowMetadataClassificationWarningBanner(page: Page): Locator {
  return workflowOverviewView(page).locator('[data-test-id="workflow-classification-warning"]');
}

export function workflowMetadataPermissionsPanel(page: Page): Locator {
  return workflowOverviewView(page).locator('[data-test-id="workflow-permissions-panel"]');
}
