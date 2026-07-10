import { expect, type Page, type Route } from '@playwright/test';

import {
  CONTRIBUTOR_ROLE_DROPDOWN_OPTIONS,
  CONTRIBUTOR_ROLE_DROPDOWN_REMOVE_ACTION,
  CONTRIBUTOR_ROLE_UPDATE_SNACKBAR_MESSAGES,
  CONTRIBUTOR_REMOVE_SNACKBAR_MESSAGES,
  contributorRemoveDialog,
  contributorRemoveDialogCancelButton,
  contributorRemoveDialogConfirmButton,
  contributorRoleDropdown,
  contributorRoleMenuItem,
  globalMessageSnackbar,
  projectContributorRow,
  projectPermissionsPanelContributorEmail,
  projectTeamMemberApiRoute,
} from '../e2e/project/project.locators';
import { fetchProjectTeam, type ProjectTeamApiItem } from './add-contributors-dialog';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function openContributorRoleDropdown(
  page: Page,
  contributorEmail: string,
): Promise<void> {
  await expect(contributorRoleDropdown(page, contributorEmail)).toBeVisible();
  await contributorRoleDropdown(page, contributorEmail).click();
  await expect(page.getByRole('menu')).toBeVisible();
}

export async function closeContributorRoleMenu(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
}

export function projectTeamRoleToDropdownLabel(
  role: string,
): (typeof CONTRIBUTOR_ROLE_DROPDOWN_OPTIONS)[number] {
  switch (role) {
    case 'editor':
      return 'Editor';
    case 'commenter':
      return 'Commenter';
    case 'viewer':
      return 'Viewer';
    default:
      throw new Error(`Unsupported project team role for dropdown label: ${role}`);
  }
}

/** FR-PROJ-OV-002 — contributorRoleDropdown shows roles with current role disabled. */
export async function expectContributorRoleDropdownOptionsPerFrProjOv002(
  page: Page,
  contributorEmail: string,
  currentRole: (typeof CONTRIBUTOR_ROLE_DROPDOWN_OPTIONS)[number],
): Promise<void> {
  await openContributorRoleDropdown(page, contributorEmail);

  for (const role of CONTRIBUTOR_ROLE_DROPDOWN_OPTIONS) {
    const menuItem = contributorRoleMenuItem(page, role);
    await expect(menuItem).toBeVisible();
    if (role === currentRole) {
      await expect(menuItem).toBeDisabled();
    } else {
      await expect(menuItem).toBeEnabled();
    }
  }

  const removeAction = contributorRoleMenuItem(page, CONTRIBUTOR_ROLE_DROPDOWN_REMOVE_ACTION);
  await expect(removeAction).toBeVisible();
  await expect(removeAction).toBeEnabled();
  await closeContributorRoleMenu(page);
}

export async function selectContributorRoleOption(
  page: Page,
  contributorEmail: string,
  role: (typeof CONTRIBUTOR_ROLE_DROPDOWN_OPTIONS)[number],
): Promise<void> {
  await openContributorRoleDropdown(page, contributorEmail);
  await contributorRoleMenuItem(page, role).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
}

export async function selectContributorRemoveAction(
  page: Page,
  contributorEmail: string,
): Promise<void> {
  await openContributorRoleDropdown(page, contributorEmail);
  await contributorRoleMenuItem(page, CONTRIBUTOR_ROLE_DROPDOWN_REMOVE_ACTION).click();
  await expect(contributorRemoveDialog(page)).toBeVisible();
}

export async function expectContributorRoleButtonShows(
  page: Page,
  contributorEmail: string,
  roleLabel: string,
): Promise<void> {
  await expect(contributorRoleDropdown(page, contributorEmail)).toHaveText(
    new RegExp(`^${escapeRegExp(roleLabel)}`),
  );
}

export async function expectContributorRoleUpdateSnackbarMessage(
  page: Page,
  message: string,
): Promise<void> {
  await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
  await expect(globalMessageSnackbar(page)).toHaveText(message, { exact: true });
}

export async function expectContributorRemoveSnackbarMessage(
  page: Page,
  message: string,
): Promise<void> {
  await expectContributorRoleUpdateSnackbarMessage(page, message);
}

export async function installProjectTeamMemberRouteMock(
  page: Page,
  projectUuid: string,
  handler: (route: Route) => Promise<void> | void,
): Promise<void> {
  await page.route(projectTeamMemberApiRoute(projectUuid), handler);
}

export function buildUpdatedProjectTeamMember(
  member: ProjectTeamApiItem,
  role: string,
): ProjectTeamApiItem {
  return {
    ...member,
    role,
  };
}

export function buildProjectTeamWithoutMember(
  members: ProjectTeamApiItem[],
  membershipId: number,
): ProjectTeamApiItem[] {
  return members.filter((member) => member.id !== membershipId);
}

export async function expectContributorRowHidden(
  page: Page,
  contributorEmail: string,
): Promise<void> {
  await expect(projectContributorRow(page, contributorEmail)).toHaveCount(0);
}

export async function expectContributorRowVisible(
  page: Page,
  contributorEmail: string,
): Promise<void> {
  await expect(projectPermissionsPanelContributorEmail(page, contributorEmail)).toBeVisible();
}

export {
  CONTRIBUTOR_ROLE_DROPDOWN_REMOVE_ACTION,
  CONTRIBUTOR_ROLE_UPDATE_SNACKBAR_MESSAGES,
  CONTRIBUTOR_REMOVE_SNACKBAR_MESSAGES,
};
