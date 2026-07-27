import { expect, type Locator, type Page } from '@playwright/test';

import { globalMessageSnackbar } from '../../shared/locators/global';
import type { WorkflowFixtureType } from '../../helpers/manifest';

/**
 * Edit workflow dialog uiObjects — workflow_edit_form_requirements_v1.yaml /
 * canonical_locators.yaml (editPencilButton, editWorkflowDialog, …).
 *
 * Note: edit entry is workflow ActionMenu (`data-test-id="edit-project-button"`,
 * menu uuid `edit-project`), not a dedicated contextActionBar pencil id.
 */

export const WORKFLOW_EDIT_TITLE_REQUIRED_MESSAGE = 'Title is required';
export const WORKFLOW_EDIT_TITLE_MAX_LENGTH_MESSAGE =
  'Title cannot be longer than 200 characters';

export const WORKFLOW_UPDATE_API_ROUTE = '**/api/workflow/*';

/** Visible field labels — shared with create blank form (workflow_create_stepped_form_requirements_v1.yaml). */
export const WORKFLOW_EDIT_FORM_VISIBLE_LABELS = {
  title: 'Title',
} as const;

export function workflowEditDescriptionVisibleLabel(
  workflowType: WorkflowFixtureType,
): string {
  const typeLabel = workflowType.charAt(0).toUpperCase() + workflowType.slice(1);
  return `${typeLabel} description`;
}

export function workflowEditSnackbarMessages(workflowType: WorkflowFixtureType) {
  return {
    success: `Your ${workflowType} has been successfully updated`,
    failure: `We encountered an issue and your ${workflowType} was not updated`,
  } as const;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** canonical: editPencilButton (workflow routes) */
export function editPencilButton(page: Page): Locator {
  return page.locator('[data-test-id="edit-project-button"]');
}

/** canonical: editWorkflowDialog */
export function editWorkflowDialog(page: Page): Locator {
  return page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: /^Edit (activity|course|program)$/ }),
  });
}

/** canonical: editWorkflowFormDialogTitle */
export function editWorkflowFormDialogTitle(
  page: Page,
  workflowType: WorkflowFixtureType,
): Locator {
  return editWorkflowDialog(page).getByRole('heading', {
    name: `Edit ${workflowType}`,
    exact: true,
  });
}

/** canonical: workflowEditForm */
export function workflowEditForm(page: Page): Locator {
  return editWorkflowDialog(page).locator('form');
}

/** Visible label text on workflowEditForm (not accessibility-name inference). */
export function workflowEditFormVisibleLabel(page: Page, label: string): Locator {
  // MUI required markers use U+2009 thin space before '*', not a regular space.
  return workflowEditForm(page).locator('label').filter({
    hasText: new RegExp(`^${escapeRegExp(label)}([\\s\\u2009]*\\*)?$`),
  });
}

/** FR — required Title shows MUI mandatory asterisk. */
export function workflowEditFormRequiredFieldLabel(page: Page, label: string): Locator {
  return workflowEditForm(page)
    .locator('label')
    .filter({ hasText: new RegExp(`^${escapeRegExp(label)}`) })
    .filter({ has: page.locator('.MuiFormLabel-asterisk') });
}

/** canonical: workflowTitleField (edit dialog) */
export function workflowEditTitleField(page: Page): Locator {
  return editWorkflowDialog(page).getByLabel(/^Title([\s\u2009]*\*)?$/);
}

/**
 * canonical: workflowDescriptionField (edit dialog)
 * Product label uses capitalized type (`Activity description`); match case-insensitively.
 */
export function workflowEditDescriptionField(
  page: Page,
  workflowType: WorkflowFixtureType,
): Locator {
  return editWorkflowDialog(page).getByLabel(
    new RegExp(`^${workflowType} description$`, 'i'),
  );
}

/** canonical: workflowFormFieldValidationMessage */
export function workflowEditFormFieldValidationMessage(
  page: Page,
  message: string,
): Locator {
  return editWorkflowDialog(page).getByText(message, { exact: true });
}

/** canonical: editWorkflowFormCancelButton */
export function editWorkflowFormCancelButton(page: Page): Locator {
  return editWorkflowDialog(page).getByRole('button', { name: 'Cancel', exact: true });
}

/** canonical: editWorkflowFormSubmitButton */
export function editWorkflowFormSubmitButton(
  page: Page,
  workflowType: WorkflowFixtureType,
): Locator {
  return editWorkflowDialog(page).getByRole('button', {
    name: `Update ${workflowType}`,
    exact: true,
  });
}

export async function openEditWorkflowDialog(
  page: Page,
  workflowType: WorkflowFixtureType,
): Promise<void> {
  await expect(editPencilButton(page)).toBeVisible({ timeout: 15_000 });
  await editPencilButton(page).click();
  await expect(editWorkflowFormDialogTitle(page, workflowType)).toBeVisible({
    timeout: 15_000,
  });
}

export { globalMessageSnackbar };
