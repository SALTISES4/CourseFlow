import { expect, type Page } from '@playwright/test';

import { projectDisciplineField } from '../e2e/project/project.locators';

export async function openProjectDisciplineSelect(page: Page): Promise<void> {
  await projectDisciplineField(page).click();
  await expect(page.getByRole('listbox')).toBeVisible();
}

export async function closeProjectDisciplineSelect(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
}

/** Select one catalogue option; ProjectForm closes the listbox on change — do not Escape (closes the dialog). */
export async function selectProjectDisciplineOption(
  page: Page,
  label: string,
): Promise<void> {
  await openProjectDisciplineSelect(page);
  await page.getByRole('option', { name: label, exact: true }).click();
  await expect(page.getByRole('listbox')).toBeHidden();
}

export async function projectDisciplineOptionLabels(page: Page): Promise<string[]> {
  const options = page.getByRole('listbox').getByRole('option');
  const count = await options.count();
  const labels: string[] = [];

  for (let i = 0; i < count; i++) {
    labels.push((await options.nth(i).innerText()).trim());
  }

  return labels;
}
