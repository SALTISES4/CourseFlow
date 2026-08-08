import { test, expect } from '../../fixtures';
import { loginAs } from '../../helpers/auth';
import {
  expectEditWorkflowFormPrimaryLayoutPerFrWfForm001,
  expectEditWorkflowSnackbarMessage,
  fetchWorkflowDetail,
  workflowEditSnackbarMessages,
} from '../../helpers/edit-workflow-form';
import type { WorkflowFixtureType } from '../../helpers/manifest';
import { workflowTitle } from './workflow.locators';
import {
  editPencilButton,
  editWorkflowDialog,
  editWorkflowFormCancelButton,
  editWorkflowFormSubmitButton,
  openEditWorkflowDialog,
  WORKFLOW_EDIT_TITLE_MAX_LENGTH_MESSAGE,
  WORKFLOW_EDIT_TITLE_REQUIRED_MESSAGE,
  WORKFLOW_UPDATE_API_ROUTE,
  workflowEditDescriptionField,
  workflowEditFormFieldValidationMessage,
  workflowEditTitleField,
} from './workflow-edit-form.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedAssets: ['workflow.navigation_course', 'workflow.navigation_program'],
  seedDependencies: ['project.primary', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Edit workflow form — FR-WF-FORM-001, FR-WF-FORM-002, FR-WF-FORM-003.
 * Requirements: tests/docs/requirements/features/workflow/workflow_edit_form_requirements_v1.yaml
 * Auth: chromium workflow storage state (teacher@courseflow.com) unless noted.
 * Note: edit entry is workflow ActionMenu (edit-project-button), not a dedicated CAB pencil id.
 * Type-scoped dialog/action/snackbar copy and type-neutral field labels are asserted for each fixture type.
 */

const WORKFLOW_TYPES = [
  'activity',
  'course',
  'program',
] as const satisfies readonly WorkflowFixtureType[];
test.describe('Edit workflow form — FR-WF-FORM-001-003', () => {
  for (const workflowType of WORKFLOW_TYPES) {
    test.describe(`${workflowType}`, () => {
      test.beforeEach(async ({ page, workflow }) => {
        const entry = workflow.workflowByType(workflowType);
        await page.goto(entry.workflow_path);
        await expect(workflowTitle(page)).toBeVisible({ timeout: 15_000 });
      });

      test('FR-WF-FORM-001: edit dialog layout, field labels, and prefilled fields', async ({
        page,
        workflow,
      }) => {
        const entry = workflow.workflowByType(workflowType);

        await openEditWorkflowDialog(page, workflowType);
        await expectEditWorkflowFormPrimaryLayoutPerFrWfForm001(
          page,
          entry.workflow_uuid,
          workflowType,
        );
      });

      test('FR-WF-FORM-001: cancel discards title and description changes', async ({
        page,
        workflow,
      }) => {
        const entry = workflow.workflowByType(workflowType);
        const original = await fetchWorkflowDetail(page, entry.workflow_uuid);
        const routeBefore = page.url();

        await openEditWorkflowDialog(page, workflowType);
        await workflowEditTitleField(page).fill(`${original.title} mutated`);
        await workflowEditDescriptionField(page).fill('E2E cancel should discard this description');

        await editWorkflowFormCancelButton(page).click();
        await expect(editWorkflowDialog(page)).toBeHidden();
        await expect(page).toHaveURL(routeBefore);
        await expect(workflowTitle(page)).toContainText(original.title);

        await openEditWorkflowDialog(page, workflowType);
        await expect(workflowEditTitleField(page)).toHaveValue(original.title);
        await expect(workflowEditDescriptionField(page)).toHaveValue(original.description ?? '');
      });

      test('FR-WF-FORM-001: submit stays disabled until any field is changed', async ({ page }) => {
        await openEditWorkflowDialog(page, workflowType);
        await expect(editWorkflowFormSubmitButton(page, workflowType)).toBeDisabled();

        await workflowEditDescriptionField(page).fill('E2E dirty via description');
        await expect(editWorkflowFormSubmitButton(page, workflowType)).toBeEnabled();
        await editWorkflowFormCancelButton(page).click();

        await openEditWorkflowDialog(page, workflowType);
        await expect(editWorkflowFormSubmitButton(page, workflowType)).toBeDisabled();
        const originalTitle = await workflowEditTitleField(page).inputValue();
        await workflowEditTitleField(page).fill(`${originalTitle} updated`);
        await expect(editWorkflowFormSubmitButton(page, workflowType)).toBeEnabled();
      });

      test('FR-WF-FORM-002: empty title shows Title is required and keeps submit disabled', async ({
        page,
      }) => {
        await openEditWorkflowDialog(page, workflowType);
        await workflowEditTitleField(page).fill('');
        await workflowEditTitleField(page).blur();

        // FR: submit stays disabled while title is empty after trim.
        await expect.soft(editWorkflowFormSubmitButton(page, workflowType)).toBeDisabled({
          timeout: 1_000,
        });

        // Surface inline validation if the product still allows submit when empty.
        // (HTML5 `required` may block submit before RHF shows FR copy — assert FR copy anyway.)
        if (await editWorkflowFormSubmitButton(page, workflowType).isEnabled()) {
          await editWorkflowFormSubmitButton(page, workflowType).click({
            force: true,
          });
        }

        await expect(
          workflowEditFormFieldValidationMessage(page, WORKFLOW_EDIT_TITLE_REQUIRED_MESSAGE),
        ).toBeVisible();
        await expect(editWorkflowDialog(page)).toBeVisible();
      });

      test('FR-WF-FORM-002: title longer than 200 characters shows max-length message and keeps submit disabled', async ({
        page,
      }) => {
        await openEditWorkflowDialog(page, workflowType);
        await workflowEditTitleField(page).fill('x'.repeat(201));
        await workflowEditTitleField(page).blur();

        await expect(
          workflowEditFormFieldValidationMessage(page, WORKFLOW_EDIT_TITLE_MAX_LENGTH_MESSAGE),
        ).toBeVisible();
        await expect(editWorkflowFormSubmitButton(page, workflowType)).toBeDisabled();
        await expect(editWorkflowDialog(page)).toBeVisible();

        await workflowEditTitleField(page).fill('x'.repeat(200));
        await expect(
          workflowEditFormFieldValidationMessage(page, WORKFLOW_EDIT_TITLE_MAX_LENGTH_MESSAGE),
        ).toBeHidden();
        await expect(editWorkflowFormSubmitButton(page, workflowType)).toBeEnabled();
      });

      test('FR-WF-FORM-002: description field is optional', async ({ page, workflow }) => {
        const entry = workflow.workflowByType(workflowType);
        const original = await fetchWorkflowDetail(page, entry.workflow_uuid);

        await openEditWorkflowDialog(page, workflowType);
        await workflowEditTitleField(page).fill(`${original.title} with cleared description`);
        await workflowEditDescriptionField(page).fill('');

        await expect(editWorkflowFormSubmitButton(page, workflowType)).toBeEnabled();
      });

      test('FR-WF-FORM-003: successful edit closes dialog, updates workflowTitle, and shows success snackbar', async ({
        page,
        workflow,
      }) => {
        const entry = workflow.workflowByType(workflowType);
        const workflowUuid = entry.workflow_uuid;
        const updatedTitle = `E2E edit ${workflowType} ${Date.now()}`;
        const updatedDescription = `E2E edit ${workflowType} description`;
        const snackbar = workflowEditSnackbarMessages(workflowType);

        await openEditWorkflowDialog(page, workflowType);
        await workflowEditTitleField(page).fill(updatedTitle);
        await workflowEditDescriptionField(page).fill(updatedDescription);

        const routeBeforeSubmit = page.url();
        await editWorkflowFormSubmitButton(page, workflowType).click();

        await expect(editWorkflowDialog(page)).toBeHidden();
        await expect(page).toHaveURL(routeBeforeSubmit);
        await expect(workflowTitle(page)).toContainText(updatedTitle);
        await expectEditWorkflowSnackbarMessage(page, snackbar.success);

        const persisted = await fetchWorkflowDetail(page, workflowUuid);
        expect(persisted.title).toBe(updatedTitle);
        expect(persisted.description).toBe(updatedDescription);
      });

      test('FR-WF-FORM-003: failed edit keeps dialog open, retains values, and shows failure snackbar', async ({
        page,
      }) => {
        const updatedTitle = `E2E edit ${workflowType} failure ${Date.now()}`;
        const updatedDescription = `E2E edit ${workflowType} failure retained description`;
        const snackbar = workflowEditSnackbarMessages(workflowType);

        await page.route(WORKFLOW_UPDATE_API_ROUTE, (route) => {
          if (route.request().method() !== 'PATCH') {
            void route.continue();
            return;
          }

          void route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              detail: 'E2E simulated update workflow failure',
            }),
          });
        });

        await openEditWorkflowDialog(page, workflowType);
        await workflowEditTitleField(page).fill(updatedTitle);
        await workflowEditDescriptionField(page).fill(updatedDescription);
        await editWorkflowFormSubmitButton(page, workflowType).click();

        await expect(editWorkflowDialog(page)).toBeVisible();
        await expect(workflowEditTitleField(page)).toHaveValue(updatedTitle);
        await expect(workflowEditDescriptionField(page)).toHaveValue(updatedDescription);
        await expect(editWorkflowFormSubmitButton(page, workflowType)).toBeEnabled();
        await expectEditWorkflowSnackbarMessage(page, snackbar.failure);
      });
    });
  }

  test.describe('FR-WF-FORM-001 viewer roleBehavior', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-FORM-001: viewer cannot open editWorkflowDialog via editPencilButton', async ({
      page,
      workflow,
    }) => {
      const viewer = workflow.contributorByRole('viewer');
      await loginAs(page, { email: viewer.email, password: viewer.password });
      await page.goto(workflow.path);
      await expect(workflowTitle(page)).toBeVisible({ timeout: 15_000 });

      const pencil = editPencilButton(page);
      await expect(pencil).toBeVisible();
      await expect(pencil).toBeDisabled();
      await expect(editWorkflowDialog(page)).toBeHidden();
    });
  });
});
