import { expect, type Page } from '@playwright/test';
import { authenticatedApiRequest } from '../../helpers/api';

export type GraphViewEdge = {
  id: number;
  sourceNodeUuid: string;
  targetNodeUuid: string;
  title: string;
  lineType: string;
  sourcePort: string;
  targetPort: string;
};

export type GraphViewNode = {
  uuid: string;
  title: string;
  titleCopyCount: number;
  sectionUuid: string | null;
  channelUuid: string | null;
  sectionRow: number | null;
  linkedWorkflowUuid: string | null;
  outcomeUuids: string[];
};

export type GraphViewChannel = {
  uuid: string;
  title: string;
  systemLabelCode: string | null;
  titleCopyCount: number;
  colour: string;
  position: number;
};

export type GraphViewPayload = {
  sections: Array<{
    uuid: string;
    title: string;
    titleCopyCount: number;
    position: number;
    threadUuid?: string | null;
  }>;
  channels: GraphViewChannel[];
  nodes: GraphViewNode[];
  edges: GraphViewEdge[];
  threadCommentCounts?: Array<{ threadUuid: string; commentCount: number }>;
};

export function orderedGraphChannels(graph: GraphViewPayload): GraphViewChannel[] {
  return [...graph.channels].sort((left, right) => left.position - right.position);
}

export function graphNodeAssignments(graph: GraphViewPayload): Record<string, string | null> {
  return Object.fromEntries(
    graph.nodes.map((node) => [node.uuid, node.channelUuid ?? null]),
  );
}

export function graphEdgesSnapshot(graph: GraphViewPayload): GraphViewEdge[] {
  return [...graph.edges].sort((left, right) => left.id - right.id);
}

export function workflowUuidFromPath(path: string): string {
  const match = path.match(/\/workflow\/([^/]+)/);
  if (!match?.[1]) {
    throw new Error(`Cannot extract workflow UUID from path ${path}`);
  }
  return match[1];
}

export async function fetchGraphView(page: Page, workflowUuid: string): Promise<GraphViewPayload> {
  const response = await authenticatedApiRequest(page, 'GET', `/api/graph/${workflowUuid}/view`);
  expect(response.ok(), `graph view HTTP ${response.status()}`).toBeTruthy();
  return (await response.json()) as GraphViewPayload;
}

export function edgeIdString(edge: GraphViewEdge): string {
  return String(edge.id);
}

export function findEdgeBetween(
  graph: GraphViewPayload,
  sourceUuid: string,
  targetUuid: string,
): GraphViewEdge | undefined {
  return graph.edges.find(
    (edge) => edge.sourceNodeUuid === sourceUuid && edge.targetNodeUuid === targetUuid,
  );
}

/** Pair of node UUIDs with no directed edge from first to second. */
export function nodePairWithoutEdge(graph: GraphViewPayload): [string, string] | undefined {
  const nodeUuids = graph.nodes.map((node) => node.uuid);
  for (let i = 0; i < nodeUuids.length; i += 1) {
    for (let j = 0; j < nodeUuids.length; j += 1) {
      if (i === j) {
        continue;
      }
      const source = nodeUuids[i];
      const target = nodeUuids[j];
      if (!findEdgeBetween(graph, source, target)) {
        return [source, target];
      }
    }
  }
  return undefined;
}

export function nodeByUuid(graph: GraphViewPayload, nodeUuid: string): GraphViewNode | undefined {
  return graph.nodes.find((node) => node.uuid === nodeUuid);
}

export function findNodeInSectionChannelAtRow(
  graph: GraphViewPayload,
  sectionUuid: string,
  channelUuid: string,
  row: number,
): GraphViewNode | undefined {
  return nodesInSectionChannel(graph, sectionUuid, channelUuid).find(
    (node) => (node.sectionRow ?? 0) === row,
  );
}

export function nodesInSection(graph: GraphViewPayload, sectionUuid: string): GraphViewNode[] {
  return graph.nodes.filter((node) => node.sectionUuid === sectionUuid);
}

export function findNewNodeUuid(before: GraphViewPayload, after: GraphViewPayload): string {
  const beforeIds = new Set(before.nodes.map((node) => node.uuid));
  const added = after.nodes.filter((node) => !beforeIds.has(node.uuid));
  expect(added.length, 'Expected exactly one new workflowNode').toBe(1);
  return added[0].uuid;
}

export function findNewChannelUuid(before: GraphViewPayload, after: GraphViewPayload): string {
  const beforeIds = new Set(before.channels.map((channel) => channel.uuid));
  const added = after.channels.filter((channel) => !beforeIds.has(channel.uuid));
  expect(added.length, 'Expected exactly one new workflowChannel').toBe(1);
  return added[0].uuid;
}

/** Source with at least one node strictly below its workflowSectionRow anywhere in the section. */
export function findSourceWithNodesBelowInSection(
  graph: GraphViewPayload,
  sectionUuid: string,
): GraphViewNode | undefined {
  const nodes = nodesInSection(graph, sectionUuid);
  let best: GraphViewNode | undefined;
  let bestRow = Number.POSITIVE_INFINITY;

  for (const candidate of nodes) {
    const row = candidate.sectionRow ?? 0;
    if (row >= bestRow) {
      continue;
    }
    const hasNodesBelow = nodes.some(
      (other) => other.uuid !== candidate.uuid && (other.sectionRow ?? 0) > row,
    );
    if (hasNodesBelow) {
      best = candidate;
      bestRow = row;
    }
  }

  return best;
}

/** Row insert below a reference node: new node in target channel; all rows below shift across channels. */
export function expectRowInsertBelowReferenceNode(
  before: GraphViewPayload,
  after: GraphViewPayload,
  sectionUuid: string,
  referenceUuid: string,
  newNodeUuid: string,
  targetChannelUuid: string,
): void {
  const referenceBefore = nodeByUuid(before, referenceUuid);
  expect(referenceBefore, `Reference node ${referenceUuid} missing from before graph`).toBeTruthy();
  const referenceRow = referenceBefore!.sectionRow ?? 0;

  const newNode = nodeByUuid(after, newNodeUuid);
  expect(newNode?.sectionUuid).toBe(sectionUuid);
  expect(newNode?.channelUuid).toBe(targetChannelUuid);
  expect(newNode?.sectionRow).toBe(referenceRow + 1);

  const referenceAfter = nodeByUuid(after, referenceUuid);
  expect(referenceAfter?.sectionRow).toBe(referenceRow);
  expect(referenceAfter?.channelUuid).toBe(referenceBefore!.channelUuid);

  for (const node of nodesInSection(before, sectionUuid)) {
    if (node.uuid === referenceUuid) {
      continue;
    }
    const afterNode = nodeByUuid(after, node.uuid);
    expect(afterNode, `Node ${node.uuid} missing from after graph`).toBeTruthy();
    if ((node.sectionRow ?? 0) > referenceRow) {
      expect(afterNode!.sectionRow).toBe((node.sectionRow ?? 0) + 1);
      expect(afterNode!.channelUuid).toBe(node.channelUuid);
    } else {
      expect(afterNode!.sectionRow).toBe(node.sectionRow);
      expect(afterNode!.channelUuid).toBe(node.channelUuid);
    }
  }
}

export function edgesReferencingNodeUuids(
  graph: GraphViewPayload,
  nodeUuids: string[],
): GraphViewEdge[] {
  const ids = new Set(nodeUuids);
  return graph.edges.filter(
    (edge) => ids.has(edge.sourceNodeUuid) || ids.has(edge.targetNodeUuid),
  );
}

export function incomingEdges(graph: GraphViewPayload, nodeUuid: string): GraphViewEdge[] {
  return graph.edges.filter((edge) => edge.targetNodeUuid === nodeUuid);
}

export function outgoingEdges(graph: GraphViewPayload, nodeUuid: string): GraphViewEdge[] {
  return graph.edges.filter((edge) => edge.sourceNodeUuid === nodeUuid);
}

export function edgesIncidentOnNode(graph: GraphViewPayload, nodeUuid: string): GraphViewEdge[] {
  return edgesReferencingNodeUuids(graph, [nodeUuid]);
}

export function edgeLineTypeIsSolid(lineType: string): boolean {
  return lineType.toLowerCase() !== 'dashed';
}

function nodesInSectionChannel(
  graph: GraphViewPayload,
  sectionUuid: string,
  channelUuid: string,
): GraphViewNode[] {
  return nodesInSection(graph, sectionUuid).filter((node) => node.channelUuid === channelUuid);
}

function isChannelCellOccupied(
  graph: GraphViewPayload,
  sectionUuid: string,
  channelUuid: string,
  row: number,
): boolean {
  return nodesInSectionChannel(graph, sectionUuid, channelUuid).some(
    (node) => (node.sectionRow ?? 0) === row,
  );
}

function maxSectionRow(graph: GraphViewPayload, sectionUuid: string): number {
  const rows = nodesInSection(graph, sectionUuid).map((node) => node.sectionRow ?? 0);
  return rows.length > 0 ? Math.max(...rows) : 0;
}

/** First empty row in target channel at or below startRow within the section's row span. */
export function firstEmptyRowInChannelAtOrBelow(
  graph: GraphViewPayload,
  sectionUuid: string,
  channelUuid: string,
  startRow: number,
): number | undefined {
  const sectionMaxRow = maxSectionRow(graph, sectionUuid);
  for (let row = startRow; row <= sectionMaxRow; row += 1) {
    if (!isChannelCellOccupied(graph, sectionUuid, channelUuid, row)) {
      return row;
    }
  }
  return undefined;
}

export type ColumnInsertBelowScenario = 'empty-below' | 'occupied-gap' | 'occupied-no-gap';

function matchesColumnInsertBelowScenario(
  graph: GraphViewPayload,
  sectionUuid: string,
  targetChannelUuid: string,
  referenceRow: number,
  scenario: ColumnInsertBelowScenario,
): boolean {
  const targetRow = referenceRow + 1;
  const occupiedBelow = isChannelCellOccupied(
    graph,
    sectionUuid,
    targetChannelUuid,
    targetRow,
  );

  if (scenario === 'empty-below') {
    return !occupiedBelow;
  }

  if (!occupiedBelow) {
    return false;
  }

  const emptyBelowOccupant = firstEmptyRowInChannelAtOrBelow(
    graph,
    sectionUuid,
    targetChannelUuid,
    targetRow + 1,
  );

  if (scenario === 'occupied-gap') {
    return emptyBelowOccupant !== undefined;
  }

  return emptyBelowOccupant === undefined;
}

/**
 * Reference workflowNode whose row anchors a column insert into targetChannelUuid.
 * Evaluates target-channel occupancy at referenceRow + 1 for the given scenario.
 */
export function findReferenceNodeForColumnInsertBelow(
  graph: GraphViewPayload,
  sectionUuid: string,
  targetChannelUuid: string,
  scenario: ColumnInsertBelowScenario,
): GraphViewNode | undefined {
  const references = [...nodesInSection(graph, sectionUuid)].sort(
    (left, right) => (left.sectionRow ?? 0) - (right.sectionRow ?? 0),
  );

  return references.find((reference) =>
    matchesColumnInsertBelowScenario(
      graph,
      sectionUuid,
      targetChannelUuid,
      reference.sectionRow ?? 0,
      scenario,
    ),
  );
}

/** Source workflowNode in channelUuid matching the column-insert-below scenario. */
export function findSourceInChannelForColumnInsertBelow(
  graph: GraphViewPayload,
  sectionUuid: string,
  channelUuid: string,
  scenario: ColumnInsertBelowScenario,
): GraphViewNode | undefined {
  const sources = nodesInSectionChannel(graph, sectionUuid, channelUuid).sort(
    (left, right) => (left.sectionRow ?? 0) - (right.sectionRow ?? 0),
  );

  return sources.find((source) =>
    matchesColumnInsertBelowScenario(
      graph,
      sectionUuid,
      channelUuid,
      source.sectionRow ?? 0,
      scenario,
    ),
  );
}

export function expectColumnInsertEmptyCellBelow(
  before: GraphViewPayload,
  after: GraphViewPayload,
  sectionUuid: string,
  referenceUuid: string,
  newNodeUuid: string,
  targetChannelUuid: string,
): void {
  const referenceBefore = nodeByUuid(before, referenceUuid)!;
  const referenceRow = referenceBefore.sectionRow ?? 0;

  const newNode = nodeByUuid(after, newNodeUuid)!;
  expect(newNode.sectionUuid).toBe(sectionUuid);
  expect(newNode.channelUuid).toBe(targetChannelUuid);
  expect(newNode.sectionRow).toBe(referenceRow + 1);

  for (const node of nodesInSection(before, sectionUuid)) {
    const afterNode = nodeByUuid(after, node.uuid)!;
    expect(afterNode.sectionRow).toBe(node.sectionRow);
    expect(afterNode.channelUuid).toBe(node.channelUuid);
  }
}

export function expectColumnInsertOccupiedShiftToGap(
  before: GraphViewPayload,
  after: GraphViewPayload,
  sectionUuid: string,
  referenceUuid: string,
  newNodeUuid: string,
  targetChannelUuid: string,
): void {
  const referenceBefore = nodeByUuid(before, referenceUuid)!;
  const referenceRow = referenceBefore.sectionRow ?? 0;
  const targetRow = referenceRow + 1;
  const firstEmptyRow = firstEmptyRowInChannelAtOrBelow(
    before,
    sectionUuid,
    targetChannelUuid,
    targetRow + 1,
  );
  expect(
    firstEmptyRow,
    `Expected an empty cell below row ${targetRow} in channel ${targetChannelUuid}`,
  ).toBeDefined();

  const newNode = nodeByUuid(after, newNodeUuid)!;
  expect(newNode.sectionUuid).toBe(sectionUuid);
  expect(newNode.channelUuid).toBe(targetChannelUuid);
  expect(newNode.sectionRow).toBe(targetRow);

  for (const node of nodesInSection(before, sectionUuid)) {
    const afterNode = nodeByUuid(after, node.uuid)!;
    if (node.uuid === referenceUuid) {
      expect(afterNode.sectionRow).toBe(referenceRow);
      expect(afterNode.channelUuid).toBe(referenceBefore.channelUuid);
      continue;
    }
    if (
      node.channelUuid === targetChannelUuid &&
      (node.sectionRow ?? 0) >= targetRow &&
      (node.sectionRow ?? 0) < firstEmptyRow!
    ) {
      expect(afterNode.sectionRow).toBe((node.sectionRow ?? 0) + 1);
      expect(afterNode.channelUuid).toBe(node.channelUuid);
    } else {
      expect(afterNode.sectionRow).toBe(node.sectionRow);
      expect(afterNode.channelUuid).toBe(node.channelUuid);
    }
  }
}

export function expectColumnInsertOccupiedChannelInsertsRow(
  before: GraphViewPayload,
  after: GraphViewPayload,
  sectionUuid: string,
  referenceUuid: string,
  newNodeUuid: string,
  targetChannelUuid: string,
): void {
  const referenceBefore = nodeByUuid(before, referenceUuid)!;
  const referenceRow = referenceBefore.sectionRow ?? 0;
  const targetRow = referenceRow + 1;

  const newNode = nodeByUuid(after, newNodeUuid)!;
  expect(newNode.sectionUuid).toBe(sectionUuid);
  expect(newNode.channelUuid).toBe(targetChannelUuid);
  expect(newNode.sectionRow).toBe(targetRow);

  for (const node of nodesInSection(before, sectionUuid)) {
    const afterNode = nodeByUuid(after, node.uuid)!;
    if (node.uuid === referenceUuid) {
      expect(afterNode.sectionRow).toBe(referenceRow);
      expect(afterNode.channelUuid).toBe(referenceBefore.channelUuid);
      continue;
    }
    if (node.channelUuid === targetChannelUuid && (node.sectionRow ?? 0) >= targetRow) {
      expect(afterNode.sectionRow).toBe((node.sectionRow ?? 0) + 1);
      expect(afterNode.channelUuid).toBe(node.channelUuid);
    } else {
      expect(afterNode.sectionRow).toBe(node.sectionRow);
      expect(afterNode.channelUuid).toBe(node.channelUuid);
    }
  }
}
