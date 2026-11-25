import type { Locator, Page } from '@playwright/test';

/**
 * Workflow Overview sub-view uiObjects — canonical_locators.yaml (workflowOverviewView, workflowMetadata*).
 * Switch and field labels match product copy in OverviewView / MetadataFields.
 */

export function workflowOverviewView(page: Page): Locator {
  return page.locator('[data-test-id="workflow-overview-view"]');
}

/** canonical: workflowMetadataSection */
export function workflowMetadataSection(page: Page): Locator {
  return workflowOverviewView(page).locator('[data-test-id="workflow-metadata-section"]');
}

/** Display-only Description block content (not the title). */
export function workflowMetadataFieldDescription(page: Page): Locator {
  return workflowOverviewView(page)
    .getByText('Description', { exact: true })
    .locator('xpath=following-sibling::*[1]');
}

/**
 * Project-overview metadata labels that must not appear on workflowOverviewView
 * (FR-WF-OV-001 — Disciplines belong on project overview per FR-PROJ-OV-001).
 */
export const WORKFLOW_OVERVIEW_FORBIDDEN_METADATA_LABELS = ['Disciplines', 'Created on'] as const;

/** canonical: workflowMetadataFieldCode — label 'Code' */
export function workflowMetadataFieldCode(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Code$/i);
}

/** canonical: workflowMetadataSwitchCalculateTimeAutomatically */
export function workflowMetadataSwitchCalculateTimeAutomatically(page: Page): Locator {
  return workflowOverviewView(page)
    .locator('[data-test-id="workflow-time-section"]')
    .getByRole('checkbox', { name: 'Auto-calculate' });
}

export function workflowMetadataTimeGroup(page: Page): Locator {
  return workflowOverviewView(page).locator('[data-test-id="workflow-overview-time"]');
}

export function workflowMetadataFieldTimeHours(page: Page): Locator {
  return workflowMetadataTimeGroup(page).getByLabel(/^Hours$/i);
}

export function workflowMetadataFieldTimeMinutes(page: Page): Locator {
  return workflowMetadataTimeGroup(page).getByLabel(/^Minutes$/i);
}

/** Backward-compatible alias for tests that only need one field from the Time control. */
export function workflowMetadataFieldTime(page: Page): Locator {
  return workflowMetadataFieldTimeHours(page);
}

/** FR-WF-OV-004 — Ponderation section heading */
export function workflowMetadataPonderationSection(page: Page): Locator {
  return workflowOverviewView(page).getByText('Ponderation', { exact: true });
}

/** canonical: workflowMetadataSwitchCalculatePonderationAutomatically */
export function workflowMetadataSwitchCalculatePonderationAutomatically(page: Page): Locator {
  return workflowOverviewView(page)
    .locator('[data-test-id="workflow-ponderation-section"]')
    .getByRole('checkbox', { name: 'Auto-calculate' });
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

/** canonical: workflowMetadataSwitchCalculateCreditsAutomatically */
export function workflowMetadataSwitchCalculateCreditsAutomatically(page: Page): Locator {
  return workflowOverviewView(page)
    .locator('[data-test-id="workflow-credits-section"]')
    .getByRole('checkbox', { name: 'Auto-calculate' });
}

/** canonical: workflowMetadataFieldCredits — label 'Credits' */
export function workflowMetadataFieldCredits(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Credits$/i);
}

/** canonical: workflowMetadataSwitchCalculateClassificationAutomatically */
export function workflowMetadataSwitchCalculateClassificationAutomatically(page: Page): Locator {
  return workflowOverviewView(page)
    .locator('[data-test-id="workflow-classification-section"]')
    .getByRole('checkbox', { name: 'Auto-calculate' });
}

/** canonical: workflowMetadataFieldGeneralTime — label 'General time' */
export function workflowMetadataFieldGeneralTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^General time$/i);
}

/** canonical: workflowMetadataFieldSpecificTime — label 'Specific time' */
export function workflowMetadataFieldSpecificTime(page: Page): Locator {
  return workflowOverviewView(page).getByLabel(/^Specific time$/i);
}

export function workflowMetadataWarningBanner(page: Page): Locator {
  return workflowOverviewView(page).locator('[data-test-id="workflow-ponderation-warning"]');
}

export function workflowMetadataClassificationWarningBanner(page: Page): Locator {
  return workflowOverviewView(page).locator('[data-test-id="workflow-classification-warning"]');
}

/** canonical: workflowMetadataPermissionsPanel */
export function workflowMetadataPermissionsPanel(page: Page): Locator {
  return workflowOverviewView(page).locator('[data-test-id="workflow-permissions-panel"]');
}

/** canonical: workflowGeneratePublicLinkButton */
export function workflowGeneratePublicLinkButton(page: Page): Locator {
  return workflowOverviewView(page).getByRole('button', {
    name: 'Generate public link',
    exact: true,
  });
}

/** canonical: workflowCopyPublicLinkButton */
export function workflowCopyPublicLinkButton(page: Page): Locator {
  return workflowOverviewView(page).getByRole('button', {
    name: 'Copy public link',
    exact: true,
  });
}

/** canonical: workflowRemovePublicLinkButton */
export function workflowRemovePublicLinkButton(page: Page): Locator {
  return workflowOverviewView(page).getByRole('button', {
    name: 'Remove public link',
    exact: true,
  });
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
