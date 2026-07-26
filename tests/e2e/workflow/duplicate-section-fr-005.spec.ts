import { test, expect } from '../../fixtures';
import {
  duplicateBelowButtonInSectionHeader,
  editSectionForm,
  sectionContainers,
  sectionHeader,
  sectionHoverMenu,
  selectedSectionContainer,
} from './edit-section.locators';

/**
 * Duplicate section — hover path (FR-SEC-005).
 * Requirements: workflow_duplicate_section_requirements_v1.yaml
 * Sidebar duplicate: edit-section-fr-001-012.spec.ts
 */

async function hoverSectionHeader(page: import('@playwright/test').Page, sectionUuid: string) {
  await sectionHeader(page, sectionUuid).hover();
  await expect(sectionHoverMenu(page, sectionUuid)).toBeVisible();
}

test.describe('Duplicate Section — hover path (FR-SEC-005)', () => {
  test.describe.configure({ mode: 'serial' });

  let expectedSectionCount: number | null = null;

  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });

    if (expectedSectionCount === null) {
      expectedSectionCount = await sectionContainers(page).count();
    }
  });

  test('FR-SEC-005: hover duplicate adds section with (copy) title without rebinding sidebar', async ({
    page,
    workflow,
  }) => {
    const source = workflow.firstSection();
    const before = expectedSectionCount!;

    await expect(editSectionForm(page)).toBeHidden();
    await hoverSectionHeader(page, source.uuid);
    await duplicateBelowButtonInSectionHeader(page, source.uuid).click();

    expectedSectionCount = before + 1;
    await expect(sectionContainers(page)).toHaveCount(expectedSectionCount, { timeout: 15_000 });
    await expect(sectionContainers(page).filter({ hasText: 'E2E Section 1 (copy)' })).toHaveCount(
      1,
    );
    await expect(editSectionForm(page)).toBeHidden();
    await expect(selectedSectionContainer(page, source.uuid)).toHaveCount(0);
  });
});
