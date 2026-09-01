import { expect, type Page } from '@playwright/test';
import { authenticatedApiRequest } from '../../helpers/api';
import { hoverWorkflowNode } from './comments-tab.helpers';
import {
  edgeLineTypeIsSolid,
  fetchGraphView,
  findEdgeBetween,
  type GraphViewEdge,
  type GraphViewPayload,
} from './workflow-graph.helpers';
import { workflowNode, workflowNodeHoverDeleteItem } from './workflow-graph.locators';

type NodeInsertResponse = {
  changes: {
    nodes: {
      created: Array<{ uuid: string }>;
    };
  };
};

/** Create edge-isolated disposable nodes without relying on the dense seeded graph topology. */
export async function createIsolatedNodeCopiesViaApi(
  page: Page,
  graphUuid: string,
  sourceNodeUuid: string,
  count: number,
): Promise<string[]> {
  const nodeUuids: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const response = await authenticatedApiRequest(
      page,
      'POST',
      `/api/graph/${graphUuid}/nodes/insert-below`,
      {
        data: {
          nodeUuid: sourceNodeUuid,
          mode: 'row',
          duplicate: true,
        },
      },
    );
    expect(response.ok(), `insert isolated node HTTP ${response.status()}`).toBeTruthy();
    const body = (await response.json()) as NodeInsertResponse;
    const created = body.changes.nodes.created[0];
    if (!created) {
      throw new Error('Insert isolated node returned no created workflowNode');
    }
    nodeUuids.push(created.uuid);
  }

  await page.reload();
  for (const nodeUuid of nodeUuids) {
    await expect(workflowNode(page, nodeUuid)).toHaveCount(1, { timeout: 15_000 });
  }
  return nodeUuids;
}

export async function hoverDeleteWorkflowNode(page: Page, nodeUuid: string): Promise<void> {
  await hoverWorkflowNode(page, nodeUuid);
  await workflowNodeHoverDeleteItem(page, nodeUuid).click();
  await expect(workflowNode(page, nodeUuid)).toHaveCount(0, { timeout: 15_000 });
}

export async function ensureDirectedEdge(
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

export async function customizeEdgeMetadata(
  page: Page,
  edge: GraphViewEdge,
  title: string,
): Promise<void> {
  const response = await authenticatedApiRequest(page, 'PATCH', `/api/edge/${edge.id}`, {
    data: { title, lineType: 'dashed' },
  });
  expect(response.ok(), `customize edge HTTP ${response.status()}`).toBeTruthy();
}

export function expectNoEdgesIncidentOnNode(graph: GraphViewPayload, nodeUuid: string): void {
  expect(
    graph.edges.some(
      (edge) => edge.sourceNodeUuid === nodeUuid || edge.targetNodeUuid === nodeUuid,
    ),
    `Expected no workflowEdges incident on deleted node ${nodeUuid}`,
  ).toBe(false);
}

export function expectBypassEdgeBetween(
  graph: GraphViewPayload,
  sourceUuid: string,
  targetUuid: string,
): GraphViewEdge {
  const bypass = findEdgeBetween(graph, sourceUuid, targetUuid);
  expect(bypass, `Expected bypass workflowEdge from ${sourceUuid} to ${targetUuid}`).toBeTruthy();
  expect(bypass!.title, 'Bypass workflowEdge must have empty title').toBe('');
  expect(
    edgeLineTypeIsSolid(bypass!.lineType),
    `Bypass workflowEdge must be solid; got lineType=${JSON.stringify(bypass!.lineType)}`,
  ).toBe(true);
  return bypass!;
}

export function expectNoEdgeBetween(
  graph: GraphViewPayload,
  sourceUuid: string,
  targetUuid: string,
): void {
  expect(findEdgeBetween(graph, sourceUuid, targetUuid)).toBeUndefined();
}

export function edgesAmongNodes(graph: GraphViewPayload, nodeUuids: string[]): GraphViewEdge[] {
  const ids = new Set(nodeUuids);
  return graph.edges.filter(
    (edge) => ids.has(edge.sourceNodeUuid) && ids.has(edge.targetNodeUuid),
  );
}
