import type { Locator, Page } from '@playwright/test';
import {
  workflowRightSidebarContentPanel,
  workflowRightSidebarOutcomesTabContent,
} from '../../shared/locators/workflow';
import { workflowNode } from './workflow-graph.locators';

/** Sidebar panel while workflowRightSidebarOutcomesTab is active. */
export function workflowOutcomesAssignTabPanel(page: Page): Locator {
  return workflowRightSidebarContentPanel(page);
}

/** canonical: workflowOutcomesAssignTabHeading */
export function workflowOutcomesAssignTabHeading(page: Page): Locator {
  return workflowRightSidebarOutcomesTabContent(page);
}

/** canonical: workflowOutcomesAssignTabEditOutcomesButton */
export function workflowOutcomesAssignTabEditOutcomesButton(page: Page): Locator {
  return workflowOutcomesAssignTabPanel(page).getByRole('button', {
    name: 'Edit outcomes',
    exact: true,
  });
}

/** canonical: workflowOutcomesAssignTabAddOutcomesButton */
export function workflowOutcomesAssignTabAddOutcomesButton(page: Page): Locator {
  return workflowOutcomesAssignTabPanel(page).getByRole('button', {
    name: 'Add outcomes',
    exact: true,
  });
}

/** canonical: workflowOutcomesAssignTabEmptyStateAlert */
export function workflowOutcomesAssignTabEmptyStateAlert(page: Page): Locator {
  return workflowOutcomesAssignTabPanel(page).getByRole('alert');
}

/** canonical: workflowOutcomesAssignTabTagGroup / workflowOutcomesAssignTabUntaggedGroup section */
export function workflowOutcomesAssignTabGroupSections(page: Page): Locator {
  const content = workflowOutcomesAssignTabPanel(page).locator('h3').locator('xpath=..');
  return content.locator(':scope > div').filter({
    has: page.locator(':scope > ul > li'),
  });
}

/** canonical: workflowOutcomesAssignTabTagGroupTitle (tag label or literal Untagged in mixed case) */
export function workflowOutcomesAssignTabGroupTitle(
  page: Page,
  title: string,
): Locator {
  return workflowOutcomesAssignTabGroupSections(page).locator('> h6').filter({ hasText: title });
}

/** Mixed tagged/untagged case — literal Untagged group heading per FR-WF-AO-002 */
export function workflowOutcomesAssignTabUntaggedGroupTitle(page: Page): Locator {
  return workflowOutcomesAssignTabGroupTitle(page, 'Untagged');
}

/** canonical: workflowOutcomesAssignTabOutcomeRowToggle — expand/collapse on rows with children */
export function workflowOutcomesAssignTabOutcomeRowToggle(
  page: Page,
  rowTitle: string | RegExp,
): Locator {
  const row = workflowOutcomesAssignTabOutcomeRow(page, rowTitle);
  return row.locator('xpath=../following-sibling::button');
}

/**
 * canonical: workflowOutcomesAssignTabOutcomeRow — row header title line (includes ordinal prefix).
 * Pass the composed workflowOutcomeHeaderTitle text or a regex matching it.
 */
export function workflowOutcomesAssignTabOutcomeRow(
  page: Page,
  title: string | RegExp,
): Locator {
  const panel = workflowOutcomesAssignTabPanel(page);
  return typeof title === 'string' ? panel.getByText(title, { exact: true }) : panel.getByText(title);
}

/**
 * canonical: workflowNodeLinkedOutcomesBadge — numeric badge on assigned workflowNode.
 * Product renders the count as visible text on the badge affordance (no stable test-id yet).
 */
export function workflowNodeLinkedOutcomesBadge(
  page: Page,
  nodeUuid: string,
  count: number,
): Locator {
  return workflowNode(page, nodeUuid).getByText(String(count), { exact: true });
}

/** canonical: workflowNodeLinkedOutcomesPopover — MUI popover listing assigned outcomes */
export function workflowNodeLinkedOutcomesPopover(page: Page): Locator {
  return page.locator('[role="presentation"]').filter({ has: page.locator('p') });
}

/** canonical: workflowNodeLinkedOutcomeRow inside an open popover */
export function workflowNodeLinkedOutcomeRow(page: Page, title: string | RegExp): Locator {
  const popover = workflowNodeLinkedOutcomesPopover(page);
  return typeof title === 'string'
    ? popover.getByText(title, { exact: true })
    : popover.getByText(title);
}

/** canonical: workflowNodeLinkedOutcomeRowUnlinkOutcomeMenuItem */
export function workflowNodeLinkedOutcomeRowUnlinkOutcomeMenuItem(page: Page): Locator {
  return page.getByRole('button', { name: 'Unlink outcome' });
}
