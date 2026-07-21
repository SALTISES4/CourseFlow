import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { workflowSectionRow } from '../../shared/locators/workflow';
import { sectionNodes } from './edit-section.locators';
import { workflowAddTabInsertModeRowButton, workflowAddTabNodeCategoryItem } from './workflow-add-tab.locators';
import { workflowRightSidebarAddTab } from '../../shared/locators/workflow';
import { workflowChannelHeaders, workflowNode, workflowNodes } from './workflow-graph.locators';

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

/** Drag a node category from Add tab onto an existing workflowNode (Column/Manual insert modes). */
export async function dragNodeCategoryOntoNode(
  page: Page,
  categoryLabel: string,
  nodeUuid: string,
  edge: 'top' | 'bottom' = 'bottom',
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

  await source.dragTo(targetRow, {
    force: true,
    targetPosition: {
      x: targetNodeBox.x - targetRowBox.x + targetNodeBox.width / 2,
      y:
        targetNodeBox.y -
        targetRowBox.y +
        (edge === 'top' ? targetNodeBox.height / 4 : (targetNodeBox.height * 3) / 4),
    },
  });
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
