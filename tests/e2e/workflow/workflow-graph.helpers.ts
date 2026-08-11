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
  sectionUuid: string | null;
  channelUuid: string | null;
  sectionRow: number | null;
  linkedWorkflowUuid: string | null;
  outcomeUuids: string[];
};

export type GraphViewChannel = {
  uuid: string;
  title: string;
  colour: string;
  position: number;
};

export type GraphViewPayload = {
  sections: Array<{ uuid: string; title: string; position: number; threadUuid?: string | null }>;
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
