import { test, expect } from '@playwright/test';
import { gotoCourseFlowHome } from '../../helpers/navigation';
import { homeWelcomeHeading } from '../home/home.locators';
import { keywordSearchField } from '../library/library.locators';
import { myLibraryNavItem } from '../navigation/navigation.locators';

test.beforeEach(async ({ page }) => {
  await gotoCourseFlowHome(page);
});

test('shows welcome heading on home', async ({ page }) => {
  await expect(homeWelcomeHeading(page)).toBeVisible();
});

test('can open my library from home', async ({ page }) => {
  await myLibraryNavItem(page).click();
  await expect(keywordSearchField(page)).toBeVisible();
});
