import { expect, type Locator, type Page } from '@playwright/test';

import {
  workflowContributorRoleControl,
  workflowContributorRow,
  workflowMetadataFieldCode,
  workflowMetadataFieldCredits,
  workflowMetadataFieldDescription,
  workflowMetadataFieldGeneralTime,
  workflowMetadataFieldIndividualTime,
  workflowMetadataFieldPracticalTime,
  workflowMetadataFieldSpecificTime,
  workflowMetadataFieldTheoryTime,
  workflowMetadataFieldTime,
  workflowMetadataPermissionsPanel,
  workflowMetadataPonderationSection,
  workflowMetadataSwitchCalculateClassificationAutomatically,
  workflowMetadataSwitchCalculateCreditsAutomatically,
  workflowMetadataSwitchCalculatePonderationAutomatically,
  workflowMetadataSwitchCalculateTimeAutomatically,
  workflowOverviewView,
  workflowOwnerRoleControl,
} from '../e2e/workflow/workflow-overview.locators';
import {
  contributorRoleDropdown,
  projectContributorRow,
  projectOverviewView,
  projectOwnerRoleControl,
} from '../e2e/project/project.locators';

/**
 * FR duration-type display (FR-WF-OV-003/004/006 ACs) — values render with an hours unit
 * (e.g. '5 hours'), not a bare numeric `type=number` value.
 */
export async function expectOverviewDurationFieldDisplaysHours(
  field: Locator,
  hours?: number,
): Promise<void> {
  await expect(field).toBeVisible();
  if (hours === undefined) {
    await expect(field).toHaveValue(/^\d+(\.\d+)?\s+hours?$/i);
    return;
  }
  await expect(field).toHaveValue(new RegExp(`^${hours}\\s+hours?$`, 'i'));
}

/**
 * FR-WF-OV-002 — Description is display-only on Overview (not an in-place textbox).
 */
async function expectDescriptionDisplayOnlyPerFrWfOv002(page: Page): Promise<void> {
  await expect(workflowMetadataFieldDescription(page)).toBeVisible();
  await expect(
    workflowOverviewView(page).getByRole('textbox', { name: 'Description' }),
  ).toHaveCount(0);
}

/**
 * FR-WF-OV-001 + FR-WF-OV-002 — activity workflowOverviewView field composition
 * (Description display-only; Code omitted).
 */
export async function expectActivityOverviewMetadataCompositionPerFrWfOv001(
  page: Page,
): Promise<void> {
  await expect(workflowOverviewView(page)).toBeVisible();

  await expectDescriptionDisplayOnlyPerFrWfOv002(page);
  await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeVisible();
  await expect(workflowMetadataFieldTime(page)).toBeVisible();
  await expect(workflowMetadataPermissionsPanel(page)).toBeVisible();

  await expect(workflowMetadataFieldCode(page)).toHaveCount(0);
  await expect(workflowMetadataPonderationSection(page)).toHaveCount(0);
  await expect(workflowMetadataSwitchCalculatePonderationAutomatically(page)).toHaveCount(0);
  await expect(workflowMetadataFieldTheoryTime(page)).toHaveCount(0);
  await expect(workflowMetadataFieldPracticalTime(page)).toHaveCount(0);
  await expect(workflowMetadataFieldIndividualTime(page)).toHaveCount(0);
  await expect(workflowMetadataFieldCredits(page)).toHaveCount(0);
  await expect(workflowMetadataSwitchCalculateCreditsAutomatically(page)).toHaveCount(0);
  await expect(workflowMetadataSwitchCalculateClassificationAutomatically(page)).toHaveCount(0);
  await expect(workflowMetadataFieldGeneralTime(page)).toHaveCount(0);
  await expect(workflowMetadataFieldSpecificTime(page)).toHaveCount(0);
}

/**
 * FR-WF-OV-001 + FR-WF-OV-002 — course workflowOverviewView field composition
 * (Description display-only; Code present).
 */
export async function expectCourseOverviewMetadataCompositionPerFrWfOv001(
  page: Page,
): Promise<void> {
  await expect(workflowOverviewView(page)).toBeVisible();

  await expectDescriptionDisplayOnlyPerFrWfOv002(page);
  await expect(workflowMetadataFieldCode(page)).toBeVisible();
  await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeVisible();
  await expect(workflowMetadataFieldTime(page)).toBeVisible();
  await expect(workflowMetadataPonderationSection(page)).toBeVisible();
  await expect(workflowMetadataFieldTheoryTime(page)).toBeVisible();
  await expect(workflowMetadataFieldPracticalTime(page)).toBeVisible();
  await expect(workflowMetadataFieldIndividualTime(page)).toBeVisible();
  await expect(workflowMetadataFieldCredits(page)).toBeVisible();
  await expect(workflowMetadataPermissionsPanel(page)).toBeVisible();

  await expect(workflowMetadataSwitchCalculatePonderationAutomatically(page)).toHaveCount(0);
  await expect(workflowMetadataSwitchCalculateCreditsAutomatically(page)).toHaveCount(0);
  await expect(workflowMetadataSwitchCalculateClassificationAutomatically(page)).toHaveCount(0);
  await expect(workflowMetadataFieldGeneralTime(page)).toHaveCount(0);
  await expect(workflowMetadataFieldSpecificTime(page)).toHaveCount(0);
}

/**
 * FR-WF-OV-001 + FR-WF-OV-002 — program workflowOverviewView field composition
 * (Description display-only; Code present).
 */
export async function expectProgramOverviewMetadataCompositionPerFrWfOv001(
  page: Page,
): Promise<void> {
  await expect(workflowOverviewView(page)).toBeVisible();

  await expectDescriptionDisplayOnlyPerFrWfOv002(page);
  await expect(workflowMetadataFieldCode(page)).toBeVisible();
  await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeVisible();
  await expect(workflowMetadataFieldTime(page)).toBeVisible();
  await expect(workflowMetadataPonderationSection(page)).toBeVisible();
  await expect(workflowMetadataFieldTheoryTime(page)).toBeVisible();
  await expect(workflowMetadataFieldPracticalTime(page)).toBeVisible();
  await expect(workflowMetadataFieldIndividualTime(page)).toBeVisible();
  await expect(workflowMetadataSwitchCalculatePonderationAutomatically(page)).toBeVisible();
  await expect(workflowMetadataFieldCredits(page)).toBeVisible();
  await expect(workflowMetadataSwitchCalculateCreditsAutomatically(page)).toBeVisible();
  await expect(workflowMetadataSwitchCalculateClassificationAutomatically(page)).toBeVisible();
  await expect(workflowMetadataFieldGeneralTime(page)).toBeVisible();
  await expect(workflowMetadataFieldSpecificTime(page)).toBeVisible();
  await expect(workflowMetadataPermissionsPanel(page)).toBeVisible();
}

/**
 * FR-WF-OV-003 — ensure Time Auto-calculate is OFF and Time is editable (owner/editor).
 * Time remains a duration-type field (displays an hours unit per FR ACs).
 */
export async function expectTimeEditableWhenAutoCalculateOffPerFrWfOv003(
  page: Page,
): Promise<void> {
  const autoCalculate = workflowMetadataSwitchCalculateTimeAutomatically(page);
  await expect(autoCalculate).toBeVisible();
  await expect(workflowMetadataFieldTime(page)).toBeVisible();

  if (await autoCalculate.isChecked()) {
    await autoCalculate.uncheck();
  }
  await expect(autoCalculate).not.toBeChecked();
  await expect(workflowMetadataFieldTime(page)).toBeEnabled();
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldTime(page));
}

/**
 * FR-WF-OV-003 — ensure Time Auto-calculate is ON and Time is read-only (owner/editor).
 * Calculated display is duration-type (e.g. '5 hours').
 */
export async function expectTimeReadOnlyWhenAutoCalculateOnPerFrWfOv003(
  page: Page,
): Promise<void> {
  const autoCalculate = workflowMetadataSwitchCalculateTimeAutomatically(page);
  await expect(autoCalculate).toBeVisible();
  await expect(workflowMetadataFieldTime(page)).toBeVisible();

  await autoCalculate.check();
  await expect(autoCalculate).toBeChecked();
  await expect(workflowMetadataFieldTime(page)).toBeDisabled();
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldTime(page));
}

/**
 * FR-WF-OV-004 — course: Theory, Practical, and Individual are editable (no Auto-calculate switch).
 * Ponderation fields are duration-type (display hours unit per FR ACs).
 */
export async function expectCoursePonderationFieldsEditablePerFrWfOv004(
  page: Page,
): Promise<void> {
  await expect(workflowMetadataFieldTheoryTime(page)).toBeEnabled();
  await expect(workflowMetadataFieldPracticalTime(page)).toBeEnabled();
  await expect(workflowMetadataFieldIndividualTime(page)).toBeEnabled();
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldTheoryTime(page));
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldPracticalTime(page));
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldIndividualTime(page));
}

/**
 * FR-WF-OV-004 — program: Ponderation Auto-calculate OFF → Theory/Practical/Individual editable.
 */
export async function expectPonderationEditableWhenAutoCalculateOffPerFrWfOv004(
  page: Page,
): Promise<void> {
  const autoCalculate = workflowMetadataSwitchCalculatePonderationAutomatically(page);
  await expect(autoCalculate).toBeVisible();

  if (await autoCalculate.isChecked()) {
    await autoCalculate.uncheck();
  }
  await expect(autoCalculate).not.toBeChecked();
  await expect(workflowMetadataFieldTheoryTime(page)).toBeEnabled();
  await expect(workflowMetadataFieldPracticalTime(page)).toBeEnabled();
  await expect(workflowMetadataFieldIndividualTime(page)).toBeEnabled();
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldTheoryTime(page));
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldPracticalTime(page));
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldIndividualTime(page));
}

/**
 * FR-WF-OV-004 — program: Ponderation Auto-calculate ON → Theory/Practical/Individual read-only.
 * Calculated ponderation totals are duration-type (e.g. '25 hours').
 */
export async function expectPonderationReadOnlyWhenAutoCalculateOnPerFrWfOv004(
  page: Page,
): Promise<void> {
  const autoCalculate = workflowMetadataSwitchCalculatePonderationAutomatically(page);
  await expect(autoCalculate).toBeVisible();

  await autoCalculate.check();
  await expect(autoCalculate).toBeChecked();
  await expect(workflowMetadataFieldTheoryTime(page)).toBeDisabled();
  await expect(workflowMetadataFieldPracticalTime(page)).toBeDisabled();
  await expect(workflowMetadataFieldIndividualTime(page)).toBeDisabled();
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldTheoryTime(page));
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldPracticalTime(page));
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldIndividualTime(page));
}

/**
 * FR-WF-OV-005 — course: Credits is editable (no Auto-calculate switch).
 */
export async function expectCourseCreditsEditablePerFrWfOv005(page: Page): Promise<void> {
  await expect(workflowMetadataFieldCredits(page)).toBeEnabled();
}

/**
 * FR-WF-OV-005 — program: Credits Auto-calculate OFF → Credits editable.
 */
export async function expectCreditsEditableWhenAutoCalculateOffPerFrWfOv005(
  page: Page,
): Promise<void> {
  const autoCalculate = workflowMetadataSwitchCalculateCreditsAutomatically(page);
  await expect(autoCalculate).toBeVisible();

  if (await autoCalculate.isChecked()) {
    await autoCalculate.uncheck();
  }
  await expect(autoCalculate).not.toBeChecked();
  await expect(workflowMetadataFieldCredits(page)).toBeEnabled();
}

/**
 * FR-WF-OV-005 — program: Credits Auto-calculate ON → Credits read-only.
 */
export async function expectCreditsReadOnlyWhenAutoCalculateOnPerFrWfOv005(
  page: Page,
): Promise<void> {
  const autoCalculate = workflowMetadataSwitchCalculateCreditsAutomatically(page);
  await expect(autoCalculate).toBeVisible();

  await autoCalculate.check();
  await expect(autoCalculate).toBeChecked();
  await expect(workflowMetadataFieldCredits(page)).toBeDisabled();
}

/**
 * FR-WF-OV-006 — program: Classification Auto-calculate OFF → General/Specific editable.
 */
export async function expectClassificationEditableWhenAutoCalculateOffPerFrWfOv006(
  page: Page,
): Promise<void> {
  const autoCalculate = workflowMetadataSwitchCalculateClassificationAutomatically(page);
  await expect(autoCalculate).toBeVisible();

  if (await autoCalculate.isChecked()) {
    await autoCalculate.uncheck();
  }
  await expect(autoCalculate).not.toBeChecked();
  await expect(workflowMetadataFieldGeneralTime(page)).toBeEnabled();
  await expect(workflowMetadataFieldSpecificTime(page)).toBeEnabled();
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldGeneralTime(page));
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldSpecificTime(page));
}

/**
 * FR-WF-OV-006 — program: Classification Auto-calculate ON → General/Specific read-only.
 * Calculated classification totals are duration-type (e.g. '2 hours').
 */
export async function expectClassificationReadOnlyWhenAutoCalculateOnPerFrWfOv006(
  page: Page,
): Promise<void> {
  const autoCalculate = workflowMetadataSwitchCalculateClassificationAutomatically(page);
  await expect(autoCalculate).toBeVisible();

  await autoCalculate.check();
  await expect(autoCalculate).toBeChecked();
  await expect(workflowMetadataFieldGeneralTime(page)).toBeDisabled();
  await expect(workflowMetadataFieldSpecificTime(page)).toBeDisabled();
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldGeneralTime(page));
  await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldSpecificTime(page));
}

/**
 * FR-WF-OV-007 — workflowMetadataPermissionsPanel is read-only: no add/remove/role change.
 * Assert as owner (strongest case — owner can edit the same panel on the project).
 */
export async function expectWorkflowPermissionsPanelReadOnlyPerFrWfOv007(
  page: Page,
  contributorEmails: string[],
): Promise<void> {
  await expect(workflowMetadataPermissionsPanel(page)).toBeVisible();

  await expect(
    workflowOverviewView(page).getByRole('button', { name: 'Add CourseFlow user', exact: true }),
  ).toHaveCount(0);

  await expect(workflowOwnerRoleControl(page)).toBeVisible();
  await expect(workflowOwnerRoleControl(page)).toBeDisabled();
  await workflowOwnerRoleControl(page).click({ force: true });
  await expect(page.getByRole('menu')).toHaveCount(0);

  for (const email of contributorEmails) {
    const roleControl = workflowContributorRoleControl(page, email);
    await expect(workflowContributorRow(page, email)).toBeVisible();
    await expect(roleControl).toBeVisible();
    await expect(roleControl).toBeDisabled();
    await roleControl.click({ force: true });
    await expect(page.getByRole('menu')).toHaveCount(0);
  }
}

/**
 * FR-WF-OV-007 — workflow permissions users/roles match parent projectMetadataPermissionsPanel.
 */
export async function expectWorkflowPermissionsMatchParentProjectPerFrWfOv007(
  page: Page,
  options: {
    projectPath: string;
    workflowOverviewUrl: string;
    contributorEmails: string[];
  },
): Promise<void> {
  await page.goto(options.projectPath);
  await expect(projectOverviewView(page)).toBeVisible({ timeout: 15_000 });

  const contributorSnapshot: { email: string; roleText: string }[] = [];
  for (const email of options.contributorEmails) {
    await expect(projectContributorRow(page, email)).toBeVisible();
    const roleText = (await contributorRoleDropdown(page, email).innerText()).trim();
    contributorSnapshot.push({ email, roleText });
  }

  await expect(projectOwnerRoleControl(page)).toBeVisible();
  const ownerRoleText = (await projectOwnerRoleControl(page).innerText()).trim();

  await page.goto(options.workflowOverviewUrl);
  await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
  await expect(workflowMetadataPermissionsPanel(page)).toBeVisible();

  for (const { email, roleText } of contributorSnapshot) {
    await expect(workflowContributorRow(page, email)).toBeVisible();
    await expect(workflowContributorRoleControl(page, email)).toHaveText(roleText);
  }

  await expect(workflowOwnerRoleControl(page)).toBeVisible();
  await expect(workflowOwnerRoleControl(page)).toHaveText(ownerRoleText);
}
