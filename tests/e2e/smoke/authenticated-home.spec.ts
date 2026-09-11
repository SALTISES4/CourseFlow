import { test, expect } from '@playwright/test';
import { gotoCourseFlowHome } from '../../helpers/navigation';
import { homeErrorState, homeTemplatesSectionTitle } from '../home/home.locators';
import { keywordSearchField } from '../library/library.locators';
import { myLibraryNavItem } from '../navigation/navigation.locators';

test.beforeEach(async ({ page }) => {
  await gotoCourseFlowHome(page);
});

test('renders the authenticated home dashboard', async ({ page }) => {
  await expect(page).toHaveURL(/\/home\/?$/);
  await expect(homeErrorState(page)).toBeHidden();
  await expect(homeTemplatesSectionTitle(page)).toBeVisible();
});

test('can open my library from home', async ({ page }) => {
  await myLibraryNavItem(page).click();
  await expect(keywordSearchField(page)).toBeVisible();
});
