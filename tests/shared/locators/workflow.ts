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

export function workflowRightSidebarTabStrip(page: Page): Locator {
  return workflowRightSidebar(page).getByRole('group');
}

/** canonical: workflowRightSidebarContentPanel — expanded panel (hidden when collapsed) */
export function workflowRightSidebarContentPanel(page: Page): Locator {
  return workflowRightSidebar(page).locator('.MuiPaper-root');
}

export function workflowRightSidebarCommentsTab(page: Page): Locator {
  return workflowRightSidebarTabStrip(page).getByRole('button', { name: 'comments tab' });
}

export function workflowRightSidebarEditTab(page: Page): Locator {
  return workflowRightSidebarTabStrip(page).getByRole('button', { name: 'edit tab' });
}

export function workflowRightSidebarAddTab(page: Page): Locator {
  return workflowRightSidebarTabStrip(page).getByRole('button', { name: 'add tab' });
}

export function workflowRightSidebarOutcomesTab(page: Page): Locator {
  return workflowRightSidebarTabStrip(page).getByRole('button', { name: 'outcomes tab' });
}

export function workflowRightSidebarRelatedTab(page: Page): Locator {
  return workflowRightSidebarTabStrip(page).getByRole('button', { name: 'related tab' });
}

export function workflowRightSidebarToggleButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button').first();
}

/** @deprecated Use workflowRightSidebarCommentsTab — kept for existing specs */
export function workflowCommentsTab(page: Page): Locator {
  return workflowRightSidebarCommentsTab(page);
}

/** @deprecated Use workflowRightSidebarEditTab */
export function workflowEditTab(page: Page): Locator {
  return workflowRightSidebarEditTab(page);
}

/** @deprecated Use workflowRightSidebarAddTab */
export function workflowAddTab(page: Page): Locator {
  return workflowRightSidebarAddTab(page);
}

/** @deprecated Use workflowRightSidebarToggleButton */
export function workflowSidebarToggleButton(page: Page): Locator {
  return workflowRightSidebarToggleButton(page);
}

/** canonical: workflowViewTabSelector */
export function workflowViewTabSelector(page: Page): Locator {
  return page.getByRole('tablist');
}

export function workflowOverviewTab(page: Page): Locator {
  return page.getByRole('tab', { name: 'Overview', exact: true });
}

export function workflowGraphTab(page: Page): Locator {
  return page.getByRole('tab', { name: 'Workflow', exact: true });
}

export function workflowOutcomesTab(page: Page): Locator {
  return page.getByRole('tab', { name: 'Outcomes', exact: true });
}

/** canonical: workflowTitle */
export function workflowTitle(page: Page): Locator {
  return page.getByRole('heading', { level: 1 });
}

/** canonical: workflowHeaderFavouriteToggle */
export function workflowHeaderFavouriteToggle(page: Page): Locator {
  return page.getByRole('button', { name: 'Favourite', exact: true });
}

export const DELETE_SECTION_DIALOG_TITLE = 'You are about to delete a section';
export const DELETE_SECTION_DIALOG_BODY =
  'By deleting this section, you will deleted all nodes which have been added to the section. Are you sure you want to proceed?';

export function workflowSectionDeleteDialogTitle(page: Page): Locator {
  return workflowSectionDeleteDialog(page).getByRole('heading', {
    name: DELETE_SECTION_DIALOG_TITLE,
    exact: true,
  });
}

export function workflowSectionDeleteDialogBody(page: Page): Locator {
  return workflowSectionDeleteDialog(page).getByText(DELETE_SECTION_DIALOG_BODY, {
    exact: true,
  });
}

export function workflowSectionDeleteDialogCancelButton(page: Page): Locator {
  return workflowSectionDeleteDialog(page).getByRole('button', { name: 'Cancel', exact: true });
}

export function workflowSectionDeleteDialogConfirmButton(page: Page): Locator {
  return workflowSectionDeleteDialog(page).getByRole('button', {
    name: 'Delete section',
    exact: true,
  });
}

export function workflowRightSidebarAddTabContent(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('heading', {
    name: 'Add to workflow',
    exact: true,
  });
}

export function workflowRightSidebarOutcomesTabContent(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('heading', {
    name: 'Outcomes',
    exact: true,
  });
}

export function workflowRightSidebarCommentsTabContent(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('heading', {
    name: 'Comments',
    exact: true,
  });
}

/** @deprecated Use workflowRightSidebarCommentsTabContent */
export function workflowCommentsTabContent(page: Page): Locator {
  return workflowRightSidebarCommentsTabContent(page);
}

export function workflowCommentsComposerField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Comment$/i);
}

/** Product label is 'Comment'; FR-WF-COMMENTS-006 canonical label is 'Add comment'. */
export function workflowCommentsTabComposerSubmitButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: /^Comment$/i });
}

export function workflowCommentsTabListItemBody(page: Page, body: string): Locator {
  return workflowRightSidebarContentPanel(page).getByText(body, { exact: true });
}

export function workflowCommentsTabListItemDeleteLink(page: Page, body: string): Locator {
  return workflowCommentsTabListItemBody(page, body)
    .locator('..')
    .getByRole('button', { name: 'Delete', exact: true });
}

export function workflowCommentsTabListItemHeaders(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByText(/ • /);
}
