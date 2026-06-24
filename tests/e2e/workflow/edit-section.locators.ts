import type { Locator, Page } from '@playwright/test';

/**
 * Locators for Edit Section e2e — aligned with
 * tests/docs/requirements/features/shared/canonical_locators.yaml (workflowSection* uiObjects).
 */

export const WORKFLOW_RIGHT_SIDEBAR = '[data-test-id="workflow-right-sidebar"]';
export const WORKFLOW_SECTION_CONTAINER = '[data-section-id]';
export const WORKFLOW_EDIT_SECTION_FORM = '[data-test-id="workflow-edit-section-form"]';

export function rightSidebar(page: Page): Locator {
  return page.locator(WORKFLOW_RIGHT_SIDEBAR);
}

export function editSectionForm(page: Page): Locator {
  return page.locator(WORKFLOW_EDIT_SECTION_FORM);
}

export function sectionContainer(page: Page, sectionUuid: string): Locator {
  return page.locator(`[data-section-id="${sectionUuid}"]`);
}

export function sectionHeader(page: Page, sectionUuid: string): Locator {
  return sectionContainer(page, sectionUuid).locator('> header');
}

/** Maps uiObject workflowSectionNumberLabel */
export function sectionNumberLabel(page: Page, sectionUuid: string): Locator {
  return sectionHeader(page, sectionUuid).locator('span').first();
}

export function sectionHoverMenu(page: Page, sectionUuid: string): Locator {
  return sectionHeader(page, sectionUuid).locator('.hover-menu');
}

export function sectionContainers(page: Page): Locator {
  return page.locator(WORKFLOW_SECTION_CONTAINER);
}

export const INSERT_SECTION_BELOW_NAME = 'Insert section below';
export const DUPLICATE_SECTION_BELOW_NAME = 'Duplicate section below';
export const DELETE_SECTION_HOVER_NAME = 'Delete section';
export const COMMENT_HOVER_NAME = 'Comments';

export const EDIT_SECTION_HEADING = 'Edit section';

export function insertBelowButtonInSectionHeader(page: Page, sectionUuid: string): Locator {
  return sectionHoverMenu(page, sectionUuid).getByRole('button', {
    name: INSERT_SECTION_BELOW_NAME,
  });
}

export function duplicateBelowButtonInSectionHeader(page: Page, sectionUuid: string): Locator {
  return sectionHoverMenu(page, sectionUuid).getByRole('button', {
    name: DUPLICATE_SECTION_BELOW_NAME,
  });
}

export function titleFieldInEditSectionForm(page: Page): Locator {
  return editSectionForm(page).getByLabel(/^Section$/i);
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
  return page.locator('[aria-labelledby="delete-section-part-modal"]');
}
