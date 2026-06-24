import type { Locator, Page } from '@playwright/test';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';

/**
 * Workflow graph uiObjects — canonical_locators.yaml (workflowNode*, workflowChannel*).
 */

export const COMMENTS_HOVER_NAME = 'Comments';
export const INSERT_NODE_BELOW_NAME = 'Insert node below';
export const DUPLICATE_NODE_BELOW_NAME = 'Duplicate node below';
export const DELETE_NODE_HOVER_NAME = 'Delete node';
export const INSERT_CHANNEL_RIGHT_NAME = 'Insert right';
export const DUPLICATE_CHANNEL_HOVER_NAME = 'Duplicate';
export const DELETE_CHANNEL_HOVER_NAME = 'Delete';

export function workflowNodes(page: Page): Locator {
  return page.locator('[id^="node-"]');
}

/** canonical: workflowNode — DOM id `node-{workflowNodeId}` */
export function workflowNode(page: Page, nodeUuid: string): Locator {
  return page.locator(`#node-${nodeUuid}`);
}

export function workflowNodeContent(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).getByText(new RegExp(`#${nodeUuid}`));
}

export function workflowNodeHoverCommentsItem(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).getByRole('button', { name: COMMENTS_HOVER_NAME });
}

export function workflowNodeHoverInsertBelowItem(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).getByRole('button', { name: INSERT_NODE_BELOW_NAME });
}

export function workflowNodeHoverDuplicateItem(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).getByRole('button', { name: DUPLICATE_NODE_BELOW_NAME });
}

export function workflowNodeHoverDeleteItem(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).getByRole('button', { name: DELETE_NODE_HOVER_NAME });
}

/** Color band at top of workflowNode */
export function workflowNodeBorder(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).locator('> div').first();
}

export async function workflowNodeHasSelectedBorder(page: Page, nodeUuid: string): Promise<boolean> {
  return workflowNode(page, nodeUuid).evaluate((el) => {
    const shadow = getComputedStyle(el).boxShadow;
    return shadow !== 'none' && shadow !== '';
  });
}

export function workflowChannelHeaders(page: Page): Locator {
  return page.locator('[data-column-id]');
}

/** canonical: workflowChannel — column shell with data-column-id */
export function workflowChannelHeader(page: Page, channelUuid: string): Locator {
  return page.locator(`[data-column-id="${channelUuid}"]`);
}

export function workflowChannelHeaderByTitle(page: Page, title: string): Locator {
  return workflowChannelHeaders(page).filter({ hasText: title });
}

export function workflowChannelHoverCommentsItem(page: Page, channelUuid: string): Locator {
  return workflowChannelHeader(page, channelUuid).getByRole('button', {
    name: COMMENTS_HOVER_NAME,
  });
}

export function workflowChannelHeaderTitle(page: Page, channelUuid: string): Locator {
  return workflowChannelHeader(page, channelUuid).locator('[class*="Title"], .MuiTypography-body2').first();
}

export function workflowChannelHoverInsertRightItem(page: Page, channelUuid: string): Locator {
  return workflowChannelHeader(page, channelUuid).getByRole('button', {
    name: INSERT_CHANNEL_RIGHT_NAME,
  });
}

export function workflowChannelHoverDuplicateItem(page: Page, channelUuid: string): Locator {
  return workflowChannelHeader(page, channelUuid).getByRole('button', {
    name: DUPLICATE_CHANNEL_HOVER_NAME,
  });
}

export function workflowChannelHoverDeleteItem(page: Page, channelUuid: string): Locator {
  return workflowChannelHeader(page, channelUuid).getByRole('button', {
    name: DELETE_CHANNEL_HOVER_NAME,
  });
}

export function workflowEditChannelFormColorField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Color$/i);
}

/** canonical: workflowEditNodeForm heading */
export function workflowEditNodeForm(page: Page): Locator {
  return page.getByRole('heading', { name: 'Edit node', exact: true });
}

/** canonical: workflowEditChannelForm heading */
export function workflowEditChannelForm(page: Page): Locator {
  return page.getByRole('heading', { name: 'Edit node category', exact: true });
}

/** canonical: workflowEditNodeFormTitleField */
export function workflowEditNodeFormTitleField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Title$/i);
}

export function workflowEditNodeFormContextField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Context$/i);
}

export function workflowEditNodeFormDescriptionField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Description$/i);
}

export function workflowEditNodeFormTaskTypeField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Type of task$/i);
}

export function workflowEditNodeFormTimeAmountField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Amount$/i);
}

export function workflowEditNodeFormTimeUnitField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Unit type$/i);
}

export function workflowEditNodeFormTagsField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Tags$/i);
}

export function workflowEditNodeFormDuplicateButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: 'Duplicate', exact: true });
}

export function workflowEditNodeFormDeleteButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: 'Delete', exact: true });
}

/** canonical: workflowEditChannelFormTitleField */
export function workflowEditChannelFormTitleField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Title$/i);
}
