import type { Locator, Page } from '@playwright/test';

/**
 * Shared workflow editor uiObjects — canonical_locators.yaml (workflowSection*, workflowRightSidebar*, workflowEditSectionForm*).
 */

export const WORKFLOW_RIGHT_SIDEBAR = '[data-test-id="workflow-right-sidebar"]';
export const WORKFLOW_SECTION_CONTAINER = '[data-section-id]';
export const WORKFLOW_EDIT_SECTION_FORM = '[data-test-id="workflow-edit-section-form"]';

/** canonical: workflowRightSidebar */
export function workflowRightSidebar(page: Page): Locator {
  return page.locator(WORKFLOW_RIGHT_SIDEBAR);
}

/** canonical: workflowEditSectionForm */
export function workflowEditSectionForm(page: Page): Locator {
  return page.locator(WORKFLOW_EDIT_SECTION_FORM);
}

/** canonical: workflowSectionContainer */
export function workflowSectionContainer(page: Page, sectionUuid: string): Locator {
  return page.locator(`[data-section-id="${sectionUuid}"]`);
}

/** canonical: workflowSectionHeader */
export function workflowSectionHeader(page: Page, sectionUuid: string): Locator {
  return workflowSectionContainer(page, sectionUuid).locator('> header');
}

/** canonical: workflowSectionNumberLabel */
export function workflowSectionNumberLabel(page: Page, sectionUuid: string): Locator {
  return workflowSectionHeader(page, sectionUuid).locator('span').first();
}

export function workflowSectionContainers(page: Page): Locator {
  return page.locator(WORKFLOW_SECTION_CONTAINER);
}

/** canonical: workflowSectionDeleteDialog */
export function workflowSectionDeleteDialog(page: Page): Locator {
  return page.locator('[aria-labelledby="delete-section-part-modal"]');
}

export const INSERT_SECTION_BELOW_NAME = 'Insert section below';
export const DUPLICATE_SECTION_BELOW_NAME = 'Duplicate section below';
export const DELETE_SECTION_HOVER_NAME = 'Delete section';
export const COMMENT_HOVER_NAME = 'Comments';
export const EDIT_SECTION_HEADING = 'Edit section';

/** canonical: workflowSectionContainerHoverActionsMenu */
export function workflowSectionHoverActionsMenu(page: Page, sectionUuid: string): Locator {
  return workflowSectionContainer(page, sectionUuid).locator(
    '[data-test-id="workflow-section-hover-menu"]',
  );
}

/** canonical: workflowSectionContainerHoverActionsMenuInsertBelowItem */
export function workflowSectionHoverInsertBelowItem(page: Page, sectionUuid: string): Locator {
  return workflowSectionHoverActionsMenu(page, sectionUuid).getByRole('button', {
    name: INSERT_SECTION_BELOW_NAME,
  });
}

/** canonical: workflowSectionContainerHoverActionsMenuDuplicateItem */
export function workflowSectionHoverDuplicateItem(page: Page, sectionUuid: string): Locator {
  return workflowSectionHoverActionsMenu(page, sectionUuid).getByRole('button', {
    name: DUPLICATE_SECTION_BELOW_NAME,
  });
}

/** canonical: workflowSectionContainerHoverActionsMenuDeleteItem */
export function workflowSectionHoverDeleteItem(page: Page, sectionUuid: string): Locator {
  return workflowSectionHoverActionsMenu(page, sectionUuid).getByRole('button', {
    name: DELETE_SECTION_HOVER_NAME,
  });
}

/** canonical: workflowSectionContainerHoverActionsMenuCommentsItem */
export function workflowSectionHoverCommentsItem(page: Page, sectionUuid: string): Locator {
  return workflowSectionHoverActionsMenu(page, sectionUuid).getByRole('button', {
    name: COMMENT_HOVER_NAME,
  });
}

/** canonical: workflowSectionHeaderCollapseButton */
export function workflowSectionHeaderCollapseButton(page: Page, sectionUuid: string): Locator {
  return workflowSectionHeader(page, sectionUuid).getByRole('button', {
    name: /^(Collapse|Expand) section$/i,
  });
}

/** Nodes rendered inside a workflowSectionContainer. */
export function workflowSectionNodes(page: Page, sectionUuid: string): Locator {
  return workflowSectionContainer(page, sectionUuid).locator('[id^="node-"]');
}

/** canonical: workflowSectionContainerSelectedBorder — selected wrapper chrome */
export function workflowSectionContainerSelected(page: Page, sectionUuid: string): Locator {
  return page.locator(`[data-section-id="${sectionUuid}"][data-selected="true"]`);
}

export function workflowCommentsTab(page: Page): Locator {
  return page.getByRole('button', { name: 'comments tab' });
}
