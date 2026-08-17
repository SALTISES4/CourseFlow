import type { Locator, Page } from '@playwright/test';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';

/** canonical: workflowAddTabTitle */
export function workflowAddTabTitle(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('heading', {
    name: 'Add to workflow',
    exact: true,
  });
}

/** canonical: workflowAddTabInsertModeGroup */
export function workflowAddTabInsertModeGroup(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByText('Insert mode', { exact: true });
}

/** canonical: workflowAddTabInsertModeHelpIcon — info icon beside Insert mode label */
export function workflowAddTabInsertModeHelpIcon(page: Page): Locator {
  return workflowRightSidebarContentPanel(page)
    .locator('.MuiTypography-root')
    .filter({ has: page.getByText('Insert mode', { exact: true }) })
    .locator('svg');
}

/** FR-WF-ADD-002 mainFlow / AC — insert-mode help tooltip copy */
export const WORKFLOW_ADD_TAB_INSERT_MODE_HELP_TOOLTIP_COPY =
  'Row mode forces nodes into a vertical sequence. Column mode allows multiple nodes side-by-side. Manual mode prompts you to choose a layout style for every new node.';

export function workflowAddTabInsertModeToggleGroup(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('group', { name: 'Insert mode' });
}

export function workflowAddTabInsertModeManualButton(page: Page): Locator {
  return workflowAddTabInsertModeToggleGroup(page).getByRole('button', { name: 'Manual', exact: true });
}

export function workflowAddTabInsertModeRowButton(page: Page): Locator {
  return workflowAddTabInsertModeToggleGroup(page).getByRole('button', { name: 'Row', exact: true });
}

export function workflowAddTabInsertModeColumnButton(page: Page): Locator {
  return workflowAddTabInsertModeToggleGroup(page).getByRole('button', { name: 'Column', exact: true });
}

/** canonical: workflowAddTabNodeCategoriesGroup */
export function workflowAddTabNodeCategoriesGroup(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByText('Node categories', { exact: true });
}

/** All channel-backed node category rows (excludes custom-category dashed row). */
export function workflowAddTabNodeCategoryItems(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).locator(
    '[data-test-id="workflow-add-tab-node-category-item"]',
  );
}

/** canonical: workflowAddTabNodeCategoryItem — draggable row for a channel title */
export function workflowAddTabNodeCategoryItem(page: Page, label: string): Locator {
  return workflowRightSidebarContentPanel(page)
    .locator('[data-test-id="workflow-add-tab-node-category-item"]')
    .filter({ has: page.getByText(label, { exact: true }) });
}

/** Channel-backed Add-tab row linked to a workflowChannel uuid. */
export function workflowAddTabNodeCategoryItemByChannelUuid(
  page: Page,
  channelUuid: string,
): Locator {
  return workflowRightSidebarContentPanel(page).locator(
    `[data-test-id="workflow-add-tab-node-category-item"][data-draggable-uuid="${channelUuid}"]`,
  );
}

export function workflowAddTabCustomNodeCategoryItem(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).locator(
    '[data-test-id="workflow-add-tab-custom-node-category-item"]',
  );
}

export function workflowManualPlacementDialog(page: Page): Locator {
  return page
    .locator('[data-test-id="workflow-manual-placement-dialog"]')
    .getByRole('menu');
}

export function workflowManualPlacementDialogRowButton(page: Page): Locator {
  return page.locator('[data-test-id="workflow-manual-placement-row-button"]');
}

export function workflowManualPlacementDialogColumnButton(page: Page): Locator {
  return page.locator('[data-test-id="workflow-manual-placement-column-button"]');
}
