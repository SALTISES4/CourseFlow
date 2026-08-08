import type { Locator, Page } from '@playwright/test';
import {
  COMMENT_HOVER_NAME,
  DELETE_SECTION_HOVER_NAME,
  DUPLICATE_SECTION_BELOW_NAME,
  EDIT_SECTION_HEADING,
  INSERT_SECTION_BELOW_NAME,
  workflowEditSectionForm,
  workflowRightSidebar,
  workflowSectionContainer,
  workflowSectionContainers,
  workflowSectionDeleteDialog,
  workflowSectionHeader,
  workflowSectionNumberLabel,
  workflowSectionHoverActionsMenu,
  workflowSectionHoverCommentsItem,
  workflowSectionHoverDeleteItem,
  workflowSectionHoverDuplicateItem,
  workflowSectionHoverInsertBelowItem,
  workflowSectionHeaderCollapseButton,
  workflowSectionNodes,
  workflowSectionContainerSelected,
  workflowCommentsTab,
} from '../../shared/locators/workflow';

/**
 * Edit Section domain aliases — canonical names live in tests/shared/locators/workflow.ts.
 */

export {
  COMMENT_HOVER_NAME,
  DELETE_SECTION_HOVER_NAME,
  DUPLICATE_SECTION_BELOW_NAME,
  EDIT_SECTION_HEADING,
  INSERT_SECTION_BELOW_NAME,
};

export const WORKFLOW_RIGHT_SIDEBAR = '[data-test-id="workflow-right-sidebar"]';
export const WORKFLOW_SECTION_CONTAINER = '[data-section-id]';
export const WORKFLOW_EDIT_SECTION_FORM = '[data-test-id="workflow-edit-section-form"]';

export function rightSidebar(page: Page): Locator {
  return workflowRightSidebar(page);
}

export function editSectionForm(page: Page): Locator {
  return workflowEditSectionForm(page);
}

export function sectionContainer(page: Page, sectionUuid: string): Locator {
  return workflowSectionContainer(page, sectionUuid);
}

export function sectionHeader(page: Page, sectionUuid: string): Locator {
  return workflowSectionHeader(page, sectionUuid);
}

export function sectionNumberLabel(page: Page, sectionUuid: string): Locator {
  return workflowSectionNumberLabel(page, sectionUuid);
}

export function sectionHoverMenu(page: Page, sectionUuid: string): Locator {
  return workflowSectionHoverActionsMenu(page, sectionUuid);
}

export function insertBelowButtonInSectionHeader(page: Page, sectionUuid: string): Locator {
  return workflowSectionHoverInsertBelowItem(page, sectionUuid);
}

export function duplicateBelowButtonInSectionHeader(page: Page, sectionUuid: string): Locator {
  return workflowSectionHoverDuplicateItem(page, sectionUuid);
}

export function deleteButtonInSectionHeader(page: Page, sectionUuid: string): Locator {
  return workflowSectionHoverDeleteItem(page, sectionUuid);
}

export function commentsButtonInSectionHeader(page: Page, sectionUuid: string): Locator {
  return workflowSectionHoverCommentsItem(page, sectionUuid);
}

export function sectionCollapseButton(page: Page, sectionUuid: string): Locator {
  return workflowSectionHeaderCollapseButton(page, sectionUuid);
}

export function sectionNodes(page: Page, sectionUuid: string): Locator {
  return workflowSectionNodes(page, sectionUuid);
}

export function selectedSectionContainer(page: Page, sectionUuid: string): Locator {
  return workflowSectionContainerSelected(page, sectionUuid);
}

export function commentsTabInSidebar(page: Page): Locator {
  return workflowCommentsTab(page);
}

export function sectionContainers(page: Page): Locator {
  return workflowSectionContainers(page);
}

export function titleFieldInEditSectionForm(page: Page): Locator {
  return editSectionForm(page).getByLabel(/^Section$/i);
}

export function viewSettingsButton(page: Page): Locator {
  return page.getByRole('button', { name: /^View settings$/i });
}

export function expandAllSectionsSwitch(page: Page): Locator {
  return page.getByRole('checkbox', { name: /^Expand all sections$/i });
}

export function duplicateButtonInSidebar(page: Page): Locator {
  return editSectionForm(page).getByRole('button', { name: /^Duplicate$/i });
}

export function deleteButtonInSidebar(page: Page): Locator {
  return editSectionForm(page).getByRole('button', { name: /^Delete$/i });
}

export function deleteSectionConfirmButton(page: Page): Locator {
  return page.getByRole('button', { name: /^Delete section$/i });
}

export function deleteSectionCancelButton(page: Page): Locator {
  return page.getByRole('button', { name: /^Cancel$/i });
}

export function deleteSectionDialog(page: Page): Locator {
  return workflowSectionDeleteDialog(page);
}
