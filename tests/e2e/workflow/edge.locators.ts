import type { Locator, Page } from '@playwright/test';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';

export type EdgeHandle = 'top' | 'right' | 'bottom' | 'left';

/** canonical: workflowEdge — product uses data-edge-id (edgeId string), not data-nodelink-id */
export function workflowEdge(page: Page, edgeId: string): Locator {
  return page.locator(`#line-svg g[data-edge-id="${edgeId}"]`);
}

/** Clickable transparent stroke on workflowEdge (FR-WF-EDGE-004). */
export function workflowEdgeClickTarget(page: Page, edgeId: string): Locator {
  return workflowEdge(page, edgeId).locator('path[style*="cursor: pointer"]');
}

/** canonical: workflowNodeEdgeHandle* — SVG circle handles on node hover */
export function workflowNodeEdgeHandle(
  page: Page,
  nodeUuid: string,
  handle: EdgeHandle,
): Locator {
  return page.locator(`#node-${nodeUuid} circle[data-edge="${handle}"]`);
}

export function workflowNodeEdgeHandles(page: Page, nodeUuid: string): Locator {
  return page.locator(`#node-${nodeUuid} circle[data-edge]`);
}

/** canonical: workflowEdgeSourceReconnectHandle — first endpoint handle when edge selected */
export function workflowEdgeSourceReconnectHandle(page: Page, edgeId: string): Locator {
  return workflowEdge(page, edgeId).locator('circle').first();
}

/** canonical: workflowEdgeTargetReconnectHandle — second endpoint handle when edge selected */
export function workflowEdgeTargetReconnectHandle(page: Page, edgeId: string): Locator {
  return workflowEdge(page, edgeId).locator('circle').nth(1);
}

/** canonical: workflowEditEdgeFormHeading */
export function workflowEditEdgeFormHeading(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('heading', {
    name: 'Edit node link',
    exact: true,
  });
}

/** canonical: workflowEditEdgeForm */
export function workflowEditEdgeForm(page: Page): Locator {
  return workflowEditEdgeFormHeading(page);
}

/** canonical: workflowEditEdgeFormTitleField */
export function workflowEditEdgeFormTitleField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Title$/i);
}

/** canonical: workflowEditEdgeFormDashedLineToggle */
export function workflowEditEdgeFormDashedLineToggle(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('checkbox', {
    name: /Dashed line/i,
  });
}

/** canonical: workflowEditEdgeFormDeleteButton */
export function workflowEditEdgeFormDeleteButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', {
    name: 'Delete',
    exact: true,
  });
}
