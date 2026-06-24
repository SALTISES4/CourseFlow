import { test, expect } from '../../fixtures';
import {
  deleteButtonInSidebar,
  deleteSectionCancelButton,
  deleteSectionDialog,
  editSectionForm,
  rightSidebar,
  sectionContainers,
  sectionHeader,
  titleFieldInEditSectionForm,
  EDIT_SECTION_HEADING,
} from './edit-section.locators';

/**
 * Calibration slice — FR-SEC-001, FR-SEC-003, FR-SEC-006 (cancel branch).
 * Requirements: tests/docs/requirements/features/workflow/workflow_edit_section_requirements_v1.yaml
 * Fixture: tests/.playwright-fixtures/workflow.json (`just e2e-prepare`)
 */

test.describe('Edit Section — calibration (FR-SEC-001, FR-SEC-003, FR-SEC-006)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionContainers(page).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-SEC-001: click section header opens right sidebar with Edit section form', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;

    await sectionHeader(page, sectionUuid).click();

    await expect(rightSidebar(page)).toBeVisible();
    await expect(editSectionForm(page)).toBeVisible();
    await expect(
      editSectionForm(page).getByRole('heading', { name: EDIT_SECTION_HEADING, exact: true }),
    ).toBeVisible();
  });

  test('FR-SEC-003: owner/editor title change persists after reload', async ({ page, workflow }) => {
    const section = workflow.sectionByTitle('E2E Section 3');
    const sectionUuid = section.uuid;
    const uniqueTitle = `E2E ${Date.now()}`;

    await sectionHeader(page, sectionUuid).click();
    await expect(editSectionForm(page)).toBeVisible();

    await expect(editSectionForm(page).getByRole('button', { name: /^save$/i })).toHaveCount(0);

    await titleFieldInEditSectionForm(page).fill(uniqueTitle);
    await titleFieldInEditSectionForm(page).blur();

    await expect(sectionHeader(page, sectionUuid)).toContainText(uniqueTitle, {
      timeout: 15_000,
    });

    await page.reload();
    await expect(sectionContainers(page).first()).toBeVisible();
    await sectionHeader(page, sectionUuid).click();
    await expect(titleFieldInEditSectionForm(page)).toHaveValue(uniqueTitle, {
      timeout: 15_000,
    });
  });

  test('FR-SEC-006: delete from sidebar opens modal; Cancel leaves section count unchanged', async ({
    page,
    workflow,
  }) => {
    const before = await sectionContainers(page).count();
    const sectionUuid = workflow.firstSection().uuid;

    await sectionHeader(page, sectionUuid).click();
    await deleteButtonInSidebar(page).click();

    await expect(deleteSectionDialog(page)).toBeVisible();
    expect(await sectionContainers(page).count()).toBe(before);

    await deleteSectionCancelButton(page).click();

    await expect(deleteSectionDialog(page)).toBeHidden();
    expect(await sectionContainers(page).count()).toBe(before);
  });
});
