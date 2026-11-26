import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { workflowSectionRow } from '../../shared/locators/workflow';
import { sectionNodes } from './edit-section.locators';
import {
  fetchGraphView,
  findNewChannelUuid,
  findNewNodeUuid,
  nodeByUuid,
  orderedGraphChannels,
  type GraphViewPayload,
} from './workflow-graph.helpers';
import {
  workflowAddTabInsertModeColumnButton,
  workflowAddTabInsertModeManualButton,
  workflowAddTabInsertModeRowButton,
  workflowAddTabCustomNodeCategoryItem,
  workflowAddTabNodeCategoryItem,
  workflowAddTabNodeCategoryItemByChannelUuid,
  workflowAddTabNodeCategoryItems,
} from './workflow-add-tab.locators';
import { workflowRightSidebarAddTab } from '../../shared/locators/workflow';
import {
  workflowChannelHeader,
  workflowChannelHeaders,
  workflowEditChannelForm,
  workflowEditChannelFormColorField,
  workflowEditChannelFormTitleField,
  workflowNode,
  workflowNodes,
} from './workflow-graph.locators';
import {
  expectWorkflowAddTabNodeCategoryItemColour,
  expectWorkflowChannelHeaderColour,
  INSERT_CHANNEL_DEFAULT_COLOUR,
  INSERT_CHANNEL_DEFAULT_TITLE,
} from './workflow-channel-color.helpers';

export type AddTabRowCellPreDropVisuals = {
  filledHoverCount: number;
  insertionLineCount: number;
};

/** Start an Add-tab category drag over a specific row cell without releasing. */
export async function beginNodeCategoryDragOverRowCell(
  page: Page,
  categoryLabel: string,
  sectionUuid: string,
  rowIndex: number,
  columnIndex: number,
  edge: 'top' | 'bottom' = 'bottom',
): Promise<void> {
  const source = workflowAddTabNodeCategoryItem(page, categoryLabel);
  const row = workflowSectionRow(page, sectionUuid, rowIndex);
  const cell = row.locator(':scope > div').nth(columnIndex);

  await source.scrollIntoViewIfNeeded();
  await cell.scrollIntoViewIfNeeded();

  const sourceBox = await source.boundingBox();
  const cellBox = await cell.boundingBox();
  if (!sourceBox || !cellBox) {
    throw new Error('Add-tab drag source or target row cell not visible.');
  }

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const targetX = cellBox.x + cellBox.width / 2;
  const targetY = cellBox.y + cellBox.height * (edge === 'top' ? 0.25 : 0.75);

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 12, startY, { steps: 4 });
  await page.mouse.move(targetX, targetY, { steps: 20 });
}

/** Read the rendered Row-mode line and the prohibited filled cell-hover visual. */
export async function addTabRowCellPreDropVisuals(
  cell: Locator,
): Promise<AddTabRowCellPreDropVisuals> {
  return cell.evaluate((root) => {
    const elements = [root, ...root.querySelectorAll<HTMLElement>('*')];
    let filledHoverCount = 0;
    let insertionLineCount = 0;

    for (const element of elements) {
      const style = getComputedStyle(element);
      const before = getComputedStyle(element, '::before');
      const rect = element.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
      if (!visible) {
        continue;
      }

      if (
        style.position === 'absolute' &&
        before.content !== 'none' &&
        before.content !== 'normal' &&
        Number.parseFloat(before.height) === 6 &&
        before.backgroundColor !== 'rgba(0, 0, 0, 0)'
      ) {
        insertionLineCount += 1;
      }

      if (
        style.position === 'absolute' &&
        style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        Math.abs(rect.width - root.getBoundingClientRect().width) < 1 &&
        Math.abs(rect.height - root.getBoundingClientRect().height) < 1
      ) {
        filledHoverCount += 1;
      }
    }

    return { filledHoverCount, insertionLineCount };
  });
}

/** Drag a node category from Add tab onto a registered section row drop target. */
export async function dragNodeCategoryOntoSection(
  page: Page,
  categoryLabel: string,
  sectionUuid: string,
  rowIndex: number | 'empty' = 0,
  edge: 'top' | 'bottom' = 'bottom',
): Promise<void> {
  const source = workflowAddTabNodeCategoryItem(page, categoryLabel);
  const target = workflowSectionRow(page, sectionUuid, rowIndex);

  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error('Drag source or drop target not visible.');
  }

  await source.dragTo(target, {
    force: true,
    targetPosition: {
      x: targetBox.width / 2,
      y: edge === 'top' ? targetBox.height / 4 : (targetBox.height * 3) / 4,
    },
  });
}

/** Drag a channel-backed Add-tab category directly over an empty grid cell. */
export async function dragNodeCategoryOntoEmptyCell(
  page: Page,
  categoryLabel: string,
  sectionUuid: string,
  rowIndex: number,
  columnIndex: number,
  edge: 'top' | 'bottom' = 'bottom',
): Promise<void> {
  const source = workflowAddTabNodeCategoryItem(page, categoryLabel);
  const targetRow = workflowSectionRow(page, sectionUuid, rowIndex);
  const targetCell = targetRow.locator('> div').nth(columnIndex);

  await source.scrollIntoViewIfNeeded();
  await targetCell.scrollIntoViewIfNeeded();

  const sourceBox = await source.boundingBox();
  const targetRowBox = await targetRow.boundingBox();
  const targetCellBox = await targetCell.boundingBox();
  if (!sourceBox || !targetRowBox || !targetCellBox) {
    throw new Error('Drag source or empty cell target not visible.');
  }

  await source.dragTo(targetRow, {
    force: true,
    targetPosition: {
      x: targetCellBox.x - targetRowBox.x + targetCellBox.width / 2,
      y:
        targetCellBox.y -
        targetRowBox.y +
        targetCellBox.height * (edge === 'top' ? 0.25 : 0.75),
    },
  });
}

/** Drag workflowAddTabCustomNodeCategoryItem onto a workflowSectionRow drop target. */
export async function dragCustomNodeCategoryOntoSection(
  page: Page,
  sectionUuid: string,
  rowIndex: number | 'empty' = 0,
  edge: 'top' | 'bottom' = 'bottom',
): Promise<void> {
  const source = workflowAddTabCustomNodeCategoryItem(page);
  const target = workflowSectionRow(page, sectionUuid, rowIndex);

  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error('Drag source or drop target not visible.');
  }

  await source.dragTo(target, {
    force: true,
    targetPosition: {
      x: targetBox.width / 2,
      y: edge === 'top' ? targetBox.height / 4 : (targetBox.height * 3) / 4,
    },
  });
}

/** Custom-category drop; wait for new workflowNode and workflowChannel. */
export async function addTabCustomCategoryRowDropAndWait(
  page: Page,
  sectionUuid: string,
  workflowUuid: string,
  beforeGraph: GraphViewPayload,
  rowIndex: number | 'empty' = 0,
  edge: 'top' | 'bottom' = 'bottom',
): Promise<{ after: GraphViewPayload; newNodeUuid: string; newChannelUuid: string }> {
  await dragCustomNodeCategoryOntoSection(page, sectionUuid, rowIndex, edge);

  let after!: GraphViewPayload;
  let newNodeUuid!: string;
  let newChannelUuid!: string;
  await expect
    .poll(async () => {
      after = await fetchGraphView(page, workflowUuid);
      try {
        newNodeUuid = findNewNodeUuid(beforeGraph, after);
        newChannelUuid = findNewChannelUuid(beforeGraph, after);
        return true;
      } catch {
        return false;
      }
    }, { timeout: 15_000 })
    .toBe(true);

  return { after, newNodeUuid, newChannelUuid };
}

export function expectCustomCategoryDropResult(
  before: GraphViewPayload,
  after: GraphViewPayload,
  sectionUuid: string,
  newNodeUuid: string,
  newChannelUuid: string,
): void {
  const orderedAfter = orderedGraphChannels(after);
  expect(orderedAfter.at(-1)?.uuid).toBe(newChannelUuid);

  const newNode = nodeByUuid(after, newNodeUuid);
  expect(newNode?.sectionUuid).toBe(sectionUuid);
  expect(newNode?.channelUuid).toBe(newChannelUuid);

  expect(after.channels.length).toBe(before.channels.length + 1);
}

/** FR-CHAN-004 parity — default title and colour on a channel created via custom-category drop. */
export async function expectCustomCategoryDropDefaults(
  page: Page,
  after: GraphViewPayload,
  newChannelUuid: string,
): Promise<void> {
  const newChannel = orderedGraphChannels(after).find((channel) => channel.uuid === newChannelUuid);
  expect(newChannel?.title).toBe('');
  expect(newChannel?.systemLabelCode).toBe('custom_node_category');
  expect(newChannel?.colour).toBe(INSERT_CHANNEL_DEFAULT_COLOUR);

  await expect(workflowChannelHeader(page, newChannelUuid)).toContainText(
    INSERT_CHANNEL_DEFAULT_TITLE,
  );
  await expectWorkflowChannelHeaderColour(page, newChannelUuid, INSERT_CHANNEL_DEFAULT_COLOUR);

  await workflowChannelHeader(page, newChannelUuid).click();
  await expect(workflowEditChannelForm(page)).toBeVisible();
  await expect(workflowEditChannelFormTitleField(page)).toHaveValue('');
  await expect(workflowEditChannelFormColorField(page)).toHaveValue(INSERT_CHANNEL_DEFAULT_COLOUR);

  await workflowRightSidebarAddTab(page).click();
  const newCategoryRow = workflowAddTabNodeCategoryItemByChannelUuid(page, newChannelUuid);
  await expect(newCategoryRow).toBeVisible();
  await expect(newCategoryRow).toContainText(INSERT_CHANNEL_DEFAULT_TITLE);
  await expectWorkflowAddTabNodeCategoryItemColour(
    page,
    newCategoryRow,
    INSERT_CHANNEL_DEFAULT_COLOUR,
  );
}

/** Drag a node category from Add tab onto an existing workflowNode (Column/Manual insert modes). */
export async function dragNodeCategoryOntoNode(
  page: Page,
  categoryLabel: string,
  nodeUuid: string,
  edge: 'top' | 'bottom' = 'bottom',
  verticalFraction?: number,
): Promise<void> {
  const source = workflowAddTabNodeCategoryItem(page, categoryLabel);
  const targetNode = workflowNode(page, nodeUuid);
  const targetRow = targetNode.locator(
    'xpath=ancestor::*[@data-test-id="workflow-section-row"]',
  );

  await source.scrollIntoViewIfNeeded();
  await targetNode.scrollIntoViewIfNeeded();

  const sourceBox = await source.boundingBox();
  const targetNodeBox = await targetNode.boundingBox();
  const targetRowBox = await targetRow.boundingBox();
  if (!sourceBox || !targetNodeBox || !targetRowBox) {
    throw new Error('Drag source or drop target not visible.');
  }

  const fraction = verticalFraction ?? (edge === 'top' ? 0.25 : 0.75);

  await source.dragTo(targetRow, {
    force: true,
    targetPosition: {
      x: targetNodeBox.x - targetRowBox.x + targetNodeBox.width / 2,
      y:
        targetNodeBox.y -
        targetRowBox.y +
        targetNodeBox.height * fraction,
    },
  });
}

/** Row-mode Add-tab drop inserting a row below a reference node; wait for new node. */
export async function addTabRowDropBelowReferenceNodeAndWait(
  page: Page,
  categoryLabel: string,
  sectionUuid: string,
  referenceNodeUuid: string,
  workflowUuid: string,
  beforeGraph: GraphViewPayload,
): Promise<{ after: GraphViewPayload; newNodeUuid: string }> {
  const reference = nodeByUuid(beforeGraph, referenceNodeUuid);
  if (reference?.sectionRow == null) {
    throw new Error(`Reference workflowNode ${referenceNodeUuid} has no sectionRow.`);
  }

  const referenceRow = reference.sectionRow;
  const hasRowBelow = beforeGraph.nodes.some(
    (node) =>
      node.sectionUuid === sectionUuid && (node.sectionRow ?? 0) > referenceRow,
  );

  if (hasRowBelow) {
    // Upper half of the next workflowSectionRow inserts between reference row and the row below.
    await dragNodeCategoryOntoSection(
      page,
      categoryLabel,
      sectionUuid,
      referenceRow + 1,
      'top',
    );
  } else {
    await dragNodeCategoryOntoSection(
      page,
      categoryLabel,
      sectionUuid,
      referenceRow,
      'bottom',
    );
  }

  let after!: GraphViewPayload;
  let newNodeUuid!: string;
  await expect
    .poll(async () => {
      after = await fetchGraphView(page, workflowUuid);
      try {
        newNodeUuid = findNewNodeUuid(beforeGraph, after);
        return true;
      } catch {
        return false;
      }
    }, { timeout: 15_000 })
    .toBe(true);

  return { after, newNodeUuid };
}

/** Column-mode Add-tab drop on lower half of reference node; wait for new node. */
export async function addTabColumnDropBelowReferenceNodeAndWait(
  page: Page,
  categoryLabel: string,
  referenceNodeUuid: string,
  workflowUuid: string,
  beforeGraph: GraphViewPayload,
): Promise<{ after: GraphViewPayload; newNodeUuid: string }> {
  // Lower-half band — stay inside the node cell, not the next workflowSectionRow band.
  await dragNodeCategoryOntoNode(page, categoryLabel, referenceNodeUuid, 'bottom', 0.55);

  let after!: GraphViewPayload;
  let newNodeUuid!: string;
  await expect
    .poll(async () => {
      after = await fetchGraphView(page, workflowUuid);
      try {
        newNodeUuid = findNewNodeUuid(beforeGraph, after);
        return true;
      } catch {
        return false;
      }
    }, { timeout: 15_000 })
    .toBe(true);

  return { after, newNodeUuid };
}

export async function workflowNodeCount(page: Page): Promise<number> {
  return workflowNodes(page).count();
}

export async function workflowNodeUuids(page: Page): Promise<string[]> {
  return workflowNodes(page).evaluateAll((nodes) =>
    nodes
      .map((node) => node.id)
      .filter((id) => id.startsWith('node-'))
      .map((id) => id.slice('node-'.length)),
  );
}

export async function lastNodeUuidInSection(page: Page, sectionUuid: string): Promise<string> {
  const node = sectionNodes(page, sectionUuid).last();
  await expect(node).toBeVisible({ timeout: 15_000 });
  const id = await node.getAttribute('id');
  if (!id?.startsWith('node-')) {
    throw new Error(`Expected node id prefix node-; got ${JSON.stringify(id)}`);
  }
  return id.slice('node-'.length);
}

export async function firstNodeUuidInSection(page: Page, sectionUuid: string): Promise<string> {
  const node = sectionNodes(page, sectionUuid).first();
  await expect(node).toBeVisible({ timeout: 15_000 });
  const id = await node.getAttribute('id');
  if (!id?.startsWith('node-')) {
    throw new Error(`Expected node id prefix node-; got ${JSON.stringify(id)}`);
  }
  return id.slice('node-'.length);
}

export async function workflowChannelCount(page: Page): Promise<number> {
  return workflowChannelHeaders(page).count();
}

export async function setRowInsertMode(page: Page) {
  await workflowRightSidebarAddTab(page).click();
  await workflowAddTabInsertModeRowButton(page).click();
}

export async function setColumnInsertMode(page: Page) {
  await workflowRightSidebarAddTab(page).click();
  await workflowAddTabInsertModeColumnButton(page).click();
}

export async function setManualInsertMode(page: Page) {
  await workflowRightSidebarAddTab(page).click();
  await workflowAddTabInsertModeManualButton(page).click();
}

export async function assertNodeIsBelowSourceInSameColumn(
  page: Page,
  sourceUuid: string,
  targetUuid: string,
) {
  const sourceBox = await workflowNode(page, sourceUuid).boundingBox();
  const targetBox = await workflowNode(page, targetUuid).boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error('Expected source and target workflowNode bounding boxes to be visible.');
  }
  expect(Math.abs(sourceBox.x - targetBox.x)).toBeLessThan(24);
  expect(targetBox.y).toBeGreaterThan(sourceBox.y);
}

export async function findNodeBelowSourceInSection(
  page: Page,
  sectionUuid: string,
  sourceUuid: string,
): Promise<string> {
  const sourceBox = await workflowNode(page, sourceUuid).boundingBox();
  if (!sourceBox) {
    throw new Error(`Source workflowNode ${sourceUuid} is not visible.`);
  }

  const nodes = sectionNodes(page, sectionUuid);
  const count = await nodes.count();
  for (let i = 0; i < count; i++) {
    const node = nodes.nth(i);
    const id = await node.getAttribute('id');
    if (!id?.startsWith('node-')) {
      continue;
    }
    const nodeUuid = id.slice('node-'.length);
    if (nodeUuid === sourceUuid) {
      continue;
    }
    const box = await node.boundingBox();
    if (!box) {
      continue;
    }
    if (Math.abs(box.x - sourceBox.x) < 24 && box.y > sourceBox.y) {
      return nodeUuid;
    }
  }

  throw new Error(`No workflowNode below source ${sourceUuid} in section ${sectionUuid}.`);
}

export async function workflowOutcomeHeaderCount(page: Page): Promise<number> {
  return page.getByRole('listitem').filter({ hasText: /^\d+(\.\d+)*\.\s/ }).count();
}
