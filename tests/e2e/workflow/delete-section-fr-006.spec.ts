import { test, expect } from '../../fixtures';
import { loginAsWorkflowContributor } from './role.helpers';
import {
  expectSectionDeleteRemovedGraphContent,
  expectSectionNumberLabelsMatchOrder,
  sectionOrderUuids,
} from './edit-section.helpers';
import {
  deleteButtonInSectionHeader,
  deleteButtonInSidebar,
  deleteSectionCancelButton,
  deleteSectionConfirmButton,
  deleteSectionDialog,
  editSectionForm,
  sectionContainers,
  sectionHeader,
  sectionHoverMenu,
} from './edit-section.locators';
import {
  workflowSectionDeleteDialogBody,
  workflowSectionDeleteDialogTitle,
} from '../../shared/locators/workflow';
import { fetchGraphView } from './workflow-graph.helpers';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Delete section — hover path, sidebar path, and dialog (FR-SEC-006).
 * Requirements: workflow_delete_section_requirements_v1.yaml
 */

async function hoverSectionHeader(page: import('@playwright/test').Page, sectionUuid: string) {
  await sectionHeader(page, sectionUuid).hover();
  await expect(sectionHoverMenu(page, sectionUuid)).toBeVisible();
}

async function confirmDeleteSectionViaHover(
  page: import('@playwright/test').Page,
  sectionUuid: string,
): Promise<void> {
  await hoverSectionHeader(page, sectionUuid);
  await deleteButtonInSectionHeader(page, sectionUuid).click();
  await expect(deleteSectionDialog(page)).toBeVisible();
  await deleteSectionConfirmButton(page).click();
  await expect(deleteSectionDialog(page)).toBeHidden({ timeout: 15_000 });
}

test.describe('Delete Section — hover path (FR-SEC-006)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionContainers(page)).toHaveCount(workflow.sections.length, {
      timeout: 15_000,
    });
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

  test('FR-SEC-006: hover delete confirm removes section and its nodes and edges', async ({
    page,
    workflow,
  }) => {
    const disposable = workflow.sectionByTitle('E2E Section 3');
    const orderBefore = await sectionOrderUuids(page);
    const before = orderBefore.length;
    const graphBefore = await fetchGraphView(page, workflow.workflowUuid);
    const outcomeUuid = workflow.firstOutcome().uuid;

    await hoverSectionHeader(page, disposable.uuid);
    await deleteButtonInSectionHeader(page, disposable.uuid).click();
    await expect(deleteSectionDialog(page)).toBeVisible();
    await deleteSectionConfirmButton(page).click();

    await expect(deleteSectionDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect(sectionContainers(page)).toHaveCount(before - 1, { timeout: 15_000 });
    await expect(page.locator(`[data-section-id="${disposable.uuid}"]`)).toHaveCount(0);

    const remainingOrder = orderBefore.filter((uuid) => uuid !== disposable.uuid);
    await expectSectionNumberLabelsMatchOrder(page, remainingOrder);
    await expectSectionDeleteRemovedGraphContent(
      page,
      workflow.workflowUuid,
      disposable.uuid,
      graphBefore,
    );

    const graphAfter = await fetchGraphView(page, workflow.workflowUuid);
    expect(
      graphAfter.nodes.some((node) => node.outcomeUuids.includes(outcomeUuid)),
      'Seeded workflowOutcome must remain in the outcome tree after unrelated section delete',
    ).toBe(true);
  });

  test('FR-SEC-006: sole remaining section cannot be deleted from hover or sidebar', async ({
    page,
    workflow,
  }) => {
    test.fail();

    await confirmDeleteSectionViaHover(page, workflow.sectionByTitle('E2E Section 3').uuid);
    await confirmDeleteSectionViaHover(page, workflow.blankSection().uuid);

    await expect(sectionContainers(page)).toHaveCount(1, { timeout: 15_000 });
    const soleSection = workflow.firstSection();

    await hoverSectionHeader(page, soleSection.uuid);
    await expect(deleteButtonInSectionHeader(page, soleSection.uuid)).toBeDisabled();
    await deleteButtonInSectionHeader(page, soleSection.uuid).click({ force: true });
    await expect(deleteSectionDialog(page)).toBeHidden();

    await sectionHeader(page, soleSection.uuid).click();
    await expect(editSectionForm(page)).toBeVisible();
    await expect(deleteButtonInSidebar(page)).toBeDisabled();
    await deleteButtonInSidebar(page).click({ force: true });
    await expect(deleteSectionDialog(page)).toBeHidden();
    await expect(sectionContainers(page)).toHaveCount(1);
  });
});

test.describe('Delete Section — sidebar path (FR-SEC-006)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionContainers(page)).toHaveCount(workflow.sections.length, {
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
    await expect(editSectionForm(page)).toBeVisible();
    await deleteButtonInSidebar(page).click();

    await expect(deleteSectionDialog(page)).toBeVisible();
    expect(await sectionContainers(page).count()).toBe(before);

    await deleteSectionCancelButton(page).click();

    await expect(deleteSectionDialog(page)).toBeHidden();
    expect(await sectionContainers(page).count()).toBe(before);
  });
});

test.describe('Delete Section — role behavior (FR-SEC-006, FR-SEC-007)', () => {
  test.describe('commenter', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-SEC-007: commenter sees disabled hover delete item', async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, 'commenter');
      await page.goto(workflow.path);
      await expect(sectionContainers(page)).toHaveCount(workflow.sections.length, {
        timeout: 15_000,
      });

      const sectionUuid = workflow.sectionByTitle('E2E Section 3').uuid;
      const before = await sectionContainers(page).count();

      await hoverSectionHeader(page, sectionUuid);
      await expect(deleteButtonInSectionHeader(page, sectionUuid)).toBeDisabled();
      await deleteButtonInSectionHeader(page, sectionUuid).click({ force: true });

      await expect(sectionContainers(page)).toHaveCount(before);
      await expect(deleteSectionDialog(page)).toBeHidden();
    });
  });

  test.describe('viewer', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-SEC-007: viewer does not see section hover delete item', async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, 'viewer');
      await page.goto(workflow.path);
      await expect(sectionContainers(page)).toHaveCount(workflow.sections.length, {
        timeout: 15_000,
      });

      const sectionUuid = workflow.sectionByTitle('E2E Section 3').uuid;

      await sectionHeader(page, sectionUuid).hover();
      await expect(sectionHoverMenu(page, sectionUuid)).toBeHidden();
      await expect(deleteButtonInSectionHeader(page, sectionUuid)).toHaveCount(0);
    });
  });
});
