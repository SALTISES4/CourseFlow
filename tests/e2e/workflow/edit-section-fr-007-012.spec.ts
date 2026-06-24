import { test, expect } from '../../fixtures';
import { loginAs } from '../../helpers/auth';
import {
  COMMENT_HOVER_NAME,
  DELETE_SECTION_HOVER_NAME,
  DUPLICATE_SECTION_BELOW_NAME,
  INSERT_SECTION_BELOW_NAME,
  commentsButtonInSectionHeader,
  commentsTabInSidebar,
  deleteButtonInSectionHeader,
  duplicateBelowButtonInSectionHeader,
  editSectionForm,
  insertBelowButtonInSectionHeader,
  rightSidebar,
  sectionCollapseButton,
  sectionContainer,
  sectionHeader,
  sectionHoverMenu,
  sectionNodes,
  selectedSectionContainer,
} from './edit-section.locators';

/**
 * Phase 3 — edit-section FR-SEC-007, FR-SEC-010, FR-SEC-011; FR-SEC-008/009/012 deferred.
 * Requirements: tests/docs/requirements/features/workflow/workflow_edit_section_requirements_v1.yaml
 */

async function hoverSectionHeader(page: import('@playwright/test').Page, sectionUuid: string) {
  await sectionHeader(page, sectionUuid).hover();
  await expect(sectionHoverMenu(page, sectionUuid)).toBeVisible();
}

test.describe('Edit Section — hover menu (FR-SEC-007)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionHeader(page, workflow.firstSection().uuid)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-SEC-007: owner sees hover menu with active insert, duplicate, delete, and comments items', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;
    await hoverSectionHeader(page, sectionUuid);

    await expect(insertBelowButtonInSectionHeader(page, sectionUuid)).toBeEnabled();
    await expect(duplicateBelowButtonInSectionHeader(page, sectionUuid)).toBeEnabled();
    await expect(deleteButtonInSectionHeader(page, sectionUuid)).toBeEnabled();
    await expect(commentsButtonInSectionHeader(page, sectionUuid)).toBeEnabled();
  });

  test('FR-SEC-007: hover comments opens comments tab in workflowRightSidebar', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;

    await hoverSectionHeader(page, sectionUuid);
    await commentsButtonInSectionHeader(page, sectionUuid).click();

    await expect(rightSidebar(page)).toBeVisible();
    await expect(commentsTabInSidebar(page)).toHaveAttribute('aria-pressed', 'true');
  });

  test.skip(
    true,
    'FR-SEC-007 commenter disabled items: E2E manifest has no commenter contributor yet.',
  );
});

test.describe('Edit Section — hover menu viewer (FR-SEC-007)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.skip(
    true,
    'FR-SEC-007 viewer notRendered: section HoverMenu does not enforce project team roles yet (v1).',
  );

  test('FR-SEC-007: viewer does not see workflowSectionContainerHoverActionsMenu on hover', async ({
    page,
    workflow,
  }) => {
    const viewer = workflow.contributorByRole('viewer');
    await loginAs(page, { email: viewer.email, password: viewer.password });
    await page.goto(workflow.path);

    const sectionUuid = workflow.firstSection().uuid;
    await sectionHeader(page, sectionUuid).hover();

    await expect(sectionHoverMenu(page, sectionUuid)).toBeHidden();
    await expect(
      page.getByRole('button', { name: INSERT_SECTION_BELOW_NAME }),
    ).toHaveCount(0);
    await expect(page.getByRole('button', { name: DUPLICATE_SECTION_BELOW_NAME })).toHaveCount(0);
    await expect(page.getByRole('button', { name: DELETE_SECTION_HOVER_NAME })).toHaveCount(0);
    await expect(page.getByRole('button', { name: COMMENT_HOVER_NAME })).toHaveCount(0);
  });
});

test.describe('Edit Section — selected border (FR-SEC-010)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionHeader(page, workflow.firstSection().uuid)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-SEC-010: binding edit section shows workflowSectionContainerSelectedBorder on one section only', async ({
    page,
    workflow,
  }) => {
    const first = workflow.firstSection();
    const second = workflow.blankSection();

    await sectionHeader(page, first.uuid).click();
    await expect(editSectionForm(page)).toBeVisible();
    await expect(selectedSectionContainer(page, first.uuid)).toBeVisible();
    await expect(sectionContainer(page, second.uuid)).not.toHaveAttribute('data-selected', 'true');

    await sectionHeader(page, second.uuid).click();
    await expect(selectedSectionContainer(page, second.uuid)).toBeVisible();
    await expect(sectionContainer(page, first.uuid)).not.toHaveAttribute('data-selected', 'true');
  });

  test('FR-SEC-010: toggling section selection off clears workflowSectionContainerSelectedBorder', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;

    await sectionHeader(page, sectionUuid).click();
    await expect(selectedSectionContainer(page, sectionUuid)).toBeVisible();

    await sectionHeader(page, sectionUuid).click();
    await expect(sectionContainer(page, sectionUuid)).not.toHaveAttribute('data-selected', 'true');
  });
});

test.describe('Edit Section — manual collapse (FR-SEC-011)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionHeader(page, workflow.firstSection().uuid)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-SEC-011: collapse button hides workflowNode cells under the section', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;

    await expect(sectionNodes(page, sectionUuid).first()).toBeVisible({ timeout: 15_000 });

    await sectionCollapseButton(page, sectionUuid).click();
    await expect(sectionNodes(page, sectionUuid)).toHaveCount(0);

    await sectionCollapseButton(page, sectionUuid).click();
    await expect(sectionNodes(page, sectionUuid).first()).toBeVisible({ timeout: 15_000 });
  });

  test('FR-SEC-011: collapse button does not open workflowEditSectionForm', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;

    await expect(editSectionForm(page)).toBeHidden();
    await sectionCollapseButton(page, sectionUuid).click();
    await expect(editSectionForm(page)).toBeHidden();
    await expect(sectionNodes(page, sectionUuid)).toHaveCount(0);
  });
});

test.describe('Edit Section — deferred FR-SEC-008, FR-SEC-009, FR-SEC-012', () => {
  test.skip(
    true,
    'FR-SEC-008 edge integrity: requires cross-section edge fixture assertions.',
  );
  test.skip(
    true,
    'FR-SEC-009 vertical reorder: drag-and-drop slice deferred (section drag + collapsed presentation).',
  );
  test.skip(
    true,
    'FR-SEC-012 bulk expand/collapse: useMenuActions expandAll/collapseAll not wired; menu uses switch toggles.',
  );
});
