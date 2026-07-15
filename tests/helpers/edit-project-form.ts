import { expect, type Page } from '@playwright/test';

import {
  PROJECT_EDIT_SNACKBAR_MESSAGES,
  PROJECT_OVERVIEW_EMPTY_METADATA_VALUE,
  PROJECT_OVERVIEW_METADATA_LABELS,
  editProjectFormDialogTitle,
  editProjectFormSubmitButton,
  globalMessageSnackbar,
  projectDescriptionField,
  projectDisciplineField,
  projectFormCancelButton,
  projectStartWithProjectAlert,
  projectStartWithProjectAlertRegion,
  projectTitleField,
} from '../e2e/project/project.locators';
import { expectCreateProjectFormVisibleLabelsPerFrProjForm001 } from './create-project-form';
import {
  fetchProjectDetail,
  projectMetadataBlockDisplayedValue,
} from './project-overview';

function parseCommaSeparatedDisciplines(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Loaded project discipline labels from overview metadata (source of truth before edit opens). */
export async function loadedProjectDisciplineLabelsFromOverview(page: Page): Promise<string[]> {
  const displayed = await projectMetadataBlockDisplayedValue(
    page,
    PROJECT_OVERVIEW_METADATA_LABELS.disciplines,
  );
  // FR empty value is '-'; app still shows 'No disciplines found.' — neither is a discipline label.
  if (
    displayed === PROJECT_OVERVIEW_EMPTY_METADATA_VALUE ||
    displayed === 'No disciplines found.'
  ) {
    return [];
  }
  return parseCommaSeparatedDisciplines(displayed);
}

/** Selected discipline chip labels currently shown on projectDisciplineField. */
export async function projectDisciplineFieldSelectedLabels(page: Page): Promise<string[]> {
  const chips = projectDisciplineField(page).locator('.MuiChip-label');
  const count = await chips.count();
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    labels.push((await chips.nth(i).innerText()).trim());
  }
  return labels;
}

/**
 * FR-PROJ-FORM-003 — edit dialog chrome, shared labels/required Title, prefills, submit disabled.
 * Prefill expectations: title/description from project detail API; disciplines from overview metadata.
 */
export async function expectEditProjectFormPrimaryLayoutPerFrProjForm003(
  page: Page,
  projectUuid: string,
  expectedDisciplineLabels: string[],
): Promise<void> {
  const project = await fetchProjectDetail(page, projectUuid);

  await expect(editProjectFormDialogTitle(page)).toHaveText('Edit project');
  await expect(projectStartWithProjectAlertRegion(page)).toBeHidden();
  await expect(projectStartWithProjectAlert(page)).toBeHidden();
  await expectCreateProjectFormVisibleLabelsPerFrProjForm001(page);
  await expect(projectTitleField(page)).toBeVisible();
  await expect(projectDescriptionField(page)).toBeVisible();
  await expect(projectDisciplineField(page)).toBeVisible();
  await expect(projectFormCancelButton(page)).toHaveText('Cancel');
  await expect(editProjectFormSubmitButton(page)).toHaveText('Update project');
  await expect(projectTitleField(page)).toHaveValue(project.title);
  await expect(projectDescriptionField(page)).toHaveValue(project.description ?? '');
  expect([...await projectDisciplineFieldSelectedLabels(page)].sort((a, b) => a.localeCompare(b))).toEqual(
    [...expectedDisciplineLabels].sort((a, b) => a.localeCompare(b)),
  );
  await expect(editProjectFormSubmitButton(page)).toBeDisabled();
}

/** FR-PROJ-FORM-006 — exact globalMessageSnackbar copy for edit project outcomes. */
export async function expectEditProjectSnackbarMessage(
  page: Page,
  message: string,
): Promise<void> {
  await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
  await expect(globalMessageSnackbar(page)).toHaveText(message, { exact: true });
}

export { PROJECT_EDIT_SNACKBAR_MESSAGES };
