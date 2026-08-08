import { test, expect } from '../../fixtures';
import { loginAs } from '../../helpers/auth';
import { authenticatedApiRequest } from '../../helpers/api';
import { openFirstNodeEditForm } from './edit-node.helpers';
import {
  beginSectionDragToward,
  dragSectionBelow,
  endSectionDrag,
  expectSectionNumberLabelsMatchOrder,
  restoreSectionOrder,
  sectionNodeUuids,
  sectionOrderUuids,
} from './edit-section.helpers';
import {
  COMMENT_HOVER_NAME,
  DELETE_SECTION_HOVER_NAME,
  DUPLICATE_SECTION_BELOW_NAME,
  INSERT_SECTION_BELOW_NAME,
  commentsButtonInSectionHeader,
  commentsTabInSidebar,
  deleteButtonInSectionHeader,
  deleteButtonInSidebar,
  deleteSectionCancelButton,
  deleteSectionConfirmButton,
  deleteSectionDialog,
  duplicateBelowButtonInSectionHeader,
  duplicateButtonInSidebar,
  editSectionForm,
  expandAllSectionsSwitch,
  insertBelowButtonInSectionHeader,
  rightSidebar,
  sectionCollapseButton,
  sectionContainer,
  sectionContainers,
  sectionHeader,
  sectionHoverMenu,
  sectionNodes,
  sectionNumberLabel,
  selectedSectionContainer,
  titleFieldInEditSectionForm,
  viewSettingsButton,
  EDIT_SECTION_HEADING,
} from './edit-section.locators';
import { workflowEditNodeForm } from './workflow-graph.locators';

type GraphViewPayload = {
  sections: Array<{ uuid: string; position: number }>;
  nodes: Array<{
    uuid: string;
    sectionUuid: string | null;
    channelUuid: string | null;
    sectionRow: number | null;
  }>;
  edges: Array<{
    id: number;
    sourceNodeUuid: string;
    targetNodeUuid: string;
    title: string;
    textPosition: number;
    lineType: string;
    sourcePort: string;
    targetPort: string;
  }>;
};

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Edit section — FR-SEC-001 through FR-SEC-012.
 * Requirements: tests/docs/requirements/features/workflow/workflow_edit_section_requirements_v1.yaml
 * (+ duplicate/delete YAMLs for FR-SEC-005/006 sidebar paths)
 * Fixture: tests/.playwright-fixtures/workflow.json (`just e2e-prepare`)
 *
 * Hover-path duplicate/delete suites remain in duplicate-section-fr-005.spec.ts and
 * delete-section-fr-006.spec.ts.
 */

async function hoverSectionHeader(page: import('@playwright/test').Page, sectionUuid: string) {
  await sectionHeader(page, sectionUuid).hover();
  await expect(sectionHoverMenu(page, sectionUuid)).toBeVisible();
}

async function fetchGraphView(
  page: import('@playwright/test').Page,
  workflowUuid: string,
): Promise<GraphViewPayload> {
  const response = await authenticatedApiRequest(page, 'GET', `/api/graph/${workflowUuid}/view`);
  expect(response.ok(), `graph view HTTP ${response.status()}`).toBeTruthy();
  return (await response.json()) as GraphViewPayload;
}

function graphNodeAssignments(graph: GraphViewPayload) {
  return graph.nodes
    .map(({ uuid, sectionUuid, channelUuid, sectionRow }) => ({
      uuid,
      sectionUuid,
      channelUuid,
      sectionRow,
    }))
    .sort((left, right) => left.uuid.localeCompare(right.uuid));
}

function graphEdges(graph: GraphViewPayload) {
  return [...graph.edges].sort((left, right) => left.id - right.id);
}

test.describe('edit-section-fr-001-012', () => {
  test.describe('Open and rebind edit form (FR-SEC-001)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });
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

    test('FR-SEC-001: workflowEditSectionForm shows Section title field, Duplicate, and Delete', async ({
      page,
      workflow,
    }) => {
      const section = workflow.firstSection();

      await sectionHeader(page, section.uuid).click();
      await expect(editSectionForm(page)).toBeVisible();

      await expect(
        editSectionForm(page).getByRole('heading', { name: EDIT_SECTION_HEADING, exact: true }),
      ).toBeVisible();
      await expect(titleFieldInEditSectionForm(page)).toBeVisible();
      await expect(titleFieldInEditSectionForm(page)).toHaveValue(section.title);
      await expect(duplicateButtonInSidebar(page)).toBeVisible();
      await expect(duplicateButtonInSidebar(page)).toBeEnabled();
      await expect(deleteButtonInSidebar(page)).toBeVisible();
      await expect(deleteButtonInSidebar(page)).toBeEnabled();
      await expect(editSectionForm(page).getByRole('button', { name: /^save$/i })).toHaveCount(0);
    });

    test('FR-SEC-001: sidebar already open — click different section header rebinds form', async ({
      page,
      workflow,
    }) => {

      const first = workflow.firstSection();
      const blank = workflow.blankSection();

      await sectionHeader(page, first.uuid).click();
      await expect(editSectionForm(page)).toBeVisible();

      await sectionHeader(page, blank.uuid).click();
      await expect(editSectionForm(page)).toBeVisible();
      await expect(titleFieldInEditSectionForm(page)).toHaveValue('', {
        timeout: 15_000,
      });
    });

    test('FR-SEC-001: Edit node open — click section header switches to Edit section form', async ({
      page,
      workflow,
    }) => {
      await openFirstNodeEditForm(page);
      await expect(workflowEditNodeForm(page)).toBeVisible();

      const sectionUuid = workflow.firstSection().uuid;
      await sectionHeader(page, sectionUuid).click();

      await expect(editSectionForm(page)).toBeVisible();
      await expect(
        editSectionForm(page).getByRole('heading', { name: EDIT_SECTION_HEADING, exact: true }),
      ).toBeVisible();
      await expect(workflowEditNodeForm(page)).toBeHidden();
    });
  });

  test.describe('Section numbering and display (FR-SEC-002)', () => {
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
  });

  test.describe('Edit section title (FR-SEC-003)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });
    });

    test('FR-SEC-003: section title change persists after reload', async ({ page, workflow }) => {
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

    test('FR-SEC-003: clearing title shows workflowSectionNumberLabel only', async ({
      page,
      workflow,
    }) => {

      const section = workflow.sectionByTitle('E2E Section 3');
      const sectionUuid = section.uuid;
      const seedTitle = section.title;
      const displayIndex = String(section.position + 1);

      await sectionHeader(page, sectionUuid).click();
      await expect(editSectionForm(page)).toBeVisible();

      const titleBeforeClear = await titleFieldInEditSectionForm(page).inputValue();

      try {
        await titleFieldInEditSectionForm(page).fill('');
        await titleFieldInEditSectionForm(page).blur();

        await expect(titleFieldInEditSectionForm(page)).toHaveValue('', { timeout: 15_000 });
        await expect(sectionNumberLabel(page, sectionUuid)).toHaveText(displayIndex);
        if (titleBeforeClear) {
          await expect(sectionHeader(page, sectionUuid)).not.toContainText(titleBeforeClear);
        }
      } finally {
        await titleFieldInEditSectionForm(page).fill(seedTitle);
        await titleFieldInEditSectionForm(page).blur();
        await expect(sectionHeader(page, sectionUuid)).toContainText(seedTitle, {
          timeout: 15_000,
        });
      }
    });
  });

  test.describe('Viewer read-only title (FR-SEC-003)', () => {
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
      await expect(titleFieldInEditSectionForm(page)).toHaveAttribute('readonly', '');
      await expect(duplicateButtonInSidebar(page)).toBeDisabled();
      await expect(deleteButtonInSidebar(page)).toBeDisabled();
    });
  });

  test.describe('Mutations — insert, duplicate, delete (FR-SEC-004, FR-SEC-005, FR-SEC-006)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });
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

  test.describe('Hover menu (FR-SEC-007)', () => {
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
  });

  test.describe('Hover menu commenter (FR-SEC-007)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-SEC-007: commenter sees disabled insert, duplicate, and delete hover items', async ({
      page,
      workflow,
    }) => {
      const commenter = workflow.contributorByRole('commenter');
      await loginAs(page, { email: commenter.email, password: commenter.password });
      await page.goto(workflow.path);

      const sectionUuid = workflow.firstSection().uuid;
      await hoverSectionHeader(page, sectionUuid);

      await expect(insertBelowButtonInSectionHeader(page, sectionUuid)).toBeDisabled();
      await expect(duplicateBelowButtonInSectionHeader(page, sectionUuid)).toBeDisabled();
      await expect(deleteButtonInSectionHeader(page, sectionUuid)).toBeDisabled();
      await expect(commentsButtonInSectionHeader(page, sectionUuid)).toBeEnabled();
    });
  });

  test.describe('Hover menu viewer (FR-SEC-007)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

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
      await expect(page.getByRole('button', { name: INSERT_SECTION_BELOW_NAME })).toHaveCount(0);
      await expect(page.getByRole('button', { name: DUPLICATE_SECTION_BELOW_NAME })).toHaveCount(0);
      await expect(page.getByRole('button', { name: DELETE_SECTION_HOVER_NAME })).toHaveCount(0);
      await expect(page.getByRole('button', { name: COMMENT_HOVER_NAME })).toHaveCount(0);
    });
  });

  test.describe('Selected border (FR-SEC-010)', () => {
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

  test.describe('Manual collapse (FR-SEC-011)', () => {
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

  test.describe('Vertical section reorder (FR-SEC-009)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });
    });

    test('FR-SEC-009: drag section below another updates order and renumbers', async ({
      page,
      workflow,
    }) => {
      const first = workflow.firstSection();
      const blank = workflow.blankSection();
      const orderBefore = await sectionOrderUuids(page);
      const nodesInFirst = await sectionNodeUuids(page, first.uuid);
      const graphBefore = await fetchGraphView(page, workflow.workflowUuid);

      expect(orderBefore[0]).toBe(first.uuid);

      try {
        await dragSectionBelow(page, first.uuid, blank.uuid);

        await expect.poll(async () => sectionOrderUuids(page)).not.toEqual(orderBefore);

        const orderAfter = await sectionOrderUuids(page);
        expect(orderAfter.indexOf(first.uuid)).toBeGreaterThan(orderAfter.indexOf(blank.uuid));
        await expectSectionNumberLabelsMatchOrder(page, orderAfter);
        expect(await sectionNodeUuids(page, first.uuid)).toEqual(nodesInFirst);

        await expect
          .poll(async () => {
            const graph = await fetchGraphView(page, workflow.workflowUuid);
            return [...graph.sections]
              .sort((left, right) => left.position - right.position)
              .map((section) => section.uuid);
          }, { timeout: 15_000 })
          .toEqual(orderAfter);

        const graphAfter = await fetchGraphView(page, workflow.workflowUuid);
        expect(graphNodeAssignments(graphAfter)).toEqual(graphNodeAssignments(graphBefore));
        expect(graphEdges(graphAfter)).toEqual(graphEdges(graphBefore));
      } finally {
        await restoreSectionOrder(page, orderBefore);
        await expectSectionNumberLabelsMatchOrder(page, orderBefore);
      }
    });

    test('FR-SEC-009: empty section can be vertically reordered', async ({ page, workflow }) => {
      const blank = workflow.blankSection();
      const titled = workflow.sectionByTitle('E2E Section 3');
      const orderBefore = await sectionOrderUuids(page);

      try {
        await dragSectionBelow(page, blank.uuid, titled.uuid);

        await expect.poll(async () => sectionOrderUuids(page)).not.toEqual(orderBefore);
        const orderAfter = await sectionOrderUuids(page);
        expect(orderAfter.indexOf(blank.uuid)).toBeGreaterThan(orderAfter.indexOf(titled.uuid));
        await expectSectionNumberLabelsMatchOrder(page, orderAfter);
      } finally {
        await restoreSectionOrder(page, orderBefore);
      }
    });

    test('FR-SEC-009: in-flight drag collapses all sections to headers only', async ({
      page,
      workflow,
    }) => {
      const first = workflow.firstSection();
      const blank = workflow.blankSection();
      const sections = workflow.sections;

      for (const section of sections) {
        if ((await sectionNodes(page, section.uuid).count()) > 0) {
          await expect(sectionNodes(page, section.uuid).first()).toBeVisible();
        }
      }

      await beginSectionDragToward(page, first.uuid, blank.uuid);

      try {
        for (const section of sections) {
          await expect(sectionNodes(page, section.uuid)).toHaveCount(0);
        }
      } finally {
        await endSectionDrag(page);
      }

      await expect
        .poll(async () => {
          let total = 0;
          for (const section of sections) {
            total += await sectionNodes(page, section.uuid).count();
          }
          return total;
        })
        .toBeGreaterThan(0);
    });
  });

  test.describe('Vertical section reorder viewer (FR-SEC-009)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-SEC-009: viewer cannot vertically reorder sections', async ({ page, workflow }) => {
      const viewer = workflow.contributorByRole('viewer');
      await loginAs(page, { email: viewer.email, password: viewer.password });
      await page.goto(workflow.path);
      await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });

      const first = workflow.firstSection();
      const blank = workflow.blankSection();
      const orderBefore = await sectionOrderUuids(page);

      await expect(sectionHeader(page, first.uuid)).not.toHaveAttribute('draggable', 'true');
      await sectionHeader(page, first.uuid).dragTo(sectionContainer(page, blank.uuid), {
        force: true,
      });

      await expect.poll(async () => sectionOrderUuids(page)).toEqual(orderBefore);
    });
  });

  test.describe('Edge integrity for section insert below (FR-SEC-008)', () => {
    test('FR-SEC-008: inserting between linked sections preserves every edge', async ({
      page,
      workflow,
    }) => {
      await page.goto(workflow.path);
      await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });

      const graphBefore = await fetchGraphView(page, workflow.workflowUuid);
      const orderedSections = [...graphBefore.sections].sort(
        (left, right) => left.position - right.position,
      );
      const sectionByNodeUuid = new Map(
        graphBefore.nodes.map((node) => [node.uuid, node.sectionUuid]),
      );

      let insertAfterSectionUuid: string | undefined;
      for (let index = 0; index < orderedSections.length - 1; index += 1) {
        const upperUuid = orderedSections[index]!.uuid;
        const lowerUuid = orderedSections[index + 1]!.uuid;
        const hasCrossSectionEdge = graphBefore.edges.some((edge) => {
          const sourceSectionUuid = sectionByNodeUuid.get(edge.sourceNodeUuid);
          const targetSectionUuid = sectionByNodeUuid.get(edge.targetNodeUuid);
          return (
            (sourceSectionUuid === upperUuid && targetSectionUuid === lowerUuid) ||
            (sourceSectionUuid === lowerUuid && targetSectionUuid === upperUuid)
          );
        });
        if (hasCrossSectionEdge) {
          insertAfterSectionUuid = upperUuid;
          break;
        }
      }

      expect(
        insertAfterSectionUuid,
        'The standard activity fixture must contain an edge across adjacent sections.',
      ).toBeDefined();

      const beforeCount = orderedSections.length;
      await sectionHeader(page, insertAfterSectionUuid!).hover();
      await insertBelowButtonInSectionHeader(page, insertAfterSectionUuid!).click();
      await expect(sectionContainers(page)).toHaveCount(beforeCount + 1, { timeout: 15_000 });

      await expect
        .poll(async () => (await fetchGraphView(page, workflow.workflowUuid)).sections.length, {
          timeout: 15_000,
        })
        .toBe(beforeCount + 1);

      const graphAfter = await fetchGraphView(page, workflow.workflowUuid);
      expect(graphEdges(graphAfter)).toEqual(graphEdges(graphBefore));
    });
  });

  test.describe('Bulk expand and collapse (FR-SEC-012)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });
    });

    test('FR-SEC-012: bulk expand replaces manual collapse state without opening sidebar', async ({
      page,
      workflow,
    }) => {
      const firstUuid = workflow.firstSection().uuid;

      await sectionCollapseButton(page, firstUuid).click();
      await expect(sectionCollapseButton(page, firstUuid)).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      await expect(editSectionForm(page)).toBeHidden();

      await viewSettingsButton(page).click();
      await expect(expandAllSectionsSwitch(page)).not.toBeChecked();
      await expandAllSectionsSwitch(page).check();
      await page.keyboard.press('Escape');

      for (const section of workflow.sections) {
        await expect(sectionCollapseButton(page, section.uuid)).toHaveAttribute(
          'aria-expanded',
          'true',
        );
      }
      await expect(sectionNodes(page, firstUuid).first()).toBeVisible();
      await expect(editSectionForm(page)).toBeHidden();
    });

    test('FR-SEC-012: bulk collapse permits one manual expand and resets on reload', async ({
      page,
      workflow,
    }) => {
      const firstUuid = workflow.firstSection().uuid;

      await viewSettingsButton(page).click();
      await expect(expandAllSectionsSwitch(page)).toBeChecked();
      await expandAllSectionsSwitch(page).uncheck();
      await page.keyboard.press('Escape');

      for (const section of workflow.sections) {
        await expect(sectionCollapseButton(page, section.uuid)).toHaveAttribute(
          'aria-expanded',
          'false',
        );
        await expect(sectionNodes(page, section.uuid)).toHaveCount(0);
      }
      await expect(editSectionForm(page)).toBeHidden();

      await sectionCollapseButton(page, firstUuid).click();
      await expect(sectionCollapseButton(page, firstUuid)).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      await expect(sectionNodes(page, firstUuid).first()).toBeVisible();
      for (const section of workflow.sections.filter(({ uuid }) => uuid !== firstUuid)) {
        await expect(sectionCollapseButton(page, section.uuid)).toHaveAttribute(
          'aria-expanded',
          'false',
        );
      }

      await page.reload();
      await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });
      for (const section of workflow.sections) {
        await expect(sectionCollapseButton(page, section.uuid)).toHaveAttribute(
          'aria-expanded',
          'true',
        );
      }
    });
  });
});
