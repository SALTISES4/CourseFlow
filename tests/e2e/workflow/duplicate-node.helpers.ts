import { expect, type Page } from '@playwright/test';
import { hoverWorkflowNode } from './comments-tab.helpers';
import {
  edgesIncidentOnNode,
  expectColumnInsertEmptyCellBelow,
  expectColumnInsertOccupiedChannelInsertsRow,
  expectColumnInsertOccupiedShiftToGap,
  expectRowInsertBelowReferenceNode,
  fetchGraphView,
  findEdgeBetween,
  findNewNodeUuid,
  findSourceInChannelForColumnInsertBelow,
  graphEdgesSnapshot,
  incomingEdges,
  nodeByUuid,
  nodesInSection,
  outgoingEdges,
  type GraphViewNode,
  type GraphViewPayload,
} from './workflow-graph.helpers';

export {
  findNewNodeUuid,
  findReferenceNodeForColumnInsertBelow,
  findSourceInChannelForColumnInsertBelow,
  findSourceWithNodesBelowInSection,
} from './workflow-graph.helpers';
import {
  workflowEditNodeForm,
  workflowEditNodeFormDuplicateButton,
  workflowNodeHoverDuplicateItem,
  workflowNodeTitle,
} from './workflow-graph.locators';
import {
  workflowManualPlacementDialog,
  workflowManualPlacementDialogColumnButton,
  workflowManualPlacementDialogRowButton,
} from './workflow-add-tab.locators';

export type ManualDuplicatePlacement = 'row' | 'column';

export async function hoverDuplicateWorkflowNode(page: Page, sourceUuid: string): Promise<void> {
  await hoverWorkflowNode(page, sourceUuid);
  await workflowNodeHoverDuplicateItem(page, sourceUuid).click();
}

export async function openNodeEditForm(page: Page, nodeUuid: string): Promise<void> {
  await workflowNodeTitle(page, nodeUuid).click();
  await expect(workflowEditNodeForm(page)).toBeVisible();
}

export async function clickSidebarDuplicateButton(page: Page, sourceUuid: string): Promise<void> {
  await openNodeEditForm(page, sourceUuid);
  await workflowEditNodeFormDuplicateButton(page).click();
}

export async function duplicateViaSidebarAndWait(
  page: Page,
  workflowUuid: string,
  sourceUuid: string,
  beforeGraph: GraphViewPayload,
): Promise<{ after: GraphViewPayload; duplicateUuid: string }> {
  await clickSidebarDuplicateButton(page, sourceUuid);
  return waitForDuplicateNode(page, workflowUuid, beforeGraph);
}

async function waitForDuplicateNode(
  page: Page,
  workflowUuid: string,
  beforeGraph: GraphViewPayload,
): Promise<{ after: GraphViewPayload; duplicateUuid: string }> {
  let after!: GraphViewPayload;
  let duplicateUuid!: string;
  await expect
    .poll(async () => {
      after = await fetchGraphView(page, workflowUuid);
      try {
        duplicateUuid = findNewNodeUuid(beforeGraph, after);
        return true;
      } catch {
        return false;
      }
    }, { timeout: 15_000 })
    .toBe(true);

  return { after, duplicateUuid };
}

export async function duplicateViaHoverAndWait(
  page: Page,
  workflowUuid: string,
  sourceUuid: string,
  beforeGraph: GraphViewPayload,
): Promise<{ after: GraphViewPayload; duplicateUuid: string }> {
  await hoverDuplicateWorkflowNode(page, sourceUuid);
  return waitForDuplicateNode(page, workflowUuid, beforeGraph);
}

export async function duplicateViaManualAndWait(
  page: Page,
  workflowUuid: string,
  sourceUuid: string,
  beforeGraph: GraphViewPayload,
  placement: ManualDuplicatePlacement,
): Promise<{ after: GraphViewPayload; duplicateUuid: string }> {
  await hoverWorkflowNode(page, sourceUuid);
  await workflowNodeHoverDuplicateItem(page, sourceUuid).click();
  await expect(workflowManualPlacementDialog(page)).toBeVisible();

  if (placement === 'row') {
    await workflowManualPlacementDialogRowButton(page).click();
  } else {
    await workflowManualPlacementDialogColumnButton(page).click();
  }

  return waitForDuplicateNode(page, workflowUuid, beforeGraph);
}

/** Source whose cell directly below in the same workflowChannel is empty. */
export function findSourceWithEmptyCellBelowInSameChannel(
  graph: GraphViewPayload,
  sectionUuid: string,
): GraphViewNode | undefined {
  const channelUuids = [
    ...new Set(
      nodesInSection(graph, sectionUuid)
        .map((node) => node.channelUuid)
        .filter((channelUuid): channelUuid is string => Boolean(channelUuid)),
    ),
  ];

  for (const channelUuid of channelUuids) {
    const source = findSourceInChannelForColumnInsertBelow(
      graph,
      sectionUuid,
      channelUuid,
      'empty-below',
    );
    if (source) {
      return source;
    }
  }

  return undefined;
}

/** Source with occupant below and an empty cell below that occupant in the same channel. */
export function findSourceWithOccupiedCellBelowAndGapInChannel(
  graph: GraphViewPayload,
  sectionUuid: string,
): GraphViewNode | undefined {
  const channelUuids = [
    ...new Set(
      nodesInSection(graph, sectionUuid)
        .map((node) => node.channelUuid)
        .filter((channelUuid): channelUuid is string => Boolean(channelUuid)),
    ),
  ];

  for (const channelUuid of channelUuids) {
    const source = findSourceInChannelForColumnInsertBelow(
      graph,
      sectionUuid,
      channelUuid,
      'occupied-gap',
    );
    if (source) {
      return source;
    }
  }

  return undefined;
}

/**
 * Source with occupant directly below in the same channel and no empty cell below the
 * source in that channel (Column insert — new row in channel only).
 */
export function findSourceWithOccupiedCellBelowAndNoGapInChannel(
  graph: GraphViewPayload,
  sectionUuid: string,
): GraphViewNode | undefined {
  const channelUuids = [
    ...new Set(
      nodesInSection(graph, sectionUuid)
        .map((node) => node.channelUuid)
        .filter((channelUuid): channelUuid is string => Boolean(channelUuid)),
    ),
  ];

  for (const channelUuid of channelUuids) {
    const source = findSourceInChannelForColumnInsertBelow(
      graph,
      sectionUuid,
      channelUuid,
      'occupied-no-gap',
    );
    if (source) {
      return source;
    }
  }

  return undefined;
}

export function findNodeWithIncidentEdges(graph: GraphViewPayload): GraphViewNode | undefined {
  return graph.nodes.find(
    (node) =>
      incomingEdges(graph, node.uuid).length > 0 || outgoingEdges(graph, node.uuid).length > 0,
  );
}

export function expectRowDuplicatePlacement(
  before: GraphViewPayload,
  after: GraphViewPayload,
  sectionUuid: string,
  sourceUuid: string,
  duplicateUuid: string,
): void {
  const sourceBefore = nodeByUuid(before, sourceUuid);
  expect(sourceBefore, `Source node ${sourceUuid} missing from before graph`).toBeTruthy();
  expectRowInsertBelowReferenceNode(
    before,
    after,
    sectionUuid,
    sourceUuid,
    duplicateUuid,
    sourceBefore!.channelUuid!,
  );
}

export function expectColumnDuplicateEmptyCellPlacement(
  before: GraphViewPayload,
  after: GraphViewPayload,
  sectionUuid: string,
  sourceUuid: string,
  duplicateUuid: string,
): void {
  const sourceBefore = nodeByUuid(before, sourceUuid)!;
  expectColumnInsertEmptyCellBelow(
    before,
    after,
    sectionUuid,
    sourceUuid,
    duplicateUuid,
    sourceBefore.channelUuid!,
  );
}

export function expectColumnDuplicateOccupiedShiftToGap(
  before: GraphViewPayload,
  after: GraphViewPayload,
  sectionUuid: string,
  sourceUuid: string,
  duplicateUuid: string,
): void {
  const sourceBefore = nodeByUuid(before, sourceUuid)!;
  expectColumnInsertOccupiedShiftToGap(
    before,
    after,
    sectionUuid,
    sourceUuid,
    duplicateUuid,
    sourceBefore.channelUuid!,
  );
}

export function expectColumnDuplicateOccupiedChannelInsertsRow(
  before: GraphViewPayload,
  after: GraphViewPayload,
  sectionUuid: string,
  sourceUuid: string,
  duplicateUuid: string,
): void {
  const sourceBefore = nodeByUuid(before, sourceUuid)!;
  expectColumnInsertOccupiedChannelInsertsRow(
    before,
    after,
    sectionUuid,
    sourceUuid,
    duplicateUuid,
    sourceBefore.channelUuid!,
  );
}

export function expectDuplicateEdgeIntegrity(
  before: GraphViewPayload,
  after: GraphViewPayload,
  sourceUuid: string,
  duplicateUuid: string,
): void {
  expect(edgesIncidentOnNode(after, duplicateUuid)).toHaveLength(0);
  expect(incomingEdges(after, sourceUuid).length).toBe(incomingEdges(before, sourceUuid).length);
  expect(outgoingEdges(after, sourceUuid).length).toBe(outgoingEdges(before, sourceUuid).length);
  expect(graphEdgesSnapshot(after)).toEqual(graphEdgesSnapshot(before));
  expect(findEdgeBetween(after, sourceUuid, duplicateUuid)).toBeUndefined();
}
