import { expect, type Page } from '@playwright/test';
import { workflowOutcomesPath } from '../../helpers/workflow-navigation';
import {
  workflowRightSidebarOutcomesTab,
  workflowRightSidebarOutcomesTabContent,
} from '../../shared/locators/workflow';
import { workflowNode } from './workflow-graph.locators';
import {
  workflowNodeLinkedOutcomeRow,
  workflowNodeLinkedOutcomeRowUnlinkOutcomeMenuItem,
  workflowNodeLinkedOutcomesBadge,
  workflowNodeLinkedOutcomesPopover,
  workflowOutcomesAssignTabOutcomeRow,
} from './workflow-assign-outcome.locators';

export const E2E_SEED_OUTCOME_HEADER = /^1\.\s+E2E Outcome 1$/;

export async function openWorkflowOutcomesTab(page: Page): Promise<void> {
  await workflowRightSidebarOutcomesTab(page).click();
  await expect(workflowRightSidebarOutcomesTab(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(workflowRightSidebarOutcomesTabContent(page)).toBeVisible();
}

type DragAssignTabOutcomeOptions = {
  /** When false, leaves the pointer held down after moving over the target node. */
  release?: boolean;
};

export async function dragAssignTabOutcomeOverNode(
  page: Page,
  rowTitle: string | RegExp,
  targetNodeUuid: string,
  options: DragAssignTabOutcomeOptions = {},
): Promise<void> {
  const { release = true } = options;
  const row = workflowOutcomesAssignTabOutcomeRow(page, rowTitle);
  const target = workflowNode(page, targetNodeUuid);

  await row.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const rowBox = await row.boundingBox();
  const targetBox = await target.boundingBox();
  if (!rowBox || !targetBox) {
    throw new Error('Assign-tab outcome row or target workflowNode not visible.');
  }

  await page.mouse.move(rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 25 },
  );
  if (release) {
    await page.mouse.up();
  }
}

export async function dragAssignTabOutcomeOntoNode(
  page: Page,
  rowTitle: string | RegExp,
  targetNodeUuid: string,
): Promise<void> {
  await dragAssignTabOutcomeOverNode(page, rowTitle, targetNodeUuid, { release: true });
}

export async function clickAssignTabOutcomeRow(page: Page, rowTitle: string | RegExp): Promise<void> {
  await workflowOutcomesAssignTabOutcomeRow(page, rowTitle).click();
}

export async function openLinkedOutcomesPopover(
  page: Page,
  nodeUuid: string,
  badgeCount = 1,
): Promise<void> {
  const badge = workflowNodeLinkedOutcomesBadge(page, nodeUuid, badgeCount);
  await expect(badge).toBeVisible({ timeout: 10_000 });
  await badge.click({ force: true });
  await expect(workflowNodeLinkedOutcomesPopover(page)).toBeVisible({ timeout: 5_000 });
}

export async function workflowNodeHasOutcomeHighlightBorder(
  page: Page,
  nodeUuid: string,
): Promise<boolean> {
  return workflowNode(page, nodeUuid).evaluate((el) => {
    const shadow = getComputedStyle(el).boxShadow;
    return shadow !== 'none' && shadow !== '';
  });
}

/** FR-WF-AO-004 drop-target presentation — green overlay via ::before on CellInner. */
export async function workflowNodeHasOutcomeDropTargetBorder(
  page: Page,
  nodeUuid: string,
): Promise<boolean> {
  return workflowNode(page, nodeUuid).evaluate((el) => {
    const before = getComputedStyle(el, '::before');
    return before.content !== 'none' && before.content !== 'normal' && before.width !== '0px';
  });
}

export async function countWorkflowNodesWithOutcomeDropTargetBorder(page: Page): Promise<number> {
  return page.locator('[data-test-id="workflow-node"]').evaluateAll((nodes) =>
    nodes.filter((el) => {
      const before = getComputedStyle(el, '::before');
      return before.content !== 'none' && before.content !== 'normal' && before.width !== '0px';
    }).length,
  );
}

export async function unlinkLinkedOutcomeFromPopover(
  page: Page,
  outcomeTitle: string | RegExp,
): Promise<void> {
  const row = workflowNodeLinkedOutcomeRow(page, outcomeTitle);
  await row.hover();
  await workflowNodeLinkedOutcomeRowUnlinkOutcomeMenuItem(page).click();
}

export async function assignTabOutcomeRowHasHighlightBorder(
  page: Page,
  rowTitle: string | RegExp,
): Promise<boolean> {
  const row = workflowOutcomesAssignTabOutcomeRow(page, rowTitle);
  return row.evaluate((el) => {
    let current: HTMLElement | null = el as HTMLElement;
    while (current) {
      const shadow = getComputedStyle(current).boxShadow;
      if (shadow !== 'none' && shadow.includes('2px')) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  });
}

export async function expectNavigatedToOutcomesView(page: Page, workflowPath: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`${workflowOutcomesPath(workflowPath)}/?$`));
}
