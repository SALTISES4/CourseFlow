import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { workflowSectionContainer } from '../../shared/locators/workflow';
import { sectionNodes } from './edit-section.locators';
import { workflowAddTabInsertModeRowButton, workflowAddTabNodeCategoryItem } from './workflow-add-tab.locators';
import { workflowRightSidebarAddTab } from '../../shared/locators/workflow';
import { workflowChannelHeaders, workflowNode, workflowNodeContent, workflowNodes } from './workflow-graph.locators';

/** Drag a node category from Add tab onto a section container (Row insert mode). */
export async function dragNodeCategoryOntoSection(
  page: Page,
  categoryLabel: string,
  sectionUuid: string,
): Promise<void> {
  const source = workflowAddTabNodeCategoryItem(page, categoryLabel);
  const target = workflowSectionContainer(page, sectionUuid);

  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  try {
    await source.dragTo(target, { force: true, targetPosition: { x: 20, y: 20 } });
    return;
  } catch {
    // Fall back to manual pointer path for pragmatic-drag-and-drop.
  }

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error('Drag source or drop target not visible.');
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 20,
  });
  await page.mouse.up();
}

/** Drag a node category from Add tab onto an existing workflowNode (Column/Manual insert modes). */
export async function dragNodeCategoryOntoNode(
  page: Page,
  categoryLabel: string,
  nodeUuid: string,
): Promise<void> {
  const source = workflowAddTabNodeCategoryItem(page, categoryLabel);
  const target = workflowNodeContent(page, nodeUuid);

  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  try {
    await source.dragTo(target, { force: true, targetPosition: { x: 10, y: 10 } });
    return;
  } catch {
    // Fall back to manual pointer path for pragmatic-drag-and-drop.
  }

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error('Drag source or drop target not visible.');
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 4, {
    steps: 20,
  });
  await page.mouse.up();
}

export async function workflowNodeCount(page: Page): Promise<number> {
  return workflowNodes(page).count();
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
  return page.getByText(/^\d+\.\s+E2E Outcome/).count();
}
