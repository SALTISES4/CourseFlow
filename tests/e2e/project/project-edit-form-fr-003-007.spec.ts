import { test, expect } from '@playwright/test';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { getProjectPath, loadWorkflowManifest } from '../../helpers/manifest';
import {
  createProjectDialog,
  editProjectFormDialogTitle,
  editProjectFormSubmitButton,
  openEditProjectDialog,
  projectDescriptionField,
  projectFormCancelButton,
  projectTitle,
  projectTitleField,
  waitForProjectOverviewLoaded,
} from './project.locators';

/**
 * Calibration slice — FR-PROJ-FORM-003, FR-PROJ-FORM-007 (partial).
 * Requirements: tests/docs/requirements/features/project/project_edit_form_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com).
 * Note: edit entry is project ActionMenu (edit-project-button), not contextActionBar pencil.
 */

test.describe('Edit project form — calibration (FR-PROJ-FORM-003-007)', () => {
  const manifest = loadWorkflowManifest();
  const projectPath = getProjectPath(manifest);

  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, projectPath);
    await waitForProjectOverviewLoaded(page);
  });

  test('FR-PROJ-FORM-003: edit dialog opens prefilled and submit disabled until dirty', async ({ page }) => {
    await openEditProjectDialog(page);

    await expect(editProjectFormDialogTitle(page)).toBeVisible();
    await expect(projectTitleField(page)).toHaveValue(manifest.project_title);
    await expect(editProjectFormSubmitButton(page)).toBeDisabled();

    await projectDescriptionField(page).fill('E2E edit description touch');
    await expect(editProjectFormSubmitButton(page)).toBeEnabled();
  });

  test('FR-PROJ-FORM-003: cancel discards changes and keeps project title', async ({ page }) => {
    const originalTitle = await projectTitle(page).innerText();

    await openEditProjectDialog(page);
    await projectTitleField(page).fill(`${originalTitle} mutated`);
    await projectFormCancelButton(page).click();
    await expect(createProjectDialog(page)).toBeHidden();
    await expect(projectTitle(page)).toHaveText(originalTitle);

    await openEditProjectDialog(page);
    await expect(projectTitleField(page)).toHaveValue(originalTitle);
  });

  test('FR-PROJ-FORM-007: title change enables submit (inline validation resolver not wired)', async ({ page }) => {
    await openEditProjectDialog(page);
    await projectTitleField(page).fill(`${manifest.project_title} updated`);
    await expect(editProjectFormSubmitButton(page)).toBeEnabled();
    await projectFormCancelButton(page).click();
  });
});
