import { expect, type Page } from '@playwright/test';

import { navigateToWorkflowGraphSubView } from './view-settings';
import { sectionHeader } from '../e2e/workflow/edit-section.locators';
import {
  workflowJumpToMenu,
  workflowJumpToMenuSectionItem,
  workflowJumpToMenuSectionItemLabel,
  workflowJumpToTrigger,
} from '../e2e/workflow/jump-to.locators';

export async function openWorkflowJumpToMenu(page: Page): Promise<void> {
  await expect(workflowJumpToTrigger(page)).toBeVisible();
  await workflowJumpToTrigger(page).click();
  await expect(workflowJumpToMenu(page)).toBeVisible();
}

export async function closeWorkflowJumpToMenu(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(workflowJumpToMenu(page)).toBeHidden();
}

/** FR-CAB-007 — each seeded section row label matches index + title or untitled fallback. */
export async function expectWorkflowJumpToMenuSectionLabelsPerFrCab007(
  page: Page,
  sections: ReadonlyArray<{ index: number; title: string }>,
): Promise<void> {
  await openWorkflowJumpToMenu(page);

  for (const section of sections) {
    const label = workflowJumpToMenuSectionItemLabel(section.index, section.title);
    await expect(workflowJumpToMenuSectionItem(page, label)).toBeVisible();
  }

  await expect(workflowJumpToMenu(page).getByRole('menuitem')).toHaveCount(sections.length);
  await closeWorkflowJumpToMenu(page);
}

/** FR-CAB-007 — choosing a row scrolls workflowView to that workflowSectionContainer. */
export async function expectWorkflowJumpToScrollsToSectionPerFrCab007(
  page: Page,
  sectionUuid: string,
  menuLabel: string,
): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await openWorkflowJumpToMenu(page);
  await workflowJumpToMenuSectionItem(page, menuLabel).click();
  await expect(workflowJumpToMenu(page)).toBeHidden();

  const header = sectionHeader(page, sectionUuid);
  await expect
    .poll(async () =>
      header.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight;
      }),
    )
    .toBe(true);
}

export { navigateToWorkflowGraphSubView, workflowJumpToMenuSectionItemLabel };
