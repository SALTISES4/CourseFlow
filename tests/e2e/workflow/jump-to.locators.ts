import type { Locator, Page } from '@playwright/test';

/** FR-CAB-007 — empty-title display fragment in Jump to rows (en-CA). */
export const WORKFLOW_JUMP_TO_UNTITLED_SECTION_LABEL = 'Untitled section';

/** canonical: workflowJumpToTrigger */
export function workflowJumpToTrigger(page: Page): Locator {
  return page.getByRole('button', { name: /^Jump to$/i });
}

/** canonical: workflowJumpToMenu */
export function workflowJumpToMenu(page: Page): Locator {
  return page.locator('#jump-to-menu-menu');
}

/** canonical: workflowJumpToMenuSectionItem — row for one section. */
export function workflowJumpToMenuSectionItem(page: Page, visibleLabel: string): Locator {
  return workflowJumpToMenu(page).getByRole('menuitem', { name: visibleLabel, exact: true });
}

/** FR-CAB-007 — '{index} - {title}' or '{index} - Untitled section' when title is empty. */
export const WORKFLOW_JUMP_TO_SECTION_LABEL_SEPARATOR = ' - ';

export function workflowJumpToMenuSectionItemLabel(
  sectionIndex: number,
  persistedTitle: string,
): string {
  const titlePart =
    persistedTitle.length > 0 ? persistedTitle : WORKFLOW_JUMP_TO_UNTITLED_SECTION_LABEL;
  return `${sectionIndex}${WORKFLOW_JUMP_TO_SECTION_LABEL_SEPARATOR}${titlePart}`;
}
