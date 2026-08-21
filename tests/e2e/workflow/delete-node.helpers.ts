import { expect, type Page } from '@playwright/test';
import { hoverWorkflowNode } from './comments-tab.helpers';
import { clickWorkflowEdge, dragWorkflowEdgeFromHandleToHandle } from './edge.helpers';
import {
  workflowEditEdgeFormDashedLineToggle,
  workflowEditEdgeFormTitleField,
} from './edge.locators';
import {
  edgeIdString,
  edgeLineTypeIsSolid,
  fetchGraphView,
  findEdgeBetween,
  type GraphViewEdge,
  type GraphViewPayload,
} from './workflow-graph.helpers';
import { workflowNode, workflowNodeHoverDeleteItem } from './workflow-graph.locators';

export async function hoverDeleteWorkflowNode(page: Page, nodeUuid: string): Promise<void> {
  await hoverWorkflowNode(page, nodeUuid);
  await workflowNodeHoverDeleteItem(page, nodeUuid).click();
  await expect(workflowNode(page, nodeUuid)).toHaveCount(0, { timeout: 15_000 });
}

export async function ensureDirectedEdge(
  page: Page,
  workflowUuid: string,
  sourceUuid: string,
  targetUuid: string,
): Promise<GraphViewEdge> {
  const existing = findEdgeBetween(await fetchGraphView(page, workflowUuid), sourceUuid, targetUuid);
  if (existing) {
    return existing;
  }

  await dragWorkflowEdgeFromHandleToHandle(page, sourceUuid, targetUuid);

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
  await clickWorkflowEdge(page, edgeIdString(edge));
  await workflowEditEdgeFormTitleField(page).fill(title);
  await workflowEditEdgeFormDashedLineToggle(page).check();
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
