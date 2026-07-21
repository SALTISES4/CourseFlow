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

/** canonical: workflowAddTabNodeCategoryItem — draggable row for a channel title */
export function workflowAddTabNodeCategoryItem(page: Page, label: string): Locator {
  return workflowRightSidebarContentPanel(page)
    .locator('[data-test-id="workflow-add-tab-node-category-item"]')
    .filter({ has: page.getByText(label, { exact: true }) });
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
