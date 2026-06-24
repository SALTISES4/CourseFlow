import { test, expect } from '../../fixtures';
import { loginAs } from '../../helpers/auth';
import {
  deleteButtonInSidebar,
  deleteSectionConfirmButton,
  deleteSectionDialog,
  duplicateButtonInSidebar,
  editSectionForm,
  insertBelowButtonInSectionHeader,
  rightSidebar,
  sectionContainers,
  sectionHeader,
  sectionNumberLabel,
  titleFieldInEditSectionForm,
} from './edit-section.locators';

/**
 * Phase 2 — extended edit-section FRs.
 * Requirements: workflow_edit_section_requirements_v1.yaml (+ duplicate/delete YAMLs for FR-SEC-005/006).
 * Mutating tests run serially so section count stays predictable.
 */

test.describe('Edit Section — display and navigation (FR-SEC-001 branch, FR-SEC-002)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-SEC-002: blank-title section shows workflowSectionNumberLabel only', async ({
    page,
    workflow,
  }) => {
    const blank = workflow.blankSection();
    const displayIndex = String(blank.position + 1);

    await expect(sectionNumberLabel(page, blank.uuid)).toHaveText(displayIndex);
    await expect(sectionHeader(page, blank.uuid)).not.toContainText('E2E Section');
  });

  test('FR-SEC-002: titled section shows workflowSectionNumberLabel and title text', async ({
    page,
    workflow,
  }) => {
    const titled = workflow.sectionByTitle('E2E Section 1');
    await expect(sectionNumberLabel(page, titled.uuid)).toHaveText('1');
    await expect(sectionHeader(page, titled.uuid)).toContainText('E2E Section 1');
  });

  test('FR-SEC-001: sidebar already open — click different section header rebinds form', async ({
    page,
    workflow,
  }) => {
    const first = workflow.firstSection();
    const third = workflow.sectionByTitle('E2E Section 3');

    await sectionHeader(page, first.uuid).click();
    await expect(editSectionForm(page)).toBeVisible();

    await sectionHeader(page, third.uuid).click();
    await expect(editSectionForm(page)).toBeVisible();
    await expect(titleFieldInEditSectionForm(page)).toHaveValue('E2E Section 3', {
      timeout: 15_000,
    });
  });
});

test.describe('Edit Section — mutations (FR-SEC-004, FR-SEC-005, FR-SEC-006 confirm)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-SEC-004: insert section below increases count', async ({ page, workflow }) => {
    const target = workflow.firstSection();
    const before = await sectionContainers(page).count();

    await sectionHeader(page, target.uuid).hover();
    await insertBelowButtonInSectionHeader(page, target.uuid).click();

    await expect(sectionContainers(page)).toHaveCount(before + 1, { timeout: 15_000 });
  });

  test('FR-SEC-005: duplicate from sidebar adds section with (copy) title', async ({
    page,
    workflow,
  }) => {
    const source = workflow.firstSection();
    const before = await sectionContainers(page).count();

    await sectionHeader(page, source.uuid).click();
    await expect(editSectionForm(page)).toBeVisible();
    await duplicateButtonInSidebar(page).click();

    await expect(sectionContainers(page)).toHaveCount(before + 1, { timeout: 15_000 });
    await expect(sectionContainers(page).filter({ hasText: 'E2E Section 1 (copy)' })).toHaveCount(
      1,
    );
  });

  test('FR-SEC-006: confirm delete removes target section', async ({ page, workflow }) => {
    const disposable = workflow.sectionByTitle('E2E Section 3');
    const before = await sectionContainers(page).count();

    await sectionHeader(page, disposable.uuid).click();
    await deleteButtonInSidebar(page).click();
    await expect(deleteSectionDialog(page)).toBeVisible();
    await deleteSectionConfirmButton(page).click();

    await expect(deleteSectionDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect(sectionContainers(page)).toHaveCount(before - 1, { timeout: 15_000 });
    await expect(page.locator(`[data-section-id="${disposable.uuid}"]`)).toHaveCount(0);
  });
});

test.describe('Edit Section — viewer read-only (FR-SEC-003)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('FR-SEC-003: viewer cannot edit workflowEditSectionFormTitleField', async ({
    page,
    workflow,
  }) => {
    const viewer = workflow.contributorByRole('viewer');
    await loginAs(page, { email: viewer.email, password: viewer.password });
    await page.goto(workflow.path);

    const sectionUuid = workflow.firstSection().uuid;
    await sectionHeader(page, sectionUuid).click();
    await expect(editSectionForm(page)).toBeVisible();
    await expect(titleFieldInEditSectionForm(page)).toBeDisabled();
  });
});
