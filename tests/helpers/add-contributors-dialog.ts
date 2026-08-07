import { expect, type Page, type Route } from '@playwright/test';

import { authenticatedApiRequest } from './api';

import {
  ADD_CONTRIBUTORS_ASSIGNABLE_ROLES,
  ADD_CONTRIBUTORS_DIALOG_COPY,
  ADD_CONTRIBUTORS_SNACKBAR_MESSAGES,
  addContributorsCancelButton,
  addContributorsDialog,
  addContributorsDialogTitle,
  addContributorsRoleSelector,
  addContributorsSubmitButton,
  addContributorsUserSelector,
  addContributorsUserSelectorClearButton,
  E2E_ADD_CONTRIBUTOR_CANDIDATE,
  globalMessageSnackbar,
  projectMetadataAddContributorsButton,
  projectPermissionsPanelContributorEmail,
  projectTeamApiRoute,
} from '../e2e/project/project.locators';

export type ProjectTeamApiItem = {
  id: number;
  projectTeamUuid: string;
  userUuid: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  role: string;
};

export async function expectAddContributorsDialogOpensPerFrProjOv002(page: Page): Promise<void> {
  await expect(addContributorsDialog(page)).toBeVisible();
  await expect(addContributorsDialogTitle(page)).toBeVisible();
}

export async function openAddContributorsDialog(page: Page): Promise<void> {
  await expect(projectMetadataAddContributorsButton(page)).toBeVisible();
  await projectMetadataAddContributorsButton(page).click();
  await expectAddContributorsDialogOpensPerFrProjOv002(page);
}

/** FR-PROJ-OV-004 — dialog title, selectors, cancel label, and disabled submit with no selection. */
export async function expectAddContributorsDialogChromePerFrProjOv004(page: Page): Promise<void> {
  await expect(addContributorsDialog(page)).toBeVisible();
  await expect(addContributorsDialogTitle(page)).toBeVisible();
  await expect(addContributorsUserSelector(page)).toBeVisible();
  await expect(addContributorsRoleSelector(page)).toBeVisible();
  await expect(addContributorsCancelButton(page)).toBeVisible();
  await expect(addContributorsSubmitButton(page)).toBeDisabled();

  for (const role of ADD_CONTRIBUTORS_ASSIGNABLE_ROLES) {
    await expect(
      addContributorsRoleSelector(page).getByRole('radio', {
        name: role,
        exact: true,
      }),
    ).toBeVisible();
  }
}

export async function fetchProjectTeam(
  page: Page,
  projectUuid: string,
): Promise<ProjectTeamApiItem[]> {
  const path = `/api/project/${projectUuid}/team`;
  const response = await authenticatedApiRequest(page, 'GET', path);
  expect(response.ok(), `${path} returned HTTP ${response.status()}`).toBeTruthy();
  const body = (await response.json()) as { items: ProjectTeamApiItem[] };
  return body.items;
}

export async function installAddProjectTeamMembersRouteMock(
  page: Page,
  projectUuid: string,
  handler: (route: Route) => Promise<void> | void,
): Promise<void> {
  await page.route(projectTeamApiRoute(projectUuid), handler);
}

export async function searchAddContributorsUser(
  page: Page,
  searchTerm: string,
  optionName: string,
): Promise<void> {
  await addContributorsUserSelector(page).click();
  await addContributorsUserSelector(page).fill(searchTerm);
  await expect(page.getByRole('option', { name: optionName, exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await page.getByRole('option', { name: optionName, exact: true }).click();
}

export async function selectAddContributorsRole(page: Page, role: string): Promise<void> {
  await addContributorsRoleSelector(page).getByRole('radio', { name: role, exact: true }).check();
}

export async function selectAddContributorCandidatePerFrProjOv004(
  page: Page,
  role: (typeof ADD_CONTRIBUTORS_ASSIGNABLE_ROLES)[number] = 'Commenter',
): Promise<void> {
  await searchAddContributorsUser(
    page,
    E2E_ADD_CONTRIBUTOR_CANDIDATE.searchTerm,
    E2E_ADD_CONTRIBUTOR_CANDIDATE.displayName,
  );
  await selectAddContributorsRole(page, role);
  await expect(addContributorsSubmitButton(page)).toBeEnabled();
}

export async function expectAddContributorSnackbarMessage(
  page: Page,
  message: string,
): Promise<void> {
  await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
  await expect(globalMessageSnackbar(page)).toHaveText(message, {
    exact: true,
  });
}

export {
  ADD_CONTRIBUTORS_DIALOG_COPY,
  ADD_CONTRIBUTORS_SNACKBAR_MESSAGES,
  E2E_ADD_CONTRIBUTOR_CANDIDATE,
};
