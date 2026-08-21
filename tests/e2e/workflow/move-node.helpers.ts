import { expect, type Page } from '@playwright/test';
import { authenticatedApiRequest } from '../../helpers/api';
import { workflowSectionRow } from '../../shared/locators/workflow';
import {
  edgesIncidentOnNode,
  fetchGraphView,
  findEdgeBetween,
  nodeByUuid,
  nodesInSection,
  orderedGraphChannels,
  type GraphViewEdge,
  type GraphViewNode,
  type GraphViewPayload,
} from './workflow-graph.helpers';
import { workflowNode } from './workflow-graph.locators';

async function beginWorkflowNodeDrag(
  page: Page,
  sourceNodeUuid: string,
): Promise<{ x: number; y: number }> {
  const source = workflowNode(page, sourceNodeUuid);
  await source.scrollIntoViewIfNeeded();
  const sourceBox = await source.boundingBox();
  if (!sourceBox) {
    throw new Error(`Move drag source workflowNode ${sourceNodeUuid} not visible.`);
  }

  const start = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 12, start.y, { steps: 4 });
  return start;
}

async function completeWorkflowNodeDrag(
  page: Page,
  dropX: number,
  dropY: number,
): Promise<void> {
  await page.mouse.move(dropX, dropY, { steps: 20 });
  await page.mouse.up();
}

export function channelColumnIndex(graph: GraphViewPayload, channelUuid: string): number {
  const index = orderedGraphChannels(graph).findIndex((channel) => channel.uuid === channelUuid);
  if (index < 0) {
    throw new Error(`Channel ${channelUuid} not found in graph view.`);
  }
  return index;
}

function isChannelCellOccupied(
  graph: GraphViewPayload,
  sectionUuid: string,
  channelUuid: string,
  row: number,
): boolean {
  return nodesInSection(graph, sectionUuid).some(
    (node) => node.channelUuid === channelUuid && (node.sectionRow ?? 0) === row,
  );
}

export function findEmptyChannelAtRow(
  graph: GraphViewPayload,
  sectionUuid: string,
  row: number,
  excludeChannelUuid?: string,
): string | undefined {
  for (const channel of orderedGraphChannels(graph)) {
    if (excludeChannelUuid && channel.uuid === excludeChannelUuid) {
      continue;
    }
    if (!isChannelCellOccupied(graph, sectionUuid, channel.uuid, row)) {
      return channel.uuid;
    }
  }
  return undefined;
}

/** Node with an empty workflowChannel cell on the same workflowSectionRow (lateral move target). */
export function findNodeWithEmptyLateralCell(
  graph: GraphViewPayload,
  sectionUuid: string,
): { node: GraphViewNode; targetChannelUuid: string } | undefined {
  for (const node of nodesInSection(graph, sectionUuid)) {
    if (!node.channelUuid) {
      continue;
    }
    const row = node.sectionRow ?? 0;
    const targetChannelUuid = findEmptyChannelAtRow(graph, sectionUuid, row, node.channelUuid);
    if (targetChannelUuid) {
      return { node, targetChannelUuid };
    }
  }
  return undefined;
}

/** Middle node in a same-channel vertical stack with nodes above and below. */
export function findMiddleNodeInVerticalStack(
  graph: GraphViewPayload,
  sectionUuid: string,
): { middle: GraphViewNode; below: GraphViewNode } | undefined {
  const byChannel = new Map<string, GraphViewNode[]>();
  for (const node of nodesInSection(graph, sectionUuid)) {
    if (!node.channelUuid) {
      continue;
    }
    const list = byChannel.get(node.channelUuid) ?? [];
    list.push(node);
    byChannel.set(node.channelUuid, list);
  }

  for (const nodes of byChannel.values()) {
    const sorted = [...nodes].sort((left, right) => (left.sectionRow ?? 0) - (right.sectionRow ?? 0));
    for (let index = 1; index < sorted.length - 1; index += 1) {
      const middle = sorted[index];
      const below = sorted[index + 1];
      const above = sorted[index - 1];
      if ((below.sectionRow ?? 0) === (middle.sectionRow ?? 0) + 1 &&
          (middle.sectionRow ?? 0) === (above.sectionRow ?? 0) + 1) {
        return { middle, below };
      }
    }
  }

  return undefined;
}

/** One node in each of two different workflowSectionContainers. */
export function findNodesInDifferentSections(
  graph: GraphViewPayload,
): { source: GraphViewNode; target: GraphViewNode } | undefined {
  const bySection = new Map<string, GraphViewNode[]>();
  for (const node of graph.nodes) {
    if (!node.sectionUuid) {
      continue;
    }
    const list = bySection.get(node.sectionUuid) ?? [];
    list.push(node);
    bySection.set(node.sectionUuid, list);
  }

  const sectionUuids = [...bySection.keys()];
  if (sectionUuids.length < 2) {
    return undefined;
  }

  const sourceSectionUuid = sectionUuids[0];
  const targetSectionUuid = sectionUuids[1];
  const source = bySection.get(sourceSectionUuid)?.[0];
  const target = bySection.get(targetSectionUuid)?.[0];
  if (!source || !target) {
    return undefined;
  }

  return { source, target };
}

export async function dragWorkflowNodeOntoNode(
  page: Page,
  sourceNodeUuid: string,
  targetNodeUuid: string,
  edge: 'top' | 'bottom' = 'bottom',
  verticalFraction?: number,
): Promise<void> {
  const source = workflowNode(page, sourceNodeUuid);
  const targetNode = workflowNode(page, targetNodeUuid);
  const targetRow = targetNode.locator(
    'xpath=ancestor::*[@data-test-id="workflow-section-row"]',
  );

  await source.scrollIntoViewIfNeeded();
  await targetNode.scrollIntoViewIfNeeded();

  const sourceBox = await source.boundingBox();
  const targetNodeBox = await targetNode.boundingBox();
  const targetRowBox = await targetRow.boundingBox();
  if (!sourceBox || !targetNodeBox || !targetRowBox) {
    throw new Error('Move drag source or drop target not visible.');
  }

  const fraction = verticalFraction ?? (edge === 'top' ? 0.25 : 0.75);
  const dropX = targetNodeBox.x + targetNodeBox.width / 2;
  const dropY = targetNodeBox.y + targetNodeBox.height * fraction;

  await beginWorkflowNodeDrag(page, sourceNodeUuid);
  await completeWorkflowNodeDrag(page, dropX, dropY);
}

export async function dragWorkflowNodeOntoEmptyCell(
  page: Page,
  graph: GraphViewPayload,
  sourceNodeUuid: string,
  sectionUuid: string,
  rowIndex: number,
  targetChannelUuid: string,
): Promise<void> {
  const source = workflowNode(page, sourceNodeUuid);
  const row = workflowSectionRow(page, sectionUuid, rowIndex);
  const columnIndex = channelColumnIndex(graph, targetChannelUuid);
  const cell = row.locator('> div').nth(columnIndex);

  await source.scrollIntoViewIfNeeded();
  await row.scrollIntoViewIfNeeded();
  await expect(cell).toBeVisible({ timeout: 10_000 });

  const sourceBox = await source.boundingBox();
  const cellBox = await cell.boundingBox();
  if (!sourceBox || !cellBox) {
    throw new Error('Move drag source or empty cell target not visible.');
  }

  await beginWorkflowNodeDrag(page, sourceNodeUuid);
  await completeWorkflowNodeDrag(page, cellBox.x + cellBox.width / 2, cellBox.y + cellBox.height / 2);
}

export async function dragWorkflowNodeOntoSectionRow(
  page: Page,
  sourceNodeUuid: string,
  sectionUuid: string,
  rowIndex: number | 'empty',
  edge: 'top' | 'bottom' = 'bottom',
): Promise<void> {
  const source = workflowNode(page, sourceNodeUuid);
  const target = workflowSectionRow(page, sectionUuid, rowIndex);

  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error('Move drag source or section row target not visible.');
  }

  const dropY =
    edge === 'top' ? targetBox.y + targetBox.height / 4 : targetBox.y + (targetBox.height * 3) / 4;

  await beginWorkflowNodeDrag(page, sourceNodeUuid);
  await completeWorkflowNodeDrag(page, targetBox.x + targetBox.width / 2, dropY);
}

export async function waitForNodePlacement(
  page: Page,
  workflowUuid: string,
  nodeUuid: string,
  predicate: (node: GraphViewNode) => boolean,
): Promise<GraphViewPayload> {
  let graph!: GraphViewPayload;
  await expect
    .poll(async () => {
      graph = await fetchGraphView(page, workflowUuid);
      const node = nodeByUuid(graph, nodeUuid);
      return Boolean(node && predicate(node));
    }, { timeout: 15_000 })
    .toBe(true);
  return graph;
}

export function expectIncidentEdgesPreserved(
  before: GraphViewPayload,
  after: GraphViewPayload,
  nodeUuid: string,
): void {
  const beforeIncident = edgesIncidentOnNode(before, nodeUuid);
  expect(beforeIncident.length, `Expected incident edges on ${nodeUuid} before move`).toBeGreaterThan(0);

  for (const edge of beforeIncident) {
    const afterEdge = after.edges.find((candidate) => candidate.id === edge.id);
    expect(afterEdge, `Expected workflowEdge ${edge.id} to survive move`).toBeTruthy();
    expect(afterEdge!.sourceNodeUuid).toBe(edge.sourceNodeUuid);
    expect(afterEdge!.targetNodeUuid).toBe(edge.targetNodeUuid);
    expect(afterEdge!.title).toBe(edge.title);
    expect(afterEdge!.lineType).toBe(edge.lineType);
    expect(afterEdge!.sourcePort).toBe(edge.sourcePort);
    expect(afterEdge!.targetPort).toBe(edge.targetPort);
  }
}

export function expectEdgeUnchanged(
  before: GraphViewPayload,
  after: GraphViewPayload,
  sourceUuid: string,
  targetUuid: string,
): void {
  const beforeEdge = findEdgeBetween(before, sourceUuid, targetUuid);
  expect(beforeEdge, `Expected workflowEdge ${sourceUuid} -> ${targetUuid} before move`).toBeTruthy();
  const afterEdge = after.edges.find((edge) => edge.id === beforeEdge!.id);
  expect(afterEdge, `Expected workflowEdge ${beforeEdge!.id} to survive move`).toBeTruthy();
  expect(afterEdge!.sourceNodeUuid).toBe(sourceUuid);
  expect(afterEdge!.targetNodeUuid).toBe(targetUuid);
  expect(afterEdge!.title).toBe(beforeEdge!.title);
  expect(afterEdge!.lineType).toBe(beforeEdge!.lineType);
}

export function findNodeWithEmptyLateralCellInWorkflow(
  graph: GraphViewPayload,
): { sectionUuid: string; node: GraphViewNode; targetChannelUuid: string } | undefined {
  for (const section of graph.sections) {
    const match = findNodeWithEmptyLateralCell(graph, section.uuid);
    if (match) {
      return { sectionUuid: section.uuid, ...match };
    }
  }
  return undefined;
}

export function findMiddleNodeInVerticalStackInWorkflow(
  graph: GraphViewPayload,
): { sectionUuid: string; middle: GraphViewNode; below: GraphViewNode } | undefined {
  for (const section of graph.sections) {
    const match = findMiddleNodeInVerticalStack(graph, section.uuid);
    if (match) {
      return { sectionUuid: section.uuid, ...match };
    }
  }
  return undefined;
}

export function findNodeWithIncidentEdgesAndLateralGapInWorkflow(
  graph: GraphViewPayload,
): { sectionUuid: string; node: GraphViewNode; targetChannelUuid: string } | undefined {
  for (const section of graph.sections) {
    const match = findNodeWithIncidentEdgesAndLateralGap(graph, section.uuid);
    if (match) {
      return { sectionUuid: section.uuid, ...match };
    }
  }
  return undefined;
}

export function findNodeWithIncidentEdgesAndLateralGap(
  graph: GraphViewPayload,
  sectionUuid: string,
): { node: GraphViewNode; targetChannelUuid: string } | undefined {
  for (const node of nodesInSection(graph, sectionUuid)) {
    if (!node.channelUuid) {
      continue;
    }
    const targetChannelUuid = findEmptyChannelAtRow(
      graph,
      sectionUuid,
      node.sectionRow ?? 0,
      node.channelUuid,
    );
    if (!targetChannelUuid) {
      continue;
    }
    const incident = edgesIncidentOnNode(graph, node.uuid);
    const hasIncoming = incident.some((edge) => edge.targetNodeUuid === node.uuid);
    const hasOutgoing = incident.some((edge) => edge.sourceNodeUuid === node.uuid);
    if (hasIncoming && hasOutgoing) {
      return { node, targetChannelUuid };
    }
  }
  return undefined;
}

export function findCrossSectionEdgeEndpoints(
  graph: GraphViewPayload,
): { anchor: GraphViewNode; moving: GraphViewNode; edge: GraphViewEdge } | undefined {
  for (const edge of graph.edges) {
    const anchor = nodeByUuid(graph, edge.sourceNodeUuid);
    const moving = nodeByUuid(graph, edge.targetNodeUuid);
    if (
      anchor?.sectionUuid &&
      moving?.sectionUuid &&
      anchor.sectionUuid !== moving.sectionUuid
    ) {
      return { anchor, moving, edge };
    }
  }
  return undefined;
}

export async function moveNodeGridViaApi(
  page: Page,
  nodeUuid: string,
  payload: {
    toSectionUuid: string;
    toChannelUuid: string;
    rowHint: number;
    mode: 'row' | 'column';
    edge?: 'top' | 'bottom';
  },
): Promise<void> {
  const response = await authenticatedApiRequest(page, 'POST', `/api/node/${nodeUuid}/move`, {
    data: payload,
  });
  expect(response.ok(), `move node HTTP ${response.status()}`).toBeTruthy();
}

export async function ensureDirectedEdgeViaApi(
  page: Page,
  graphUuid: string,
  workflowUuid: string,
  sourceUuid: string,
  targetUuid: string,
): Promise<GraphViewEdge> {
  const existing = findEdgeBetween(await fetchGraphView(page, workflowUuid), sourceUuid, targetUuid);
  if (existing) {
    return existing;
  }

  const response = await authenticatedApiRequest(page, 'POST', `/api/graph/${graphUuid}/edges`, {
    data: {
      sourceNodeUuid: sourceUuid,
      targetNodeUuid: targetUuid,
      lineType: 'solid',
      sourcePort: 'bottom',
      targetPort: 'top',
    },
  });
  expect(response.ok(), `create edge HTTP ${response.status()}`).toBeTruthy();

  await expect
    .poll(async () => findEdgeBetween(await fetchGraphView(page, workflowUuid), sourceUuid, targetUuid))
    .toBeTruthy();

  const created = findEdgeBetween(await fetchGraphView(page, workflowUuid), sourceUuid, targetUuid);
  if (!created) {
    throw new Error(`Expected workflowEdge from ${sourceUuid} to ${targetUuid}`);
  }
  return created;
}

export async function ensureChainEdgesWithMetadata(
  page: Page,
  graphUuid: string,
  workflowUuid: string,
  predecessorUuid: string,
  middleUuid: string,
  successorUuid: string,
  _title: string,
): Promise<void> {
  await ensureDirectedEdgeViaApi(
    page,
    graphUuid,
    workflowUuid,
    predecessorUuid,
    middleUuid,
  );
  await ensureDirectedEdgeViaApi(
    page,
    graphUuid,
    workflowUuid,
    middleUuid,
    successorUuid,
  );
}
