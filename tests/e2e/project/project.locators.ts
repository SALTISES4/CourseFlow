import { expect, type Locator, type Page } from '@playwright/test';
import {
  KEYWORD_SEARCH_PLACEHOLDER,
  keywordSearchClearButton,
  keywordSearchField,
  libraryCards,
  libraryEmptyState,
  libraryErrorState,
  libraryFilterToolbar,
  libraryLoadingSkeletons,
  selectFilterOption,
  sortMenuItem,
} from '../../shared/locators/library';
import { addMenuItemProject, addMenuTrigger } from '../navigation/navigation.locators';

export {
  KEYWORD_SEARCH_PLACEHOLDER,
  keywordSearchClearButton,
  keywordSearchField,
  libraryCards as projectWorkflowCards,
  libraryEmptyState as projectWorkflowsEmptyState,
  libraryErrorState as projectWorkflowsErrorState,
  selectFilterOption,
};

export { globalMessageSnackbar } from '../../shared/locators/global';

/**
 * Project-domain uiObjects — canonical_locators.yaml (project*).
 * Shared listing/toolbar uiObjects re-export from tests/shared/locators/library.ts.
 */

export function projectTitle(page: Page): Locator {
  return page.getByRole('heading', { level: 1 });
}

export function projectHeaderFavouriteToggle(page: Page): Locator {
  return page.getByRole('button', { name: 'Favourite', exact: true });
}

export function projectViewTabSelector(page: Page): Locator {
  return page.getByRole('tablist');
}

export function projectOverviewTab(page: Page): Locator {
  return page.getByRole('tab', { name: 'Overview', exact: true });
}

export function projectWorkflowsTab(page: Page): Locator {
  return page.getByRole('tab', { name: 'Workflows', exact: true });
}

/** canonical: projectOverviewView — main content region on /project/{id} */
export function projectOverviewView(page: Page): Locator {
  return page.locator('[data-test-id="project-overview-view"]');
}

export function projectMetadataFieldDescription(page: Page): Locator {
  return projectOverviewView(page).getByText('Description', { exact: true }).first();
}

export function projectMetadataFieldDisciplines(page: Page): Locator {
  return projectOverviewView(page).getByText('Disciplines', { exact: true }).first();
}

export function projectMetadataFieldCreatedOn(page: Page): Locator {
  return projectOverviewView(page).getByText('Created on', { exact: true }).first();
}

/** Disciplines info block (label + value or empty copy). */
export function projectMetadataDisciplinesBlock(page: Page): Locator {
  const overview = projectOverviewView(page);
  return overview.locator('div').filter({ hasText: 'Disciplines' }).first();
}

export function projectMetadataPermissionsPanel(page: Page): Locator {
  return projectOverviewView(page).getByText('Permissions', { exact: true }).first();
}

export function projectMetadataAddContributorsButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Add CourseFlow user', exact: true });
}

export function projectTagsSection(page: Page): Locator {
  return projectOverviewView(page).getByText('Tags', { exact: true }).first();
}

export function addNewTagInput(page: Page): Locator {
  return page.getByPlaceholder('Add new tag');
}

/** canonical: projectWorkflowsView — main content region on /project/{id}/workflows */
export function projectWorkflowsView(page: Page): Locator {
  return page.locator('[data-test-id="project-workflows-view"]');
}

/** canonical: projectWorkflowsFilterToolbar — alias of libraryFilterToolbar */
export function projectWorkflowsFilterToolbar(page: Page): Locator {
  return libraryFilterToolbar(page);
}

export function projectWorkflowsSortControl(page: Page): Locator {
  return projectWorkflowsFilterToolbar(page).getByRole('button').first();
}

export function projectWorkflowsDisciplineFilter(page: Page): Locator {
  return projectWorkflowsFilterToolbar(page).getByRole('button', { name: /^Discipline$/ });
}

export function projectWorkflowsTypeFilter(page: Page): Locator {
  return projectWorkflowsFilterToolbar(page).getByRole('button', { name: /^Type$/ });
}

export function projectWorkflowsTemplatesToggle(page: Page): Locator {
  return projectWorkflowsFilterToolbar(page).getByRole('button', { name: 'Templates', exact: true });
}

export function projectWorkflowsOwnershipFilter(page: Page): Locator {
  return projectWorkflowsFilterToolbar(page).getByRole('button', {
    name: /^(Ownership|All|Owned|Shared with me)$/,
  });
}

export function projectWorkflowsArchiveToggle(page: Page): Locator {
  return projectWorkflowsFilterToolbar(page).getByRole('button', { name: 'Archive', exact: true });
}

export function projectWorkflowsFavouritesToggle(page: Page): Locator {
  return projectWorkflowsFilterToolbar(page).getByRole('button', { name: 'Favourites', exact: true });
}

export function editProjectButton(page: Page): Locator {
  return page.locator('[data-test-id="edit-project-button"]');
}

export function shareProjectButton(page: Page): Locator {
  return page.locator('[data-test-id="share-button"]');
}

export function projectOverflowButton(page: Page): Locator {
  return page.locator('[data-test-id="overflow-button"]');
}

export function archiveProjectMenuItem(page: Page): Locator {
  return page.getByRole('menuitem', { name: 'Archive project', exact: true });
}

export function publishProjectButton(page: Page): Locator {
  return projectOverviewView(page).getByRole('button', { name: 'Publish project', exact: true });
}

export function createProjectDialog(page: Page): Locator {
  return page.getByRole('dialog');
}

export function createProjectFormDialogTitle(page: Page): Locator {
  return createProjectDialog(page).getByRole('heading', { name: 'Create project', exact: true });
}

export function editProjectFormDialogTitle(page: Page): Locator {
  return createProjectDialog(page).getByRole('heading', { name: 'Edit project', exact: true });
}

export function projectTitleField(page: Page): Locator {
  return createProjectDialog(page).getByRole('textbox', { name: 'Title' });
}

export function projectDescriptionField(page: Page): Locator {
  return createProjectDialog(page).getByRole('textbox', { name: 'Description' });
}

export function projectDisciplineField(page: Page): Locator {
  return createProjectDialog(page).getByLabel('Discipline');
}

export function projectFormCancelButton(page: Page): Locator {
  return createProjectDialog(page).getByRole('button', { name: 'Cancel', exact: true });
}

export function createProjectFormSubmitButton(page: Page): Locator {
  return createProjectDialog(page).getByRole('button', { name: 'Create project', exact: true });
}

export function editProjectFormSubmitButton(page: Page): Locator {
  return createProjectDialog(page).getByRole('button', { name: 'Update project', exact: true });
}

export function projectStartWithProjectAlert(page: Page): Locator {
  return createProjectDialog(page).getByText('Start by creating a project', { exact: true });
}

export function addContributorsDialog(page: Page): Locator {
  return page.getByRole('dialog').filter({ hasText: 'Add contributor' });
}

export async function waitForProjectOverviewLoaded(page: Page): Promise<void> {
  await expect(projectTitle(page)).toBeVisible({ timeout: 15_000 });
  await expect(projectOverviewTab(page)).toBeVisible();
}

export async function waitForProjectWorkflowsLoaded(page: Page): Promise<void> {
  await expect(projectWorkflowsFilterToolbar(page)).toBeVisible({ timeout: 15_000 });
  await expect(libraryLoadingSkeletons(page)).toHaveCount(0, { timeout: 15_000 });
  await expect(
    libraryCards(page)
      .first()
      .or(libraryEmptyState(page))
      .or(libraryErrorState(page)),
  ).toBeVisible({ timeout: 15_000 });
}

export async function selectProjectWorkflowSortOption(page: Page, optionLabel: string): Promise<void> {
  await projectWorkflowsSortControl(page).click();
  await sortMenuItem(page, optionLabel).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
}

export async function openCreateProjectDialog(page: Page): Promise<void> {
  await addMenuTrigger(page).click();
  await addMenuItemProject(page).click();
  await expect(createProjectDialog(page)).toBeVisible();
}

export async function openEditProjectDialog(page: Page): Promise<void> {
  await editProjectButton(page).click();
  await expect(editProjectFormDialogTitle(page)).toBeVisible({ timeout: 15_000 });
}
