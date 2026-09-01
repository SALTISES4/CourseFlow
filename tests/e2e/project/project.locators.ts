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
  libraryResultsProjectCards,
  libraryResultsWorkflowCards,
  ownershipFilterResetButton,
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
  libraryResultsProjectCards as projectWorkflowsResultsProjectCards,
  libraryResultsWorkflowCards as projectWorkflowsResultsWorkflowCards,
  selectFilterOption,
};

export { globalMessageSnackbar } from '../../shared/locators/global';

export const PROJECT_CREATE_FORM_VISIBLE_LABELS = {
  title: 'Title',
  description: 'Description',
  disciplines: 'Discipline',
} as const;
export const PROJECT_CREATE_FORM_REQUIRED_FIELD_LABELS = [
  PROJECT_CREATE_FORM_VISIBLE_LABELS.title,
] as const;
export const PROJECT_START_WITH_PROJECT_ALERT_COPY = {
  title: 'Start by creating a project',
  subtitle:
    'All workflows, whether they are programs, courses, or activities, exist within projects. You must start by creating a project before proceeding to create any type of workflow.',
} as const;
export const PROJECT_FORM_VALIDATION_MESSAGES = {
  titleRequired: 'Project title cannot be empty',
  titleMaxLength: 'Project title cannot be longer than 200 characters',
} as const;
export const PROJECT_CREATE_SNACKBAR_MESSAGES = {
  success: 'Your project has been successfully created',
  failure: 'We encountered an issue and your project was not created',
} as const;
export const PROJECT_EDIT_SNACKBAR_MESSAGES = {
  success: 'Your project has been successfully updated',
  failure: 'We encountered an issue and your project was not updated',
} as const;
export const PROJECT_CREATE_API_ROUTE = '**/api/project';
/** Primary E2E actor — teacher account and owner of fixture projects. */
export const E2E_PRIMARY_TEACHER_EMAIL = 'teacher@courseflow.com';
/** Non-admin editor contributor on the primary fixture project. */
export const E2E_CONTRIBUTOR_EDITOR_EMAIL = 'editor@courseflow.com';
/** Non-admin commenter contributor on the primary fixture project. */
export const E2E_CONTRIBUTOR_COMMENTER_EMAIL = 'commenter@courseflow.com';

export const PROJECT_OVERVIEW_METADATA_LABELS = {
  description: 'Description',
  disciplines: 'Disciplines',
  contributors: 'Contributors',
  tags: 'Tags',
} as const;
/** Displayed value when description or disciplines are empty per FR-PROJ-OV-001. */
export const PROJECT_OVERVIEW_EMPTY_METADATA_VALUE = '-';
/** Date metadata is out of scope for project overview per FR-PROJ-OV-001. */
export const PROJECT_OVERVIEW_FORBIDDEN_METADATA_LABELS = ['Created on'] as const;

export const PROJECT_VISIBILITY_STATE_MESSAGES = {
  private: 'The project is currently private',
  public: 'The project is currently public',
} as const;
export const PROJECT_PUBLISH_SNACKBAR_MESSAGES = {
  success: 'Your project has been successfully published',
  failure: 'We encountered an issue and your project was not published',
} as const;
export const PROJECT_UNPUBLISH_SNACKBAR_MESSAGES = {
  success: 'Your project has been successfully unpublished',
  failure: 'We encountered an issue and your project was not unpublished',
} as const;
/** FIGMA-PROJ-OV-PUBLISH-PROJECT-MODAL — FR-PROJ-OV-003 */
export const PROJECT_PUBLISH_CONFIRMATION_MODAL_COPY = {
  title: 'Publish project',
  body: 'Publishing this project will make all associated workflows visible to all CourseFlow users. Are you ready to share this content?',
  cancelButton: 'Cancel',
  confirmButton: 'Publish project',
} as const;
export const PROJECT_UPDATE_API_ROUTE = '**/api/project/*';
/** E2E seed contributor — viewer on fixture project (FR-PROJ-OV-003 roleBehavior). */
export const E2E_CONTRIBUTOR_STUDENT_EMAIL = 'student@courseflow.com';

/** FR-PROJ-OV-002 — contributorRoleDropdown assignable roles and 'Remove contributor' option. */
export const CONTRIBUTOR_ROLE_DROPDOWN_OPTIONS = ['Editor', 'Commenter', 'Viewer'] as const;
export const CONTRIBUTOR_ROLE_DROPDOWN_REMOVE_ACTION = 'Remove contributor';
export const CONTRIBUTOR_ROLE_UPDATE_SNACKBAR_MESSAGES = {
  success: "The contributor's role was successfully updated",
  failure: "We encountered an issue and the contributor's role was not updated",
} as const;
export const CONTRIBUTOR_REMOVE_SNACKBAR_MESSAGES = {
  success: 'The contributor was successfully removed from your project',
  failure: 'We encountered an issue and the contributor was not removed from your project',
} as const;

export function projectTeamMemberApiRoute(projectUuid: string): string {
  return `**/api/project/${projectUuid}/team/**`;
}

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

/** canonical: projectLoadingIndicator — full project-view loader during route identity changes */
export function projectLoadingIndicator(page: Page): Locator {
  return page.locator('#container > .load-screen');
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
  return projectOverviewView(page).getByText(PROJECT_OVERVIEW_METADATA_LABELS.description, {
    exact: true,
  });
}

export function projectMetadataFieldDisciplines(page: Page): Locator {
  return projectOverviewView(page).getByText(PROJECT_OVERVIEW_METADATA_LABELS.disciplines, {
    exact: true,
  });
}

/** Metadata info block containing a label and its displayed value. */
export function projectMetadataBlock(page: Page, label: string): Locator {
  return projectOverviewView(page).getByText(label, { exact: true }).locator('..');
}

export function projectMetadataFieldCreatedOn(page: Page): Locator {
  return projectOverviewView(page).getByText('Created on', { exact: true }).first();
}

/** @deprecated Use projectMetadataBlock(page, 'Disciplines') — kept for existing imports. */
export function projectMetadataDisciplinesBlock(page: Page): Locator {
  return projectMetadataBlock(page, PROJECT_OVERVIEW_METADATA_LABELS.disciplines);
}

export function projectMetadataPermissionsPanel(page: Page): Locator {
  return projectOverviewView(page).getByText(PROJECT_OVERVIEW_METADATA_LABELS.contributors, {
    exact: true,
  });
}

export function projectMetadataAddContributorsButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Add CourseFlow user', exact: true });
}

/** Contributor row in projectMetadataPermissionsPanel, located by email. */
export function projectContributorRow(page: Page, contributorEmail: string): Locator {
  return projectOverviewView(page)
    .getByRole('listitem')
    .filter({ has: page.getByText(contributorEmail, { exact: true }) });
}

/** FR-PROJ-OV-002 — read-only Owner control on the project owner row (not contributorRoleDropdown). */
export const PROJECT_OWNER_ROLE_LABEL = 'Owner';

export function projectOwnerRoleControl(page: Page): Locator {
  return projectOverviewView(page).getByRole('button', {
    name: PROJECT_OWNER_ROLE_LABEL,
    exact: true,
  });
}

/** canonical: contributorRoleDropdown — role menu on a contributor row. */
export function contributorRoleDropdown(page: Page, contributorEmail: string): Locator {
  return projectContributorRow(page, contributorEmail).getByRole('button').last();
}

export function contributorRoleMenuItem(page: Page, optionLabel: string): Locator {
  if (optionLabel === CONTRIBUTOR_ROLE_DROPDOWN_REMOVE_ACTION) {
    return page.getByRole('menuitem', { name: optionLabel, exact: true });
  }

  return page.getByRole('menuitem', { name: new RegExp(`^${optionLabel}`) });
}

export function projectTagsSection(page: Page): Locator {
  return projectOverviewView(page).getByText(PROJECT_OVERVIEW_METADATA_LABELS.tags, {
    exact: true,
  });
}

export function addNewTagInput(page: Page): Locator {
  return page.getByPlaceholder('Add new tag');
}

/** canonical: projectTagItem — existing tag row identified by its label value */
export function projectTagItemByLabel(page: Page, label: string): Locator {
  return page.locator(`input[value=${JSON.stringify(label)}]`);
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
  // Active state includes nested close control in the accessible name ("Owned close").
  return projectWorkflowsFilterToolbar(page).getByRole('button', {
    name: /^(Ownership|All|Owned|Shared( with me)?)/,
  });
}

export function projectWorkflowsOwnershipFilterResetButton(page: Page): Locator {
  return ownershipFilterResetButton(page, projectWorkflowsOwnershipFilter(page));
}

export function projectWorkflowsArchiveToggle(page: Page): Locator {
  return projectWorkflowsFilterToolbar(page).getByRole('button', { name: 'Archive', exact: true });
}

export function projectWorkflowsFavouritesToggle(page: Page): Locator {
  return projectWorkflowsFilterToolbar(page).getByRole('button', { name: 'Favourites', exact: true });
}

export { workflowTypeFilter as projectWorkflowsWorkflowTypeFilter } from '../../shared/locators/library';

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

export const PROJECT_ARCHIVE_CONFIRMATION_MODAL_COPY = {
  title: 'Archive project',
  body: 'Once your project is archived, it cannot be opened from the workspace. You can restore it from your archived library items.',
  cancelButton: 'Cancel',
  confirmButton: 'Archive project',
} as const;

export function archiveProjectConfirmationModal(page: Page): Locator {
  return page.getByRole('dialog').filter({
    has: page.getByRole('heading', {
      name: PROJECT_ARCHIVE_CONFIRMATION_MODAL_COPY.title,
      exact: true,
    }),
  });
}

export function archiveProjectConfirmationModalCancelButton(page: Page): Locator {
  return archiveProjectConfirmationModal(page).getByRole('button', {
    name: PROJECT_ARCHIVE_CONFIRMATION_MODAL_COPY.cancelButton,
    exact: true,
  });
}

export function archiveProjectConfirmationModalConfirmButton(page: Page): Locator {
  return archiveProjectConfirmationModal(page).getByRole('button', {
    name: PROJECT_ARCHIVE_CONFIRMATION_MODAL_COPY.confirmButton,
    exact: true,
  });
}

export function publishProjectButton(page: Page): Locator {
  return projectOverviewView(page).getByRole('button', { name: 'Publish project', exact: true });
}

export function unpublishProjectButton(page: Page): Locator {
  return projectOverviewView(page).getByRole('button', { name: 'Unpublish project', exact: true });
}

export function projectVisibilityStateMessage(page: Page): Locator {
  return projectOverviewView(page).getByText(
    new RegExp(
      `^(${PROJECT_VISIBILITY_STATE_MESSAGES.private}|${PROJECT_VISIBILITY_STATE_MESSAGES.public})$`,
    ),
  );
}

export function publishProjectConfirmationModal(page: Page): Locator {
  return page.getByRole('dialog').filter({
    has: page.getByRole('heading', {
      name: PROJECT_PUBLISH_CONFIRMATION_MODAL_COPY.title,
      exact: true,
    }),
  });
}

export function publishProjectConfirmationModalCancelButton(page: Page): Locator {
  return publishProjectConfirmationModal(page).getByRole('button', {
    name: PROJECT_PUBLISH_CONFIRMATION_MODAL_COPY.cancelButton,
    exact: true,
  });
}

export function publishProjectConfirmationModalConfirmButton(page: Page): Locator {
  return publishProjectConfirmationModal(page).getByRole('button', {
    name: PROJECT_PUBLISH_CONFIRMATION_MODAL_COPY.confirmButton,
    exact: true,
  });
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

export function projectForm(page: Page): Locator {
  return createProjectDialog(page).locator('form');
}

export function projectTitleField(page: Page): Locator {
  // Required Title includes MUI FormLabel asterisk (U+2009 + '*') in the accessible name.
  return createProjectDialog(page).getByLabel(
    new RegExp(
      `^${escapeRegExp(PROJECT_CREATE_FORM_VISIBLE_LABELS.title)}([\\s\\u2009]*\\*)?$`,
    ),
  );
}

export function projectDescriptionField(page: Page): Locator {
  return createProjectDialog(page).getByLabel(PROJECT_CREATE_FORM_VISIBLE_LABELS.description, {
    exact: true,
  });
}

export function projectDisciplineField(page: Page): Locator {
  return createProjectDialog(page).getByLabel(PROJECT_CREATE_FORM_VISIBLE_LABELS.disciplines, {
    exact: true,
  });
}

/** Visible label text on projectForm (not accessibility-name inference). */
export function projectFormVisibleLabel(page: Page, label: string): Locator {
  // MUI required markers use U+2009 thin space before '*', not a regular space.
  return projectForm(page).locator('label').filter({
    hasText: new RegExp(`^${escapeRegExp(label)}([\\s\\u2009]*\\*)?$`),
  });
}

/** FR-PROJ-FORM-001 — required fields show MUI mandatory asterisk (Figma / FormLabel). */
export function projectFormRequiredFieldLabel(page: Page, label: string): Locator {
  return projectForm(page)
    .locator('label')
    .filter({ hasText: new RegExp(`^${escapeRegExp(label)}`) })
    .filter({ has: page.locator('.MuiFormLabel-asterisk') });
}

export function projectFormFieldValidationMessage(page: Page, message: string): Locator {
  return createProjectDialog(page).getByText(message, { exact: true });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  return createProjectDialog(page).getByText(PROJECT_START_WITH_PROJECT_ALERT_COPY.title, {
    exact: true,
  });
}

export function projectStartWithProjectAlertRegion(page: Page): Locator {
  return createProjectDialog(page).getByRole('alert');
}

export function addContributorsDialog(page: Page): Locator {
  return page.getByRole('dialog').filter({ hasText: 'Add contributor' });
}

/** FR-PROJ-OV-004 — dialog copy and control labels per project_overview_requirements_v1.yaml */
export const ADD_CONTRIBUTORS_DIALOG_COPY = {
  title: 'Add contributor',
  userSelectorLabel: 'CourseFlow users',
  roleLabel: 'Role',
  cancelButton: 'Cancel',
  submitButton: 'Add contributor',
} as const;
export const ADD_CONTRIBUTORS_ASSIGNABLE_ROLES = ['Editor', 'Commenter', 'Viewer'] as const;
export const ADD_CONTRIBUTORS_SNACKBAR_MESSAGES = {
  success: 'The contributor was successfully added to your project',
  failure: 'We encountered an issue and the contributor could not be added to your project',
} as const;
export const E2E_ADD_CONTRIBUTOR_CANDIDATE = {
  email: 'commenter@courseflow.com',
  displayName: 'testcommenter Commenter',
  searchTerm: 'commenter@courseflow.com',
} as const;
export function projectTeamApiRoute(projectUuid: string): string {
  return `**/api/project/${projectUuid}/team**`;
}

export function addContributorsDialogTitle(page: Page): Locator {
  return addContributorsDialog(page).getByRole('heading', {
    name: ADD_CONTRIBUTORS_DIALOG_COPY.title,
    exact: true,
  });
}

export function addContributorsUserSelector(page: Page): Locator {
  return addContributorsDialog(page).getByLabel(ADD_CONTRIBUTORS_DIALOG_COPY.userSelectorLabel, {
    exact: true,
  });
}

export function addContributorsRoleSelector(page: Page): Locator {
  return addContributorsDialog(page).getByRole('radiogroup', {
    name: ADD_CONTRIBUTORS_DIALOG_COPY.roleLabel,
    exact: true,
  });
}

export function addContributorsSubmitButton(page: Page): Locator {
  return addContributorsDialog(page).getByRole('button', {
    name: ADD_CONTRIBUTORS_DIALOG_COPY.submitButton,
    exact: true,
  });
}

export function addContributorsCancelButton(page: Page): Locator {
  return addContributorsDialog(page).getByRole('button', {
    name: ADD_CONTRIBUTORS_DIALOG_COPY.cancelButton,
    exact: true,
  });
}

export function addContributorsUserSelectorClearButton(page: Page): Locator {
  return addContributorsDialog(page).getByRole('button', { name: 'Clear', exact: true });
}

export function projectPermissionsPanelContributorEmail(page: Page, email: string): Locator {
  return projectOverviewView(page).getByText(email, { exact: true });
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
