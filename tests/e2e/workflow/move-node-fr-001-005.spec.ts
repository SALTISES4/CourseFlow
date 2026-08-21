import { test, expect } from '../../fixtures';
import { setRowInsertMode } from './add-tab.helpers';
import { firstWorkflowNodeUuid } from './comments-tab.helpers';
import { edgeIdString } from './workflow-graph.helpers';
import { workflowEdge } from './edge.locators';
import {
  dragWorkflowNodeOntoEmptyCell,
  dragWorkflowNodeOntoNode,
  ensureChainEdgesWithMetadata,
  ensureDirectedEdgeViaApi,
  expectEdgeUnchanged,
  expectIncidentEdgesPreserved,
  findMiddleNodeInVerticalStackInWorkflow,
  findNodeWithEmptyLateralCellInWorkflow,
  findNodeWithIncidentEdgesAndLateralGapInWorkflow,
  moveNodeGridViaApi,
  waitForNodePlacement,
} from './move-node.helpers';
import {
  fetchGraphView,
  findEdgeBetween,
  nodeByUuid,
  nodesInSection,
  workflowUuidFromPath,
} from './workflow-graph.helpers';
import { workflowNode } from './workflow-graph.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

test.setTimeout(60_000);

/**
 * Move node — FR-WF-MV-003, FR-WF-MV-004, FR-WF-MV-005 (edge preservation).
 * Requirements: workflow_move_node_requirements_v1.yaml, workflow_edge_requirements_v1.yaml
 */

test.describe('Move node — edge preservation (FR-WF-MV-005)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(workflowNode(page, await firstWorkflowNodeUuid(page))).toBeVisible({
      timeout: 15_000,
    });
    await setRowInsertMode(page);
  });

  test('FR-WF-MV-005: lateral move to another workflowChannel preserves incident workflowEdges', async ({
    page,
    workflow,
  }) => {
    const workflowUuid = workflowUuidFromPath(workflow.path);
    let graphBefore = await fetchGraphView(page, workflowUuid);

    let lateral = findNodeWithIncidentEdgesAndLateralGapInWorkflow(graphBefore);
    if (!lateral) {
      const candidate = findNodeWithEmptyLateralCellInWorkflow(graphBefore);
      expect(candidate, 'Expected a lateral move candidate in the workflow').toBeTruthy();
      const endpoints = nodesInSection(graphBefore, candidate!.sectionUuid)
        .filter((node) => node.uuid !== candidate!.node.uuid)
        .slice(0, 2);
      expect(endpoints.length).toBeGreaterThanOrEqual(2);
      await ensureChainEdgesWithMetadata(
        page,
        workflow.graphUuid,
        workflowUuid,
        endpoints[0]!.uuid,
        candidate!.node.uuid,
        endpoints[1]!.uuid,
        'E2E lateral move',
      );
      graphBefore = await fetchGraphView(page, workflowUuid);
      lateral = findNodeWithIncidentEdgesAndLateralGapInWorkflow(graphBefore);
    }

    expect(lateral, 'Expected incident workflowEdges on a lateral move candidate').toBeTruthy();
    const { sectionUuid, node: middle, targetChannelUuid } = lateral!;
    const beforeMove = graphBefore;
    const sourceChannelUuid = middle.channelUuid!;
    const sourceRow = middle.sectionRow ?? 0;

    await dragWorkflowNodeOntoEmptyCell(
      page,
      beforeMove,
      middle.uuid,
      sectionUuid,
      sourceRow,
      targetChannelUuid,
    );

    const afterMove = await waitForNodePlacement(
      page,
      workflowUuid,
      middle.uuid,
      (node) => node.channelUuid === targetChannelUuid,
    );

    expectIncidentEdgesPreserved(beforeMove, afterMove, middle.uuid);
    expect(nodeByUuid(afterMove, middle.uuid)?.channelUuid).toBe(targetChannelUuid);
    expect(nodeByUuid(afterMove, middle.uuid)?.sectionUuid).toBe(sectionUuid);
    expect(nodeByUuid(afterMove, middle.uuid)?.sectionRow).toBe(sourceRow);
    expect(nodeByUuid(afterMove, middle.uuid)?.channelUuid).not.toBe(sourceChannelUuid);

    const incident = beforeMove.edges.filter(
      (edge) => edge.sourceNodeUuid === middle.uuid || edge.targetNodeUuid === middle.uuid,
    );
    for (const edge of incident) {
      await expect(workflowEdge(page, edgeIdString(edge))).toBeVisible();
    }
  });

  test('FR-WF-MV-005: vertical move within the same workflowChannel preserves incident workflowEdges', async ({
    page,
    workflow,
  }) => {
    const workflowUuid = workflowUuidFromPath(workflow.path);
    let graphBefore = await fetchGraphView(page, workflowUuid);
    let stack = findMiddleNodeInVerticalStackInWorkflow(graphBefore);
    expect(stack, 'Expected a vertical three-node stack in the workflow').toBeTruthy();

    let { sectionUuid, middle, below } = stack!;
    let above = nodesInSection(graphBefore, sectionUuid).find(
      (node) =>
        node.channelUuid === middle.channelUuid &&
        (node.sectionRow ?? 0) === (middle.sectionRow ?? 0) - 1,
    );
    expect(above, 'Expected a node directly above the vertical move source').toBeTruthy();

    const hasChain =
      findEdgeBetween(graphBefore, above!.uuid, middle.uuid) &&
      findEdgeBetween(graphBefore, middle.uuid, below.uuid);
    if (!hasChain) {
      await ensureChainEdgesWithMetadata(
        page,
        workflow.graphUuid,
        workflowUuid,
        above!.uuid,
        middle.uuid,
        below.uuid,
        'E2E vertical move',
      );
      graphBefore = await fetchGraphView(page, workflowUuid);
      stack = findMiddleNodeInVerticalStackInWorkflow(graphBefore);
      expect(stack).toBeTruthy();
      sectionUuid = stack!.sectionUuid;
      middle = stack!.middle;
      below = stack!.below;
      above = nodesInSection(graphBefore, sectionUuid).find(
        (node) =>
          node.channelUuid === middle.channelUuid &&
          (node.sectionRow ?? 0) === (middle.sectionRow ?? 0) - 1,
      );
    }

    const beforeMove = graphBefore;
    const sourceRow = middle.sectionRow ?? 0;

    await dragWorkflowNodeOntoNode(page, middle.uuid, below.uuid, 'bottom');

    const afterMove = await waitForNodePlacement(
      page,
      workflowUuid,
      middle.uuid,
      (node) => (node.sectionRow ?? 0) > sourceRow,
    );

    expectIncidentEdgesPreserved(beforeMove, afterMove, middle.uuid);
    expect(nodeByUuid(afterMove, middle.uuid)?.channelUuid).toBe(middle.channelUuid);
    expect(nodeByUuid(afterMove, middle.uuid)?.sectionRow ?? 0).toBeGreaterThan(sourceRow);
  });

  test('FR-WF-MV-005: moving between linked workflowNodes preserves the direct workflowEdge', async ({
    page,
    workflow,
  }) => {
    const workflowUuid = workflowUuidFromPath(workflow.path);
    const graphBefore = await fetchGraphView(page, workflowUuid);
    const lateral = findNodeWithEmptyLateralCellInWorkflow(graphBefore);
    expect(lateral, 'Expected a lateral gap for between-node move').toBeTruthy();

    const { sectionUuid, node: left, targetChannelUuid: gapChannelUuid } = lateral!;
    const row = left.sectionRow ?? 0;
    const right = nodesInSection(graphBefore, sectionUuid).find(
      (node) =>
        node.uuid !== left.uuid &&
        (node.sectionRow ?? 0) === row &&
        node.channelUuid !== left.channelUuid &&
        node.channelUuid !== gapChannelUuid,
    );
    expect(right, 'Expected a second workflowNode on the same row for bridge edge').toBeTruthy();

    const mover = nodesInSection(graphBefore, sectionUuid).find(
      (node) => (node.sectionRow ?? 0) !== row,
    );
    expect(mover, 'Expected a workflowNode on a different row to move into the gap').toBeTruthy();

    const beforeMove = await fetchGraphView(page, workflowUuid);
    const bridgeEdge = await ensureDirectedEdgeViaApi(
      page,
      workflow.graphUuid,
      workflowUuid,
      left.uuid,
      right!.uuid,
    );

    await dragWorkflowNodeOntoEmptyCell(
      page,
      beforeMove,
      mover!.uuid,
      sectionUuid,
      row,
      gapChannelUuid,
    );

    const afterMove = await waitForNodePlacement(
      page,
      workflowUuid,
      mover!.uuid,
      (node) => node.channelUuid === gapChannelUuid && (node.sectionRow ?? 0) === row,
    );

    expectEdgeUnchanged(beforeMove, afterMove, left.uuid, right!.uuid);
    expect(findEdgeBetween(afterMove, left.uuid, right!.uuid)?.id).toBe(bridgeEdge.id);
    await expect(workflowNode(page, mover!.uuid)).toBeVisible();
  });
});

test.describe('Move node — cross-section (FR-WF-MV-004, FR-WF-MV-005)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(workflowNode(page, await firstWorkflowNodeUuid(page))).toBeVisible({
      timeout: 15_000,
    });
    await setRowInsertMode(page);
  });

  test('FR-WF-MV-004/005: cross-section move preserves cross-section workflowEdges', async ({
    page,
    workflow,
  }) => {
    const workflowUuid = workflowUuidFromPath(workflow.path);
    const anchorSectionUuid = workflow.firstSection().uuid;
    const destinationSectionUuid = workflow.sectionByTitle('E2E Section 3').uuid;
    const graphBefore = await fetchGraphView(page, workflowUuid);

    const [anchor, moving] = nodesInSection(graphBefore, anchorSectionUuid).slice(0, 2);
    expect(anchor && moving, 'Expected two nodes in the first section for cross-section setup').toBeTruthy();

    const crossEdge = await ensureDirectedEdgeViaApi(
      page,
      workflow.graphUuid,
      workflowUuid,
      anchor!.uuid,
      moving!.uuid,
    );
    const beforeMove = await fetchGraphView(page, workflowUuid);
    const destinationNode = nodesInSection(beforeMove, destinationSectionUuid)[0];
    expect(destinationNode, 'Expected a node in the destination section').toBeTruthy();

    // Cross-section grid placement is exercised via the move API; edge preservation is asserted on graph view.
    await moveNodeGridViaApi(page, moving!.uuid, {
      toSectionUuid: destinationSectionUuid,
      toChannelUuid: destinationNode!.channelUuid!,
      rowHint: (destinationNode!.sectionRow ?? 0) + 1,
      mode: 'row',
      edge: 'bottom',
    });

    const afterMove = await waitForNodePlacement(
      page,
      workflowUuid,
      moving!.uuid,
      (node) => node.sectionUuid === destinationSectionUuid,
    );

    expectIncidentEdgesPreserved(beforeMove, afterMove, moving!.uuid);
    expectEdgeUnchanged(beforeMove, afterMove, anchor!.uuid, moving!.uuid);
    expect(findEdgeBetween(afterMove, anchor!.uuid, moving!.uuid)?.id).toBe(crossEdge.id);
    expect(nodeByUuid(afterMove, anchor!.uuid)?.sectionUuid).toBe(anchorSectionUuid);
    expect(nodeByUuid(afterMove, moving!.uuid)?.sectionUuid).toBe(destinationSectionUuid);
  });
});
