import type { Locator, Page } from '@playwright/test';

/** FR-CAB-006 — menu row labels on workflowViewSettingsMenu. */
export const WORKFLOW_VIEW_SETTINGS_MENU_ITEM_LABELS = {
  expandAllSections: 'Expand all sections',
  collapseAllSections: 'Collapse all sections',
  expandAllOutcomes: 'Expand all outcomes',
  collapseAllOutcomes: 'Collapse all outcomes',
} as const;

/** canonical: workflowViewSettingsTrigger */
export function workflowViewSettingsTrigger(page: Page): Locator {
  return page.getByRole('button', { name: /^View settings$/i });
}

/** canonical: workflowViewSettingsMenu — MUI menu opened from workflowViewSettingsTrigger. */
export function workflowViewSettingsMenu(page: Page): Locator {
  return page.locator('#actions-menu-menu');
}

/** FR-CAB-006 — discrete menu row (requirements: menuitem, not a standalone switch). */
export function workflowViewSettingsMenuItem(page: Page, label: string): Locator {
  return workflowViewSettingsMenu(page).getByRole('menuitem').filter({ hasText: label });
}

/** canonical: workflowViewSettingsMenuTagsSection */
export function workflowViewSettingsMenuTagsSection(page: Page): Locator {
  return workflowViewSettingsMenu(page).getByText('Tags', { exact: true }).locator('..');
}

/** Tag on/off toggle inside workflowViewSettingsMenuTagsSection. */
export function workflowViewSettingsMenuTagToggle(page: Page, tagLabel: string): Locator {
  return workflowViewSettingsMenu(page).getByRole('checkbox', { name: tagLabel, exact: true });
}

/** @deprecated Use workflowViewSettingsTrigger — kept for edit-section imports. */
export function viewSettingsButton(page: Page): Locator {
  return workflowViewSettingsTrigger(page);
}

/** @deprecated FR-SEC-012 legacy locator — product may still expose a switch inside the menu. */
export function expandAllSectionsSwitch(page: Page): Locator {
  return page.getByRole('checkbox', { name: /^Expand all sections$/i });
}
