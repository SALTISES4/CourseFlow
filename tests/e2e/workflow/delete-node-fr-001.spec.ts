import { test, expect } from '../../fixtures';
import {
  firstNodeUuidInSection,
  lastNodeUuidInSection,
  setRowInsertMode,
  workflowNodeCount,
} from './add-tab.helpers';
import { hoverWorkflowNode } from './comments-tab.helpers';
import {
  customizeEdgeMetadata,
  createIsolatedNodeCopiesViaApi,
  ensureDirectedEdge,
  edgesAmongNodes,
  expectBypassEdgeBetween,
  expectNoEdgeBetween,
  expectNoEdgesIncidentOnNode,
  hoverDeleteWorkflowNode,
} from './delete-node.helpers';
import { loginAsWorkflowContributor } from './role.helpers';
import {
  workflowEditNodeForm,
  workflowEditNodeFormDeleteButton,
  workflowNode,
  workflowNodeHoverDeleteItem,
  workflowNodeHoverDuplicateItem,
  workflowNodeTitle,
} from './workflow-graph.locators';
import {
  fetchGraphView,
  workflowUuidFromPath,
} from './workflow-graph.helpers';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Delete node — FR-WF-DEL-001 (sidebar), FR-WF-DEL-002 (hover menu), FR-WF-DEL-004 (edge cleanup).
 * Requirements: workflow_delete_node_requirements_v1.yaml
 */

test.describe('Delete node — sidebar (FR-WF-DEL-001)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-DEL-001: sidebar delete removes disposable workflowNode immediately', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.blankSection().uuid;
    const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);
    const beforeCount = await workflowNodeCount(page);

    await setRowInsertMode(page);
    await hoverWorkflowNode(page, sourceUuid);
    await workflowNodeHoverDuplicateItem(page, sourceUuid).click();
    await expect
      .poll(async () => workflowNodeCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);

    const disposableUuid = await lastNodeUuidInSection(page, sectionUuid);
    await workflowNodeTitle(page, disposableUuid).click();
    await expect(workflowEditNodeForm(page)).toBeVisible();
    await workflowEditNodeFormDeleteButton(page).click();

    await expect
      .poll(async () => workflowNodeCount(page), { timeout: 10_000 })
      .toBe(beforeCount);
    await expect(workflowNode(page, disposableUuid)).toHaveCount(0);
  });
});

test.describe('Delete node — hover menu (FR-WF-DEL-002)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-DEL-002: hover delete removes disposable workflowNode immediately', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.blankSection().uuid;
    const sourceUuid = await firstNodeUuidInSection(page, sectionUuid);
    const beforeCount = await workflowNodeCount(page);

    await setRowInsertMode(page);

    await hoverWorkflowNode(page, sourceUuid);
    await workflowNodeHoverDuplicateItem(page, sourceUuid).click();
    await expect
      .poll(async () => workflowNodeCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);

    const disposableUuid = await lastNodeUuidInSection(page, sectionUuid);
    await hoverDeleteWorkflowNode(page, disposableUuid);

    await expect
      .poll(async () => workflowNodeCount(page), { timeout: 10_000 })
      .toBe(beforeCount);
  });
});

test.describe('Delete node — edge handling (FR-WF-DEL-004)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(workflowNode(page, await firstNodeUuidInSection(page, workflow.firstSection().uuid))).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-WF-DEL-004: linear chain delete removes incident edges and creates bypass edge', async ({
    page,
    workflow,
  }) => {
    const workflowUuid = workflowUuidFromPath(workflow.path);
    const sectionUuid = workflow.firstSection().uuid;
    const graphBefore = await fetchGraphView(page, workflowUuid);
    const sourceNode = graphBefore.nodes.find((node) => node.sectionUuid === sectionUuid);
    expect(sourceNode).toBeTruthy();
    const [n1Uuid, n2Uuid, n3Uuid] = await createIsolatedNodeCopiesViaApi(
      page,
      workflow.graphUuid,
      sourceNode!.uuid,
      3,
    );

    const edgeIn = await ensureDirectedEdge(
      page,
      workflow.graphUuid,
      workflowUuid,
      n1Uuid,
      n2Uuid,
    );
    await ensureDirectedEdge(page, workflow.graphUuid, workflowUuid, n2Uuid, n3Uuid);
    await customizeEdgeMetadata(page, edgeIn, 'E2E incident edge title');

    await hoverDeleteWorkflowNode(page, n2Uuid);

    const graphAfter = await fetchGraphView(page, workflowUuid);
    expectNoEdgesIncidentOnNode(graphAfter, n2Uuid);
    expectBypassEdgeBetween(graphAfter, n1Uuid, n3Uuid);
    expect(graphAfter.nodes.some((node) => node.uuid === n2Uuid)).toBe(false);
  });

  test('FR-WF-DEL-004: multi-edge node delete removes every incident edge without bypass', async ({
    page,
    workflow,
  }) => {
    const workflowUuid = workflowUuidFromPath(workflow.path);
    const sectionUuid = workflow.firstSection().uuid;
    const graphBefore = await fetchGraphView(page, workflowUuid);
    const sourceNode = graphBefore.nodes.find((node) => node.sectionUuid === sectionUuid);
    expect(sourceNode).toBeTruthy();
    const [a1Uuid, a2Uuid, middleUuid, b1Uuid, b2Uuid] =
      await createIsolatedNodeCopiesViaApi(
        page,
        workflow.graphUuid,
        sourceNode!.uuid,
        5,
      );
    const disposableUuids = [a1Uuid, a2Uuid, middleUuid, b1Uuid, b2Uuid];

    await ensureDirectedEdge(page, workflow.graphUuid, workflowUuid, a1Uuid, middleUuid);
    await ensureDirectedEdge(page, workflow.graphUuid, workflowUuid, a2Uuid, middleUuid);
    await ensureDirectedEdge(page, workflow.graphUuid, workflowUuid, middleUuid, b1Uuid);
    await ensureDirectedEdge(page, workflow.graphUuid, workflowUuid, middleUuid, b2Uuid);

    const graphWithEdges = await fetchGraphView(page, workflowUuid);
    expect(edgesAmongNodes(graphWithEdges, disposableUuids)).toHaveLength(4);

    await hoverDeleteWorkflowNode(page, middleUuid);

    const graphAfter = await fetchGraphView(page, workflowUuid);
    expectNoEdgesIncidentOnNode(graphAfter, middleUuid);
    expect(edgesAmongNodes(graphAfter, disposableUuids)).toHaveLength(0);
    expectNoEdgeBetween(graphAfter, a1Uuid, b1Uuid);
    expectNoEdgeBetween(graphAfter, a1Uuid, b2Uuid);
    expectNoEdgeBetween(graphAfter, a2Uuid, b1Uuid);
    expectNoEdgeBetween(graphAfter, a2Uuid, b2Uuid);
  });

  test('FR-WF-DEL-004: incoming-only node delete removes incoming edges without bypass', async ({
    page,
    workflow,
  }) => {
    const workflowUuid = workflowUuidFromPath(workflow.path);
    const sectionUuid = workflow.firstSection().uuid;
    const graphBefore = await fetchGraphView(page, workflowUuid);
    const sourceNode = graphBefore.nodes.find((node) => node.sectionUuid === sectionUuid);
    expect(sourceNode).toBeTruthy();
    const [sourceUuid, targetUuid] = await createIsolatedNodeCopiesViaApi(
      page,
      workflow.graphUuid,
      sourceNode!.uuid,
      2,
    );

    await ensureDirectedEdge(page, workflow.graphUuid, workflowUuid, sourceUuid, targetUuid);
    await hoverDeleteWorkflowNode(page, targetUuid);

    const graphAfter = await fetchGraphView(page, workflowUuid);
    expectNoEdgesIncidentOnNode(graphAfter, targetUuid);
    expectNoEdgeBetween(graphAfter, sourceUuid, targetUuid);
  });

  test('FR-WF-DEL-004: outgoing-only node delete removes outgoing edges without bypass', async ({
    page,
    workflow,
  }) => {
    const workflowUuid = workflowUuidFromPath(workflow.path);
    const sectionUuid = workflow.firstSection().uuid;
    const graphBefore = await fetchGraphView(page, workflowUuid);
    const sourceNode = graphBefore.nodes.find((node) => node.sectionUuid === sectionUuid);
    expect(sourceNode).toBeTruthy();
    const [sourceUuid, targetUuid] = await createIsolatedNodeCopiesViaApi(
      page,
      workflow.graphUuid,
      sourceNode!.uuid,
      2,
    );

    await ensureDirectedEdge(page, workflow.graphUuid, workflowUuid, sourceUuid, targetUuid);
    await hoverDeleteWorkflowNode(page, sourceUuid);

    const graphAfter = await fetchGraphView(page, workflowUuid);
    expectNoEdgesIncidentOnNode(graphAfter, sourceUuid);
    expectNoEdgeBetween(graphAfter, sourceUuid, targetUuid);
  });
});

test.describe('Delete node — role behavior (FR-WF-DEL-002, FR-WF-NODE-005)', () => {
  test.describe('commenter', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-DEL-002: commenter sees disabled hover delete item', async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, 'commenter');
      await page.goto(workflow.path);

      const sectionUuid = workflow.firstSection().uuid;
      const nodeUuid = await firstNodeUuidInSection(page, sectionUuid);
      const beforeCount = await workflowNodeCount(page);

      await hoverWorkflowNode(page, nodeUuid);
      await expect(workflowNodeHoverDeleteItem(page, nodeUuid)).toBeDisabled();
      await workflowNodeHoverDeleteItem(page, nodeUuid).click({ force: true });

      expect(await workflowNodeCount(page)).toBe(beforeCount);
    });
  });

  test.describe('viewer', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-DEL-002: viewer cannot reach hover delete item', async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, 'viewer');
      await page.goto(workflow.path);

      const sectionUuid = workflow.firstSection().uuid;
      const nodeUuid = await firstNodeUuidInSection(page, sectionUuid);

      await workflowNode(page, nodeUuid).hover();
      await expect(workflowNodeHoverDeleteItem(page, nodeUuid)).toHaveCount(0);
    });
  });
});
