import { expect, type Page } from '@playwright/test';

import { authenticatedApiRequest } from './api';

import {
  PROJECT_CREATE_FORM_REQUIRED_FIELD_LABELS,
  PROJECT_CREATE_FORM_VISIBLE_LABELS,
  PROJECT_CREATE_SNACKBAR_MESSAGES,
  PROJECT_FORM_VALIDATION_MESSAGES,
  PROJECT_START_WITH_PROJECT_ALERT_COPY,
  createProjectDialog,
  createProjectFormDialogTitle,
  createProjectFormSubmitButton,
  globalMessageSnackbar,
  projectDescriptionField,
  projectDisciplineField,
  projectFormCancelButton,
  projectFormFieldValidationMessage,
  projectFormRequiredFieldLabel,
  projectFormVisibleLabel,
  projectStartWithProjectAlert,
  projectStartWithProjectAlertRegion,
  projectTitleField,
} from '../e2e/project/project.locators';

type LibrarySearchResponse = {
  meta: { totalResults: number };
};

/** Count owned projects for the current session via library search API. */
export async function countOwnedProjects(page: Page): Promise<number> {
  const response = await authenticatedApiRequest(page, 'POST', '/api/library/search', {
    data: {
      filters: {
        contentType: 'project',
        ownership: 'owned',
      },
      pagination: { page: 0, resultsPerPage: 1 },
    },
  });
  expect(response.ok(), `Library search returned HTTP ${response.status()}`).toBeTruthy();
  const body = (await response.json()) as LibrarySearchResponse;
  return body.meta.totalResults;
}

export async function expectUserOwnsAtLeastOneProject(page: Page): Promise<void> {
  expect(await countOwnedProjects(page)).toBeGreaterThan(0);
}

export async function expectUserOwnsNoProjects(page: Page): Promise<void> {
  expect(await countOwnedProjects(page)).toBe(0);
}

/** FR-PROJ-FORM-001 — visible labels; required Title shows MUI FormLabel asterisk. */
export async function expectCreateProjectFormVisibleLabelsPerFrProjForm001(
  page: Page,
): Promise<void> {
  await expect(
    projectFormVisibleLabel(page, PROJECT_CREATE_FORM_VISIBLE_LABELS.title),
  ).toBeVisible();
  await expect(
    projectFormVisibleLabel(page, PROJECT_CREATE_FORM_VISIBLE_LABELS.description),
  ).toBeVisible();
  await expect(
    projectFormVisibleLabel(page, PROJECT_CREATE_FORM_VISIBLE_LABELS.disciplines),
  ).toBeVisible();

  for (const requiredLabel of PROJECT_CREATE_FORM_REQUIRED_FIELD_LABELS) {
    await expect(projectFormRequiredFieldLabel(page, requiredLabel)).toBeVisible();
  }
}

/** FR-PROJ-FORM-001 — dialog title, fields, buttons, and empty initial values. */
export async function expectCreateProjectFormPrimaryLayoutPerFrProjForm001(
  page: Page,
): Promise<void> {
  await expect(createProjectFormDialogTitle(page)).toHaveText('Create project');
  await expectCreateProjectFormVisibleLabelsPerFrProjForm001(page);
  await expect(projectTitleField(page)).toBeVisible();
  await expect(projectDescriptionField(page)).toBeVisible();
  await expect(projectDisciplineField(page)).toBeVisible();
  await expect(projectFormCancelButton(page)).toHaveText('Cancel');
  await expect(createProjectFormSubmitButton(page)).toHaveText('Create project');
  await expect(projectTitleField(page)).toHaveValue('');
  await expect(projectDescriptionField(page)).toHaveValue('');
  await expect(createProjectFormSubmitButton(page)).toBeDisabled();
}

/** FR-PROJ-FORM-002 — onboarding alert copy and placement above project fields. */
export async function expectProjectStartWithProjectAlertVisiblePerFrProjForm002(
  page: Page,
): Promise<void> {
  await expect(projectStartWithProjectAlertRegion(page)).toBeVisible();
  await expect(projectStartWithProjectAlert(page)).toBeVisible();
  await expect(
    createProjectDialog(page).getByText(PROJECT_START_WITH_PROJECT_ALERT_COPY.subtitle, {
      exact: true,
    }),
  ).toBeVisible();

  const alertBox = await projectStartWithProjectAlertRegion(page).boundingBox();
  const titleFieldBox = await projectTitleField(page).boundingBox();
  expect(alertBox).not.toBeNull();
  expect(titleFieldBox).not.toBeNull();
  expect(alertBox!.y).toBeLessThan(titleFieldBox!.y);
}

export function projectTitleAtMaxLength(): string {
  return 'P'.repeat(200);
}

export function projectTitleOverMaxLength(): string {
  return 'P'.repeat(201);
}

/** FR-PROJ-FORM-005 — exact globalMessageSnackbar copy for create project outcomes. */
export async function expectCreateProjectSnackbarMessage(
  page: Page,
  message: string,
): Promise<void> {
  await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
  await expect(globalMessageSnackbar(page)).toHaveText(message, { exact: true });
}

export async function expectCreateProjectTitleValidationMessage(
  page: Page,
  message: string,
): Promise<void> {
  await expect(projectFormFieldValidationMessage(page, message)).toBeVisible();
}

export {
  PROJECT_CREATE_SNACKBAR_MESSAGES,
  PROJECT_FORM_VALIDATION_MESSAGES,
};
