import { test, expect } from '@playwright/test';
import { gotoCourseFlowHome } from '../../helpers/navigation';
import { panelLibrary } from '../../shared/locators/app';

test.beforeEach(async ({ page }) => {
  await gotoCourseFlowHome(page);
});

test('shows welcome heading on home', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Welcome to Courseflow/i })).toBeVisible();
});

test('can open my library from home', async ({ page }) => {
  await panelLibrary(page).click();
  await page.getByPlaceholder('Search in projects...').isVisible();
});
