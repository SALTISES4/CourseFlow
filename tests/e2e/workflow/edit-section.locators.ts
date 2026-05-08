import type { Locator, Page } from '@playwright/test';

/**
 * Locators for Edit Section e2e — aligned with tests/docs/Mapping FR UI.md
 * LOCATOR_CONSTANT column. Implementation references: react/.../Sidebar/index.tsx,
 * react/.../Week/index.tsx (Section = Week in code).
 */

/** Maps [Right sidebar] */
export const SIDEBAR_LOCATOR = '[data-test-id="sidebar"]';

export function rightSidebar(page: Page): Locator {
  return page.locator(SIDEBAR_LOCATOR);
}

/**
 * Maps [Section header] — `StyledWeek.WeekHeader` renders as `header` inside
 * `[data-week-id]`.
 */
export function sectionHeader(page: Page, weekId: string): Locator {
  return page.locator(`[data-week-id="${weekId}"] > header`);
}

/** First Section on the board when week id is unknown (use only when FR allows any Section). */
export function firstSectionHeader(page: Page): Locator {
  return page.locator('[data-week-id]').first().locator('> header');
}

/**
 * FR bracket [Insert below] / Mapping "Insert below" → AddCircleOutlineIcon.
 * Missing Requirement: accessible name in app is not the literal "Insert below".
 */
export const INSERT_BELOW_SECTION_NAME = /Insert week below/i;

/**
 * FR [Duplicate] on hover — Mapping Duplicate → ContentCopyIcon.
 * Missing Requirement: UI string is not literal "Duplicate".
 */
export const DUPLICATE_SECTION_HOVER_NAME = /Duplicate week below/i;

/**
 * FR [Delete] on hover — Mapping Delete → DeleteOutlinedIcon.
 * Missing Requirement: UI string is not literal "Delete".
 */
export const DELETE_SECTION_HOVER_NAME = /Delete week/i;

/** FR [Comment] / [Comment icon] — Mapping Comment → CommentOutlinedIcon. */
export const COMMENT_HOVER_NAME = /^Comments$/i;

/** FR [Edit section] — SidebarTitle uses _t('Edit section'). */
export const EDIT_SECTION_HEADING = 'Edit section';

/**
 * FR [Title] — not in Mapping FR UI.md; literal would be "Title".
 * Missing Requirement: EditSection TextField uses label _t('Week'), not "Title".
 */
export function titleFieldInEditSectionForm(page: Page): Locator {
  return rightSidebar(page).getByLabel(/^Week$/i);
}

/** FR [Duplicate] button in sidebar — _t('Duplicate'). */
export function duplicateButtonInSidebar(page: Page): Locator {
  return rightSidebar(page).getByRole('button', { name: /^Duplicate$/i });
}

/** FR [Delete] button in sidebar — _t('Delete'). */
export function deleteButtonInSidebar(page: Page): Locator {
  return rightSidebar(page).getByRole('button', { name: /^Delete$/i });
}

/** Modal FR [Delete section] — _t('Delete section'). */
export function deleteSectionConfirmButton(page: Page): Locator {
  return page.getByRole('button', { name: /^Delete section$/i });
}

/** Modal FR [Cancel] — _t('Cancel'). */
export function deleteSectionCancelButton(page: Page): Locator {
  return page.getByRole('button', { name: /^Cancel$/i });
}
