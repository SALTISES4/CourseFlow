import type { Page } from '@playwright/test';
import { workflowSectionContainer } from '../../shared/locators/workflow';
import { workflowAddTabNodeCategoryItem } from './workflow-add-tab.locators';
import { workflowNodes } from './workflow-graph.locators';

/** Drag a node category from Add tab onto a section container (Row insert mode). */
export async function dragNodeCategoryOntoSection(
  page: Page,
  categoryLabel: string,
  sectionUuid: string,
): Promise<void> {
  const source = workflowAddTabNodeCategoryItem(page, categoryLabel);
  const target = workflowSectionContainer(page, sectionUuid);
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error('Drag source or drop target not visible.');
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
}

export async function workflowNodeCount(page: Page): Promise<number> {
  return workflowNodes(page).count();
}
