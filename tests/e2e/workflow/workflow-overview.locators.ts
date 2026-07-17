import type { Locator, Page } from '@playwright/test';

/**
 * Workflow Overview sub-view uiObjects — canonical_locators.yaml (workflowOverviewView, workflowMetadata*).
 * Labels per workflow_overview_requirements_v1.yaml uiObjectDefinitions.
 */

export function workflowOverviewView(page: Page): Locator {
  return page.locator('[data-test-id="workflow-overview-view"]');
}

/** canonical: workflowMetadataSection */
export function workflowMetadataSection(page: Page): Locator {
  return workflowOverviewView(page);
}

/** canonical: workflowMetadataFieldDescription — label 'Description' */
export function workflowMetadataFieldDescription(page: Page): Locator {
  return workflowOverviewView(page).getByText('Description', { exact: true }).first();
}

/** canonical: workflowMetadataFieldCode — label 'Code' */
export function workflowMetadataFieldCode(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Code$/i);
}

/**
 * All auto-calculate switches share visible label 'Auto-calculate' (FR uiObjectDefinitions).
 * Disambiguate by document order when multiple are present (program):
 * Time → Ponderation → Credits → Classification.
 */
const AUTO_CALCULATE_SWITCH_NAME = 'Auto-calculate';

function workflowMetadataAutoCalculateSwitch(page: Page, index: number): Locator {
  return workflowOverviewView(page)
    .getByRole('checkbox', { name: AUTO_CALCULATE_SWITCH_NAME })
    .nth(index);
}

/** canonical: workflowMetadataSwitchCalculateTimeAutomatically — label 'Auto-calculate' */
export function workflowMetadataSwitchCalculateTimeAutomatically(page: Page): Locator {
  return workflowMetadataAutoCalculateSwitch(page, 0);
}

/** canonical: workflowMetadataFieldTime — label 'Time' */
export function workflowMetadataFieldTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Time$/i);
}

/** canonical: workflowMetadataSwitchCalculatePonderationAutomatically — label 'Auto-calculate' */
export function workflowMetadataSwitchCalculatePonderationAutomatically(page: Page): Locator {
  return workflowMetadataAutoCalculateSwitch(page, 1);
}

/** canonical: workflowMetadataFieldTheoryTime — label 'Theory' */
export function workflowMetadataFieldTheoryTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Theory$/i);
}

/** canonical: workflowMetadataFieldPracticalTime — label 'Practical' */
export function workflowMetadataFieldPracticalTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Practical$/i);
}

/** canonical: workflowMetadataFieldIndividualTime — label 'Individual' */
export function workflowMetadataFieldIndividualTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Individual$/i);
}

/** FR-WF-OV-004 — Ponderation section heading */
export function workflowMetadataPonderationSection(page: Page): Locator {
  return workflowOverviewView(page).getByText('Ponderation', { exact: true });
}

/** canonical: workflowMetadataSwitchCalculateCreditsAutomatically — label 'Auto-calculate' */
export function workflowMetadataSwitchCalculateCreditsAutomatically(page: Page): Locator {
  return workflowMetadataAutoCalculateSwitch(page, 2);
}

/** canonical: workflowMetadataFieldCredits — label 'Credits' */
export function workflowMetadataFieldCredits(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Credits$/i);
}

/** canonical: workflowMetadataSwitchCalculateClassificationAutomatically — label 'Auto-calculate' */
export function workflowMetadataSwitchCalculateClassificationAutomatically(page: Page): Locator {
  return workflowMetadataAutoCalculateSwitch(page, 3);
}

/** canonical: workflowMetadataFieldGeneralTime */
export function workflowMetadataFieldGeneralTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^General$/i);
}

/** canonical: workflowMetadataFieldSpecificTime */
export function workflowMetadataFieldSpecificTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Specific$/i);
}

/** canonical: workflowMetadataPermissionsPanel */
export function workflowMetadataPermissionsPanel(page: Page): Locator {
  return workflowOverviewView(page).getByText('Permissions', { exact: true });
}

/** Contributor row in workflowMetadataPermissionsPanel, located by email. */
export function workflowContributorRow(page: Page, contributorEmail: string): Locator {
  return workflowOverviewView(page)
    .getByRole('listitem')
    .filter({ has: page.getByText(contributorEmail, { exact: true }) });
}

/** Role control on a workflow permissions contributor row (read-only per FR-WF-OV-007). */
export function workflowContributorRoleControl(page: Page, contributorEmail: string): Locator {
  return workflowContributorRow(page, contributorEmail).getByRole('button').last();
}

/** Read-only Owner control on workflowMetadataPermissionsPanel. */
export function workflowOwnerRoleControl(page: Page): Locator {
  return workflowOverviewView(page).getByRole('button', { name: 'Owner', exact: true });
}
