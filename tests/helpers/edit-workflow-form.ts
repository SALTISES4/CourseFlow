import { expect, type Page } from '@playwright/test';

import { authenticatedApiRequest } from './api';
import type { WorkflowFixtureType } from './manifest';
import {
  editWorkflowFormCancelButton,
  editWorkflowFormDialogTitle,
  editWorkflowFormSubmitButton,
  globalMessageSnackbar,
  WORKFLOW_EDIT_FORM_VISIBLE_LABELS,
  workflowEditDescriptionField,
  workflowEditForm,
  workflowEditFormRequiredFieldLabel,
  workflowEditFormVisibleLabel,
  workflowEditSnackbarMessages,
  workflowEditTitleField,
} from '../e2e/workflow/workflow-edit-form.locators';

export type WorkflowDetailApiItem = {
  uuid: string;
  title: string;
  description: string;
  workflowType: WorkflowFixtureType;
  permissions?: {
    resourceRole: string | null;
  };
};

export async function fetchWorkflowDetail(
  page: Page,
  workflowUuid: string,
): Promise<WorkflowDetailApiItem> {
  const path = `/api/workflow/${workflowUuid}`;
  const response = await authenticatedApiRequest(page, 'GET', path);
  expect(response.ok(), `${path} returned HTTP ${response.status()}`).toBeTruthy();
  const body = (await response.json()) as { item: WorkflowDetailApiItem };
  return body.item;
}

/**
 * FR-WF-FORM-001 — edit dialog chrome, field labels, prefills, submit disabled.
 */
export async function expectEditWorkflowFormPrimaryLayoutPerFrWfForm001(
  page: Page,
  workflowUuid: string,
  workflowType: WorkflowFixtureType,
): Promise<void> {
  const workflow = await fetchWorkflowDetail(page, workflowUuid);

  await expect(editWorkflowFormDialogTitle(page, workflowType)).toHaveText(`Edit ${workflowType}`);
  await expect(workflowEditForm(page)).toBeVisible();
  await expect(
    workflowEditFormVisibleLabel(page, WORKFLOW_EDIT_FORM_VISIBLE_LABELS.title),
  ).toBeVisible();
  await expect(
    workflowEditFormRequiredFieldLabel(page, WORKFLOW_EDIT_FORM_VISIBLE_LABELS.title),
  ).toBeVisible();
  await expect(
    workflowEditFormVisibleLabel(page, WORKFLOW_EDIT_FORM_VISIBLE_LABELS.description),
  ).toBeVisible();
  await expect(workflowEditTitleField(page)).toBeVisible();
  await expect(workflowEditDescriptionField(page)).toBeVisible();
  await expect(editWorkflowFormCancelButton(page)).toHaveText('Cancel');
  await expect(editWorkflowFormSubmitButton(page, workflowType)).toHaveText(
    `Update ${workflowType}`,
  );
  await expect(workflowEditTitleField(page)).toHaveValue(workflow.title);
  await expect(workflowEditDescriptionField(page)).toHaveValue(workflow.description ?? '');
  await expect(editWorkflowFormSubmitButton(page, workflowType)).toBeDisabled();
}

/** FR-WF-FORM-003 — exact globalMessageSnackbar copy for edit workflow outcomes. */
export async function expectEditWorkflowSnackbarMessage(
  page: Page,
  message: string,
): Promise<void> {
  await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
  await expect(globalMessageSnackbar(page)).toHaveText(message, {
    exact: true,
  });
}

export { workflowEditSnackbarMessages };
