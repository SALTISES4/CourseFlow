import { test, expect } from '../../fixtures';
import {
  deleteButtonInSectionHeader,
  deleteSectionCancelButton,
  deleteSectionConfirmButton,
  deleteSectionDialog,
  sectionContainers,
  sectionHeader,
  sectionHoverMenu,
} from './edit-section.locators';
import {
  workflowSectionDeleteDialogBody,
  workflowSectionDeleteDialogTitle,
} from '../../shared/locators/workflow';

test.use({ seedAsset: 'workflow.standard_activity', actorAsset: 'actor.teacher', seedAccess: 'disposable-copy' });

/**
 * Delete section — hover path and dialog (FR-SEC-006).
 * Requirements: workflow_delete_section_requirements_v1.yaml
 * Sidebar cancel/confirm: edit-section-fr-001-012.spec.ts
 */

async function hoverSectionHeader(page: import('@playwright/test').Page, sectionUuid: string) {
  await sectionHeader(page, sectionUuid).hover();
  await expect(sectionHoverMenu(page, sectionUuid)).toBeVisible();
}

test.describe('Delete Section — hover path (FR-SEC-006)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-SEC-006: hover delete opens workflowSectionDeleteDialog with title and body copy', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.sectionByTitle('E2E Section 3').uuid;

    await hoverSectionHeader(page, sectionUuid);
    await deleteButtonInSectionHeader(page, sectionUuid).click();

    await expect(deleteSectionDialog(page)).toBeVisible();
    await expect(workflowSectionDeleteDialogTitle(page)).toBeVisible();
    await expect(workflowSectionDeleteDialogBody(page)).toBeVisible();
    await expect(deleteSectionCancelButton(page)).toBeVisible();
    await expect(deleteSectionConfirmButton(page)).toBeVisible();
    await deleteSectionCancelButton(page).click();
    await expect(deleteSectionDialog(page)).toBeHidden();
  });

  test('FR-SEC-006: hover delete Cancel leaves section count unchanged', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.sectionByTitle('E2E Section 3').uuid;
    const before = await sectionContainers(page).count();

    await hoverSectionHeader(page, sectionUuid);
    await deleteButtonInSectionHeader(page, sectionUuid).click();
    await expect(deleteSectionDialog(page)).toBeVisible();
    await deleteSectionCancelButton(page).click();

    await expect(deleteSectionDialog(page)).toBeHidden();
    await expect(sectionContainers(page)).toHaveCount(before);
  });

  test('FR-SEC-006: hover delete confirm removes target workflowSectionContainer', async ({
    page,
    workflow,
  }) => {
    const disposable = workflow.sectionByTitle('E2E Section 3');
    const before = await sectionContainers(page).count();

    await hoverSectionHeader(page, disposable.uuid);
    await deleteButtonInSectionHeader(page, disposable.uuid).click();
    await expect(deleteSectionDialog(page)).toBeVisible();
    await deleteSectionConfirmButton(page).click();

    await expect(deleteSectionDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect(sectionContainers(page)).toHaveCount(before - 1, { timeout: 15_000 });
    await expect(page.locator(`[data-section-id="${disposable.uuid}"]`)).toHaveCount(0);
  });

  test.fixme('FR-SEC-006: last-section delete guard deferred', async () => {});
});
