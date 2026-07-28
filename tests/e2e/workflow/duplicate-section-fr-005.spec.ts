import { test, expect, type Page } from '../../fixtures';
import { loginAs } from '../../helpers/auth';
import { authenticatedApiRequest } from '../../helpers/api';
import { skipUnlessPristineWorkflow } from '../../helpers/workflow-pristine';
import {
  expectSectionNumberLabelsMatchOrder,
  sectionOrderUuids,
} from './edit-section.helpers';
import {
  DUPLICATE_SECTION_BELOW_NAME,
  deleteButtonInSectionHeader,
  deleteSectionConfirmButton,
  deleteSectionDialog,
  duplicateBelowButtonInSectionHeader,
  duplicateButtonInSidebar,
  editSectionForm,
  sectionContainer,
  sectionContainers,
  sectionHeader,
  sectionHoverMenu,
  sectionNodes,
  selectedSectionContainer,
  titleFieldInEditSectionForm,
} from './edit-section.locators';
import { composeComment, openSectionCommentsViaHover } from './comments-tab.helpers';
import { workflowNodeLinkedWorkflowIndicator } from './workflow-graph.locators';

/**
 * Duplicate section — FR-SEC-005 (hover and sidebar).
 * Requirements: workflow_duplicate_section_requirements_v1.yaml
 *
 * Each mutating activity-workflow case restores section count via delete so later
 * cases can still meet skipUnlessPristineWorkflow on a shared E2E DB.
 */

type GraphViewPayload = {
  sections: Array<{ uuid: string; title: string; position: number; threadUuid?: string | null }>;
  nodes: Array<{
    uuid: string;
    title: string;
    sectionUuid: string | null;
    channelUuid: string | null;
    sectionRow: number | null;
    linkedWorkflowUuid: string | null;
    outcomeUuids: string[];
  }>;
  edges: Array<{
    id: number;
    sourceNodeUuid: string;
    targetNodeUuid: string;
    title: string;
    lineType: string;
    sourcePort: string;
    targetPort: string;
  }>;
  threadCommentCounts: Array<{ threadUuid: string; commentCount: number }>;
};

function workflowUuidFromPath(path: string): string {
  const match = path.match(/\/workflow\/([^/]+)/);
  if (!match?.[1]) {
    throw new Error(`Cannot extract workflow UUID from path ${path}`);
  }
  return match[1];
}

async function hoverSectionHeader(page: Page, sectionUuid: string): Promise<void> {
  await sectionHeader(page, sectionUuid).hover();
  await expect(sectionHoverMenu(page, sectionUuid)).toBeVisible();
}

async function fetchGraphView(page: Page, workflowUuid: string): Promise<GraphViewPayload> {
  const response = await authenticatedApiRequest(page, 'GET', `/api/graph/${workflowUuid}/view`);
  expect(response.ok(), `graph view HTTP ${response.status()}`).toBeTruthy();
  return (await response.json()) as GraphViewPayload;
}

async function deleteSectionViaHover(page: Page, sectionUuid: string): Promise<void> {
  await hoverSectionHeader(page, sectionUuid);
  await deleteButtonInSectionHeader(page, sectionUuid).click();
  await expect(deleteSectionDialog(page)).toBeVisible();
  await deleteSectionConfirmButton(page).click();
  await expect(deleteSectionDialog(page)).toBeHidden({ timeout: 15_000 });
  await expect(sectionContainer(page, sectionUuid)).toHaveCount(0, { timeout: 15_000 });
}

function nodesInSection(graph: GraphViewPayload, sectionUuid: string) {
  return graph.nodes.filter((node) => node.sectionUuid === sectionUuid);
}

function intraSectionEdges(graph: GraphViewPayload, sectionUuid: string) {
  const nodeIds = new Set(nodesInSection(graph, sectionUuid).map((node) => node.uuid));
  return graph.edges.filter(
    (edge) => nodeIds.has(edge.sourceNodeUuid) && nodeIds.has(edge.targetNodeUuid),
  );
}

function crossSectionEdgesIncidentOnSection(graph: GraphViewPayload, sectionUuid: string) {
  const nodeIds = new Set(nodesInSection(graph, sectionUuid).map((node) => node.uuid));
  return graph.edges.filter((edge) => {
    const sourceIn = nodeIds.has(edge.sourceNodeUuid);
    const targetIn = nodeIds.has(edge.targetNodeUuid);
    return sourceIn !== targetIn;
  });
}

function nodeSignature(node: GraphViewPayload['nodes'][number]) {
  return [
    node.title,
    node.channelUuid ?? '',
    String(node.sectionRow ?? ''),
    node.linkedWorkflowUuid ?? '',
    [...node.outcomeUuids].sort().join(','),
  ].join('|');
}

function commentCountForSection(graph: GraphViewPayload, sectionUuid: string): number {
  const threadUuid = graph.sections.find((section) => section.uuid === sectionUuid)?.threadUuid;
  if (!threadUuid) {
    return 0;
  }
  return (
    graph.threadCommentCounts.find((entry) => entry.threadUuid === threadUuid)?.commentCount ?? 0
  );
}

test.describe('Duplicate section — FR-SEC-005', () => {
  test.describe('Hover path — placement, titles, sidebar unchanged', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await skipUnlessPristineWorkflow(page, workflow);
    });

    test('places new section immediately below source, renumbers, appends " (copy)", leaves sidebar unbound', async ({
      page,
      workflow,
    }) => {
      const source = workflow.firstSection();
      const orderBefore = await sectionOrderUuids(page);
      const sourceIndex = orderBefore.indexOf(source.uuid);
      expect(sourceIndex).toBe(0);
      let duplicateUuid: string | undefined;

      try {
        await expect(editSectionForm(page)).toBeHidden();
        await hoverSectionHeader(page, source.uuid);
        await duplicateBelowButtonInSectionHeader(page, source.uuid).click();

        await expect(sectionContainers(page)).toHaveCount(orderBefore.length + 1, {
          timeout: 15_000,
        });

        const orderAfter = await sectionOrderUuids(page);
        expect(orderAfter[sourceIndex]).toBe(source.uuid);
        duplicateUuid = orderAfter[sourceIndex + 1]!;
        expect(duplicateUuid).not.toBe(source.uuid);
        expect(orderAfter.slice(sourceIndex + 2)).toEqual(orderBefore.slice(sourceIndex + 1));

        await expectSectionNumberLabelsMatchOrder(page, orderAfter);
        await expect(sectionHeader(page, duplicateUuid)).toContainText(`${source.title} (copy)`);
        await expect(editSectionForm(page)).toBeHidden();
        await expect(selectedSectionContainer(page, source.uuid)).toHaveCount(0);
      } finally {
        if (duplicateUuid && (await sectionContainer(page, duplicateUuid).count()) > 0) {
          await deleteSectionViaHover(page, duplicateUuid);
        }
      }
      await expect(sectionContainers(page)).toHaveCount(orderBefore.length, { timeout: 15_000 });
    });

    test('empty source title duplicates as literal " (copy)"', async ({ page, workflow }) => {
      const blank = workflow.blankSection();
      const orderBefore = await sectionOrderUuids(page);
      const sourceIndex = orderBefore.indexOf(blank.uuid);
      expect(sourceIndex).toBeGreaterThanOrEqual(0);
      let duplicateUuid: string | undefined;

      try {
        await hoverSectionHeader(page, blank.uuid);
        await duplicateBelowButtonInSectionHeader(page, blank.uuid).click();

        await expect(sectionContainers(page)).toHaveCount(orderBefore.length + 1, {
          timeout: 15_000,
        });
        const orderAfter = await sectionOrderUuids(page);
        duplicateUuid = orderAfter[sourceIndex + 1]!;

        await sectionHeader(page, duplicateUuid).click();
        await expect(editSectionForm(page)).toBeVisible();
        await expect(titleFieldInEditSectionForm(page)).toHaveValue(' (copy)');
      } finally {
        if (duplicateUuid && (await sectionContainer(page, duplicateUuid).count()) > 0) {
          await deleteSectionViaHover(page, duplicateUuid);
        }
      }
      await expect(sectionContainers(page)).toHaveCount(orderBefore.length, { timeout: 15_000 });
    });

    test('duplicating a (copy) title appends another " (copy)" suffix', async ({
      page,
      workflow,
    }) => {
      const source = workflow.firstSection();
      const orderBefore = await sectionOrderUuids(page);
      const sourceIndex = orderBefore.indexOf(source.uuid);
      let firstCopyUuid: string | undefined;
      let nestedCopyUuid: string | undefined;

      try {
        await hoverSectionHeader(page, source.uuid);
        await duplicateBelowButtonInSectionHeader(page, source.uuid).click();
        await expect(sectionContainers(page)).toHaveCount(orderBefore.length + 1, {
          timeout: 15_000,
        });

        let order = await sectionOrderUuids(page);
        firstCopyUuid = order[sourceIndex + 1]!;
        await expect(sectionHeader(page, firstCopyUuid)).toContainText(`${source.title} (copy)`);

        await hoverSectionHeader(page, firstCopyUuid);
        await duplicateBelowButtonInSectionHeader(page, firstCopyUuid).click();
        await expect(sectionContainers(page)).toHaveCount(orderBefore.length + 2, {
          timeout: 15_000,
        });

        order = await sectionOrderUuids(page);
        nestedCopyUuid = order[order.indexOf(firstCopyUuid) + 1]!;
        await expect(sectionHeader(page, nestedCopyUuid)).toContainText(
          `${source.title} (copy) (copy)`,
        );
      } finally {
        if (nestedCopyUuid && (await sectionContainer(page, nestedCopyUuid).count()) > 0) {
          await deleteSectionViaHover(page, nestedCopyUuid);
        }
        if (firstCopyUuid && (await sectionContainer(page, firstCopyUuid).count()) > 0) {
          await deleteSectionViaHover(page, firstCopyUuid);
        }
      }
      await expect(sectionContainers(page)).toHaveCount(orderBefore.length, { timeout: 15_000 });
    });
  });

  test.describe('Content fidelity — nodes, edges, outcomes', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await skipUnlessPristineWorkflow(page, workflow);
    });

    test('mirrors nodes (channel/row), intra-section edges, outcomes; leaves cross-section edges unchanged', async ({
      page,
      workflow,
    }) => {
      const source = workflow.firstSection();
      const workflowUuid = workflowUuidFromPath(workflow.path);
      const orderBefore = await sectionOrderUuids(page);
      const sourceIndex = orderBefore.indexOf(source.uuid);
      let duplicateUuid: string | undefined;

      try {
        const graphBefore = await fetchGraphView(page, workflowUuid);
        const sourceNodesBefore = nodesInSection(graphBefore, source.uuid);
        expect(sourceNodesBefore.length).toBeGreaterThan(0);
        expect(
          sourceNodesBefore.some((node) => node.outcomeUuids.length > 0),
          'Expected at least one outcome assignment on section 1 nodes',
        ).toBe(true);

        const sourceNodeCount = await sectionNodes(page, source.uuid).count();
        const crossEdgesBefore = crossSectionEdgesIncidentOnSection(graphBefore, source.uuid);
        const crossEdgeIdsBefore = new Set(crossEdgesBefore.map((edge) => edge.id));
        const crossEdgeSnapshots = crossEdgesBefore.map((edge) => ({ ...edge }));
        const intraBefore = intraSectionEdges(graphBefore, source.uuid);
        expect(intraBefore.length).toBeGreaterThan(0);

        await hoverSectionHeader(page, source.uuid);
        await duplicateBelowButtonInSectionHeader(page, source.uuid).click();
        await expect(sectionContainers(page)).toHaveCount(orderBefore.length + 1, {
          timeout: 15_000,
        });

        const orderAfter = await sectionOrderUuids(page);
        duplicateUuid = orderAfter[sourceIndex + 1]!;

        await expect
          .poll(async () => sectionNodes(page, duplicateUuid!).count(), { timeout: 15_000 })
          .toBe(sourceNodeCount);

        const graphAfter = await fetchGraphView(page, workflowUuid);
        const sourceNodesAfter = nodesInSection(graphAfter, source.uuid);
        const duplicateNodes = nodesInSection(graphAfter, duplicateUuid);

        expect(sourceNodesAfter.map(nodeSignature).sort()).toEqual(
          sourceNodesBefore.map(nodeSignature).sort(),
        );
        expect(duplicateNodes.map(nodeSignature).sort()).toEqual(
          sourceNodesBefore.map(nodeSignature).sort(),
        );

        const sourceIds = new Set(sourceNodesAfter.map((node) => node.uuid));
        for (const node of duplicateNodes) {
          expect(sourceIds.has(node.uuid)).toBe(false);
        }

        const intraAfter = intraSectionEdges(graphAfter, duplicateUuid);
        expect(intraAfter).toHaveLength(intraBefore.length);

        const duplicateBySignature = new Map(
          duplicateNodes.map((node) => [nodeSignature(node), node]),
        );
        for (const edge of intraBefore) {
          const sourceSig = nodeSignature(
            sourceNodesAfter.find((node) => node.uuid === edge.sourceNodeUuid)!,
          );
          const targetSig = nodeSignature(
            sourceNodesAfter.find((node) => node.uuid === edge.targetNodeUuid)!,
          );
          const copiedSource = duplicateBySignature.get(sourceSig)!;
          const copiedTarget = duplicateBySignature.get(targetSig)!;
          const matching = intraAfter.find(
            (candidate) =>
              candidate.sourceNodeUuid === copiedSource.uuid &&
              candidate.targetNodeUuid === copiedTarget.uuid &&
              candidate.title === edge.title &&
              candidate.lineType === edge.lineType &&
              candidate.sourcePort === edge.sourcePort &&
              candidate.targetPort === edge.targetPort,
          );
          expect(matching, 'Expected matching intra-section edge on duplicate').toBeTruthy();
        }

        const crossEdgesAfter = crossSectionEdgesIncidentOnSection(graphAfter, source.uuid);
        expect(crossEdgesAfter.map((edge) => edge.id).sort()).toEqual(
          [...crossEdgeIdsBefore].sort((a, b) => a - b),
        );
        for (const before of crossEdgeSnapshots) {
          const after = crossEdgesAfter.find((edge) => edge.id === before.id);
          expect(after).toEqual(before);
        }

        const duplicateNodeIds = new Set(duplicateNodes.map((node) => node.uuid));
        for (const edge of graphAfter.edges) {
          const sourceDup = duplicateNodeIds.has(edge.sourceNodeUuid);
          const targetDup = duplicateNodeIds.has(edge.targetNodeUuid);
          expect(
            sourceDup === targetDup,
            'Copied nodes must not gain new cross-section edges',
          ).toBe(true);
        }
      } finally {
        if (duplicateUuid && (await sectionContainer(page, duplicateUuid).count()) > 0) {
          await deleteSectionViaHover(page, duplicateUuid);
        }
      }
      await expect(sectionContainers(page)).toHaveCount(orderBefore.length, { timeout: 15_000 });
    });

    test('comments on the source section are not copied to the duplicate', async ({
      page,
      workflow,
    }) => {
      const source = workflow.sectionByTitle('E2E Section 3');
      const workflowUuid = workflowUuidFromPath(workflow.path);
      const orderBefore = await sectionOrderUuids(page);
      const sourceIndex = orderBefore.indexOf(source.uuid);
      let duplicateUuid: string | undefined;

      try {
        await openSectionCommentsViaHover(page, source.uuid);
        const body = `E2E section duplicate comments ${Date.now()}`;
        await composeComment(page, body);

        const graphBefore = await fetchGraphView(page, workflowUuid);
        expect(commentCountForSection(graphBefore, source.uuid)).toBeGreaterThan(0);

        await hoverSectionHeader(page, source.uuid);
        await duplicateBelowButtonInSectionHeader(page, source.uuid).click();
        await expect(sectionContainers(page)).toHaveCount(orderBefore.length + 1, {
          timeout: 15_000,
        });

        const orderAfter = await sectionOrderUuids(page);
        duplicateUuid = orderAfter[sourceIndex + 1]!;
        const graphAfter = await fetchGraphView(page, workflowUuid);

        expect(commentCountForSection(graphAfter, source.uuid)).toBeGreaterThan(0);
        expect(commentCountForSection(graphAfter, duplicateUuid)).toBe(0);
      } finally {
        if (duplicateUuid && (await sectionContainer(page, duplicateUuid).count()) > 0) {
          await deleteSectionViaHover(page, duplicateUuid);
        }
      }
      await expect(sectionContainers(page)).toHaveCount(orderBefore.length, { timeout: 15_000 });
    });
  });

  test.describe('Sidebar path', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await skipUnlessPristineWorkflow(page, workflow);
    });

    test('duplicate from sidebar keeps form bound to source and places copy immediately below', async ({
      page,
      workflow,
    }) => {
      const source = workflow.sectionByTitle('E2E Section 3');
      const orderBefore = await sectionOrderUuids(page);
      const sourceIndex = orderBefore.indexOf(source.uuid);
      let duplicateUuid: string | undefined;

      try {
        await sectionHeader(page, source.uuid).click();
        await expect(editSectionForm(page)).toBeVisible();
        await expect(selectedSectionContainer(page, source.uuid)).toBeVisible();
        await expect(duplicateButtonInSidebar(page)).toBeEnabled();
        await duplicateButtonInSidebar(page).click();

        await expect(sectionContainers(page)).toHaveCount(orderBefore.length + 1, {
          timeout: 15_000,
        });
        const orderAfter = await sectionOrderUuids(page);
        duplicateUuid = orderAfter[sourceIndex + 1]!;
        expect(duplicateUuid).not.toBe(source.uuid);
        await expect(sectionHeader(page, duplicateUuid)).toContainText('E2E Section 3 (copy)');

        await expect(editSectionForm(page)).toBeVisible();
        await expect(selectedSectionContainer(page, source.uuid)).toBeVisible();
        await expect(titleFieldInEditSectionForm(page)).toHaveValue('E2E Section 3');
        await expect(selectedSectionContainer(page, duplicateUuid)).toHaveCount(0);
      } finally {
        if (duplicateUuid && (await sectionContainer(page, duplicateUuid).count()) > 0) {
          await deleteSectionViaHover(page, duplicateUuid);
        }
      }
      await expect(sectionContainers(page)).toHaveCount(orderBefore.length, { timeout: 15_000 });
    });
  });

  test.describe('Course workflow — linked nodes', () => {
    test('duplicate preserves linkedWorkflow associations and indicator', async ({
      page,
      workflow,
    }) => {
      const course = workflow.workflowByType('course');
      await page.goto(course.workflow_path);
      await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });

      const source = course.sections[0]!;
      const graphBefore = await fetchGraphView(page, course.workflow_uuid);
      const linkedBefore = nodesInSection(graphBefore, source.uuid).filter(
        (node) => node.linkedWorkflowUuid,
      );
      expect(
        linkedBefore.length,
        'Course fixture first section must include at least one linked workflow node',
      ).toBeGreaterThan(0);

      const sectionCountBefore = await sectionContainers(page).count();
      let duplicateUuid: string | undefined;

      try {
        await hoverSectionHeader(page, source.uuid);
        await duplicateBelowButtonInSectionHeader(page, source.uuid).click();

        await expect(sectionContainers(page)).toHaveCount(sectionCountBefore + 1, {
          timeout: 15_000,
        });

        const orderAfter = await sectionOrderUuids(page);
        duplicateUuid = orderAfter[orderAfter.indexOf(source.uuid) + 1]!;
        const graphAfter = await fetchGraphView(page, course.workflow_uuid);
        const linkedAfter = nodesInSection(graphAfter, duplicateUuid).filter(
          (node) => node.linkedWorkflowUuid,
        );

        expect(linkedAfter.map((node) => node.linkedWorkflowUuid).sort()).toEqual(
          linkedBefore.map((node) => node.linkedWorkflowUuid).sort(),
        );

        for (const node of linkedAfter) {
          await expect(workflowNodeLinkedWorkflowIndicator(page, node.uuid)).toBeVisible();
          await expect(workflowNodeLinkedWorkflowIndicator(page, node.uuid)).toHaveText(
            'Linked activity',
          );
        }
      } finally {
        if (duplicateUuid && (await sectionContainer(page, duplicateUuid).count()) > 0) {
          await deleteSectionViaHover(page, duplicateUuid);
        }
      }
      await expect(sectionContainers(page)).toHaveCount(sectionCountBefore, { timeout: 15_000 });
    });
  });

  test.describe('Role behavior', () => {
    test.describe('commenter', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('commenter has disabled hover duplicate and sidebar duplicate', async ({
        page,
        workflow,
      }) => {
        const commenter = workflow.contributorByRole('commenter');
        await loginAs(page, { email: commenter.email, password: commenter.password });
        await page.goto(workflow.path);
        await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });

        const sectionUuid = workflow.firstSection().uuid;
        await hoverSectionHeader(page, sectionUuid);
        // FR-SEC-005 / FR-SEC-007: duplicate item is present and disabled (not omitted).
        await expect(duplicateBelowButtonInSectionHeader(page, sectionUuid)).toBeVisible();
        await expect(duplicateBelowButtonInSectionHeader(page, sectionUuid)).toBeDisabled();

        await sectionHeader(page, sectionUuid).click();
        await expect(editSectionForm(page)).toBeVisible();
        await expect(duplicateButtonInSidebar(page)).toBeDisabled();
      });
    });

    test.describe('viewer', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('viewer cannot reach hover duplicate; sidebar duplicate is disabled when form is open', async ({
        page,
        workflow,
      }) => {
        const viewer = workflow.contributorByRole('viewer');
        await loginAs(page, { email: viewer.email, password: viewer.password });
        await page.goto(workflow.path);
        await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });

        const sectionUuid = workflow.firstSection().uuid;
        await sectionHeader(page, sectionUuid).hover();

        await expect(sectionHoverMenu(page, sectionUuid)).toBeHidden();
        await expect(page.getByRole('button', { name: DUPLICATE_SECTION_BELOW_NAME })).toHaveCount(
          0,
        );

        await sectionHeader(page, sectionUuid).click({ force: true });
        if (await editSectionForm(page).isVisible()) {
          await expect(duplicateButtonInSidebar(page)).toBeDisabled();
        }
      });
    });
  });
});
