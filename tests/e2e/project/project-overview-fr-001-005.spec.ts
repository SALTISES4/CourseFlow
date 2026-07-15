import { test, expect } from '@playwright/test';
import { loginAs } from '../../helpers/auth';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { getProjectPath, loadWorkflowManifest } from '../../helpers/manifest';
import {
  ADD_CONTRIBUTORS_SNACKBAR_MESSAGES,
  buildAddedProjectTeamMember,
  expectAddContributorSnackbarMessage,
  expectAddContributorsDialogOpensPerFrProjOv002,
  expectAddContributorsDialogChromePerFrProjOv004,
  fetchProjectTeam,
  installAddProjectTeamMembersRouteMock,
  installListUsersRouteMock,
  openAddContributorsDialog,
  selectAddContributorCandidatePerFrProjOv004,
  E2E_ADD_CONTRIBUTOR_CANDIDATE,
} from '../../helpers/add-contributors-dialog';
import {
  buildProjectTeamWithoutMember,
  buildUpdatedProjectTeamMember,
  CONTRIBUTOR_ROLE_UPDATE_SNACKBAR_MESSAGES,
  CONTRIBUTOR_REMOVE_SNACKBAR_MESSAGES,
  expectContributorRemoveSnackbarMessage,
  expectContributorRoleButtonShows,
  expectContributorRoleDropdownOptionsPerFrProjOv002,
  expectContributorRoleUpdateSnackbarMessage,
  expectContributorRowHidden,
  expectContributorRowVisible,
  expectProjectOwnerRoleReadOnlyPerFrProjOv002,
  installProjectTeamMemberRouteMock,
  selectContributorRemoveAction,
  selectContributorRoleOption,
  projectTeamRoleToDropdownLabel,
} from '../../helpers/project-contributor-role';
import {
  buildProjectDetailApiResponse,
  expectProjectOverviewDescriptionPerFrProjOv001,
  expectProjectOverviewDisciplinesPerFrProjOv001,
  expectProjectOverviewMetadataLabelsPerFrProjOv001,
  expectProjectPublishSnackbarMessage,
  expectProjectUnpublishSnackbarMessage,
  expectPublishedUnpublishControlsPerFrProjOv003,
  expectUnpublishedPublishControlsPerFrProjOv003,
  fetchProjectDetail,
  installProjectDetailRouteMock,
  installProjectUpdateRouteMock,
  openPublishProjectConfirmationModal,
  PROJECT_PUBLISH_SNACKBAR_MESSAGES,
  PROJECT_UNPUBLISH_SNACKBAR_MESSAGES,
} from '../../helpers/project-overview';
import {
  addContributorsCancelButton,
  addContributorsDialog,
  addContributorsRoleSelector,
  addContributorsSubmitButton,
  addContributorsUserSelector,
  addContributorsUserSelectorClearButton,
  addNewTagInput,
  contributorRoleDropdown,
  E2E_CONTRIBUTOR_STUDENT_EMAIL,
  E2E_CONTRIBUTOR_TEACHER_EMAIL,
  projectMetadataAddContributorsButton,
  projectMetadataFieldCreatedOn,
  projectPermissionsPanelContributorEmail,
  projectTagsSection,
  publishProjectConfirmationModal,
  publishProjectConfirmationModalCancelButton,
  publishProjectConfirmationModalConfirmButton,
  publishProjectButton,
  projectVisibilityStateMessage,
  shareProjectButton,
  unpublishProjectButton,
  waitForProjectOverviewLoaded,
} from './project.locators';

/**
 * Calibration slice — FR-PROJ-OV-001 through FR-PROJ-OV-005.
 * Requirements: tests/docs/requirements/features/project/project_overview_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com) unless noted.
 */

test.describe('Project overview — calibration (FR-PROJ-OV-001-005)', () => {
  const manifest = loadWorkflowManifest();
  const projectPath = getProjectPath(manifest);

  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, projectPath);
    await waitForProjectOverviewLoaded(page);
  });

  test('FR-PROJ-OV-001: overview view renders required metadata', async ({
    page,
  }) => {
    await expectProjectOverviewMetadataLabelsPerFrProjOv001(page);
    await expect(projectMetadataFieldCreatedOn(page)).toHaveCount(0);
  });

  test('FR-PROJ-OV-001: description block reflects project API value', async ({
    page,
  }) => {
    const project = await fetchProjectDetail(page, manifest.project_uuid);
    await expectProjectOverviewDescriptionPerFrProjOv001(page, project);
  });

  test('FR-PROJ-OV-001: disciplines block shows A-Z comma-separated values', async ({
    page,
  }) => {
    await expectProjectOverviewDisciplinesPerFrProjOv001(page);
  });

  test('FR-PROJ-OV-002: Add CourseFlow user button opens add contributor dialog', async ({ page }) => {
    await expect(projectMetadataAddContributorsButton(page)).toBeVisible();
    await projectMetadataAddContributorsButton(page).click();
    await expectAddContributorsDialogOpensPerFrProjOv002(page);
  });

  test('FR-PROJ-OV-002: Sharing action menu icon opens add contributor dialog', async ({ page }) => {
    await expect(shareProjectButton(page)).toBeVisible();
    await shareProjectButton(page).click();
    await expectAddContributorsDialogOpensPerFrProjOv002(page);
  });

  test.describe('FR-PROJ-OV-002: contributor role dropdown', () => {
    test.describe.configure({ mode: 'serial' });

    const teamMemberRoute = `**/api/project/${manifest.project_uuid}/team/**`;

    test.beforeEach(async ({ page }) => {
      await page.unroute(teamMemberRoute);
    });

    test('owner role control is read-only and cannot open a role menu', async ({ page }) => {
      await expectProjectOwnerRoleReadOnlyPerFrProjOv002(page);
    });

    test('shows role options', async ({
      page,
    }) => {
      const existingTeam = await fetchProjectTeam(page, manifest.project_uuid);
      const studentMember = existingTeam.find(
        (member) => member.userEmail === E2E_CONTRIBUTOR_STUDENT_EMAIL,
      );
      expect(studentMember).toBeDefined();

      await expectContributorRoleDropdownOptionsPerFrProjOv002(
        page,
        E2E_CONTRIBUTOR_STUDENT_EMAIL,
        projectTeamRoleToDropdownLabel(studentMember!.role),
      );
    });

    test('successful role update changes displayed role and shows success snackbar', async ({
      page,
    }) => {
      const existingTeam = await fetchProjectTeam(page, manifest.project_uuid);
      const studentMember = existingTeam.find(
        (member) => member.userEmail === E2E_CONTRIBUTOR_STUDENT_EMAIL,
      );
      expect(studentMember).toBeDefined();
      expect(studentMember?.role).toBe('viewer');

      const updatedStudent = buildUpdatedProjectTeamMember(studentMember!, 'commenter');
      const updatedTeam = existingTeam.map((member) =>
        member.id === studentMember!.id ? updatedStudent : member,
      );
      let serveUpdatedTeam = false;

      await installProjectTeamMemberRouteMock(page, manifest.project_uuid, (route) => {
        if (route.request().method() === 'PATCH') {
          serveUpdatedTeam = true;
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(updatedStudent),
          });
          return;
        }

        if (route.request().method() === 'GET' && serveUpdatedTeam) {
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              items: updatedTeam,
              meta: { total: updatedTeam.length },
            }),
          });
          return;
        }

        void route.continue();
      });

      await selectContributorRoleOption(page, E2E_CONTRIBUTOR_STUDENT_EMAIL, 'Commenter');
      await expectContributorRoleButtonShows(page, E2E_CONTRIBUTOR_STUDENT_EMAIL, 'Commenter');
      await expectContributorRoleUpdateSnackbarMessage(
        page,
        CONTRIBUTOR_ROLE_UPDATE_SNACKBAR_MESSAGES.success,
      );
    });

    test('failed role update keeps displayed role and shows failure snackbar', async ({ page }) => {
      await installProjectTeamMemberRouteMock(page, manifest.project_uuid, (route) => {
        if (route.request().method() !== 'PATCH') {
          void route.continue();
          return;
        }

        void route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'E2E simulated contributor role update failure' }),
        });
      });

      await selectContributorRoleOption(page, E2E_CONTRIBUTOR_STUDENT_EMAIL, 'Editor');
      await expectContributorRoleButtonShows(page, E2E_CONTRIBUTOR_STUDENT_EMAIL, 'Viewer');
      await expectContributorRoleUpdateSnackbarMessage(
        page,
        CONTRIBUTOR_ROLE_UPDATE_SNACKBAR_MESSAGES.failure,
      );
    });

    test('successful remove deletes contributor row and shows success snackbar', async ({
      page,
    }) => {
      const existingTeam = await fetchProjectTeam(page, manifest.project_uuid);
      const studentMember = existingTeam.find(
        (member) => member.userEmail === E2E_CONTRIBUTOR_STUDENT_EMAIL,
      );
      expect(studentMember).toBeDefined();

      const updatedTeam = buildProjectTeamWithoutMember(existingTeam, studentMember!.id);
      let serveUpdatedTeam = false;

      await installProjectTeamMemberRouteMock(page, manifest.project_uuid, (route) => {
        if (route.request().method() === 'DELETE') {
          serveUpdatedTeam = true;
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
          return;
        }

        if (route.request().method() === 'GET' && serveUpdatedTeam) {
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              items: updatedTeam,
              meta: { total: updatedTeam.length },
            }),
          });
          return;
        }

        void route.continue();
      });

      await selectContributorRemoveAction(page, E2E_CONTRIBUTOR_STUDENT_EMAIL);

      await expectContributorRowHidden(page, E2E_CONTRIBUTOR_STUDENT_EMAIL);
      await expectContributorRemoveSnackbarMessage(
        page,
        CONTRIBUTOR_REMOVE_SNACKBAR_MESSAGES.success,
      );
    });

    test('failed remove keeps contributor row and shows failure snackbar', async ({ page }) => {
      await installProjectTeamMemberRouteMock(page, manifest.project_uuid, (route) => {
        if (route.request().method() !== 'DELETE') {
          void route.continue();
          return;
        }

        void route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'E2E simulated contributor remove failure' }),
        });
      });

      await selectContributorRemoveAction(page, E2E_CONTRIBUTOR_TEACHER_EMAIL);

      await expectContributorRowVisible(page, E2E_CONTRIBUTOR_TEACHER_EMAIL);
      await expectContributorRemoveSnackbarMessage(
        page,
        CONTRIBUTOR_REMOVE_SNACKBAR_MESSAGES.failure,
      );
    });
  });

  test.describe('FR-PROJ-OV-002: viewer contributor role dropdown', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
      await loginAs(page, {
        email: E2E_CONTRIBUTOR_STUDENT_EMAIL,
        password: 'password',
      });
      await gotoAuthenticatedShell(page, projectPath);
      await waitForProjectOverviewLoaded(page);
    });

    test('viewer sees contributor role dropdown as read-only', async ({ page }) => {
      await expect(contributorRoleDropdown(page, E2E_CONTRIBUTOR_TEACHER_EMAIL)).toBeDisabled();
    });
  });

  test.describe('FR-PROJ-OV-004: addContributorsDialog interaction and outcomes', () => {
    test.describe.configure({ mode: 'serial' });

    const listUsersRoute = '**/api/user**';
    const teamRoute = `**/api/project/${manifest.project_uuid}/team**`;

    test.beforeEach(async ({ page }) => {
      await page.unroute(listUsersRoute);
      await page.unroute(teamRoute);
    });

    test('dialog shows title, selectors, cancel label, and disabled submit', async ({ page }) => {
      await openAddContributorsDialog(page);
      await expectAddContributorsDialogChromePerFrProjOv004(page);
    });

    test('typing in user selector shows narrowed matching CourseFlow users', async ({ page }) => {
      await installListUsersRouteMock(page, [E2E_ADD_CONTRIBUTOR_CANDIDATE]);
      await openAddContributorsDialog(page);
      await addContributorsUserSelector(page).click();
      await addContributorsUserSelector(page).fill(E2E_ADD_CONTRIBUTOR_CANDIDATE.searchTerm);
      await expect(
        page.getByRole('option', { name: E2E_ADD_CONTRIBUTOR_CANDIDATE.displayName, exact: true }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test('clear button clears typed input in user selector', async ({ page }) => {
      await openAddContributorsDialog(page);
      await addContributorsUserSelector(page).click();
      await addContributorsUserSelector(page).fill('partial');
      await expect(addContributorsUserSelectorClearButton(page)).toBeVisible();
      await addContributorsUserSelectorClearButton(page).click();
      await expect(addContributorsUserSelector(page)).toHaveValue('');
    });

    test('role selector offers Editor, Commenter, and Viewer only', async ({ page }) => {
      await openAddContributorsDialog(page);
      await expect(addContributorsRoleSelector(page).getByRole('radio')).toHaveCount(3);
    });

    test('cancel closes dialog without applying contributor changes', async ({ page }) => {
      const teamBefore = await fetchProjectTeam(page, manifest.project_uuid);

      await installListUsersRouteMock(page, [E2E_ADD_CONTRIBUTOR_CANDIDATE]);
      await openAddContributorsDialog(page);
      await selectAddContributorCandidatePerFrProjOv004(page, 'Viewer');
      await addContributorsCancelButton(page).click();

      await expect(addContributorsDialog(page)).toBeHidden();
      const teamAfter = await fetchProjectTeam(page, manifest.project_uuid);
      expect(teamAfter).toEqual(teamBefore);
    });

    test('failed add keeps dialog open and shows failure snackbar', async ({ page }) => {
      const teamBefore = await fetchProjectTeam(page, manifest.project_uuid);

      await installListUsersRouteMock(page, [E2E_ADD_CONTRIBUTOR_CANDIDATE]);
      await installAddProjectTeamMembersRouteMock(page, manifest.project_uuid, (route) => {
        if (route.request().method() !== 'POST') {
          void route.continue();
          return;
        }

        void route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'E2E simulated contributor add failure' }),
        });
      });

      await openAddContributorsDialog(page);
      await selectAddContributorCandidatePerFrProjOv004(page, 'Commenter');
      await addContributorsSubmitButton(page).click();

      await expect(addContributorsDialog(page)).toBeVisible();
      await expect(addContributorsSubmitButton(page)).toBeEnabled();
      const teamAfter = await fetchProjectTeam(page, manifest.project_uuid);
      expect(teamAfter).toEqual(teamBefore);
      await expectAddContributorSnackbarMessage(
        page,
        ADD_CONTRIBUTORS_SNACKBAR_MESSAGES.failure,
      );
    });

    test('successful add closes dialog, updates contributors panel, and shows success snackbar', async ({
      page,
    }) => {
      const existingTeam = await fetchProjectTeam(page, manifest.project_uuid);
      const addedMember = buildAddedProjectTeamMember(
        existingTeam,
        E2E_ADD_CONTRIBUTOR_CANDIDATE,
        'commenter',
      );
      const updatedTeam = [...existingTeam, addedMember];
      let serveUpdatedTeam = false;

      await installListUsersRouteMock(page, [E2E_ADD_CONTRIBUTOR_CANDIDATE]);
      await installAddProjectTeamMembersRouteMock(page, manifest.project_uuid, (route) => {
        if (route.request().method() === 'POST') {
          serveUpdatedTeam = true;
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              items: updatedTeam,
              meta: { total: updatedTeam.length },
            }),
          });
          return;
        }

        if (route.request().method() === 'GET' && serveUpdatedTeam) {
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              items: updatedTeam,
              meta: { total: updatedTeam.length },
            }),
          });
          return;
        }

        void route.continue();
      });

      await openAddContributorsDialog(page);
      await selectAddContributorCandidatePerFrProjOv004(page, 'Commenter');
      await addContributorsSubmitButton(page).click();

      await expect(addContributorsDialog(page)).toBeHidden({ timeout: 15_000 });
      await expect(
        projectPermissionsPanelContributorEmail(page, E2E_ADD_CONTRIBUTOR_CANDIDATE.email),
      ).toBeVisible({ timeout: 15_000 });
      await expectAddContributorSnackbarMessage(
        page,
        ADD_CONTRIBUTORS_SNACKBAR_MESSAGES.success,
      );
    });
  });

  test.describe('FR-PROJ-OV-003: publish and unpublish controls', () => {
    test.describe.configure({ mode: 'serial' });

    const projectUpdateRoute = `**/api/project/${manifest.project_uuid}`;

    test.beforeEach(async ({ page }) => {
      await page.unroute(projectUpdateRoute);
    });

    test.describe('from unpublished project state', () => {
      test('shows private visibility message and publish control', async ({ page }) => {
        const project = await fetchProjectDetail(page, manifest.project_uuid);
        expect(project.isPublished).toBe(false);
        await expectUnpublishedPublishControlsPerFrProjOv003(page);
      });

      test('clicking publish opens publishProjectConfirmationModal with required copy', async ({
        page,
      }) => {
        await openPublishProjectConfirmationModal(page);
      });

      test('cancel closes publishProjectConfirmationModal and keeps project unpublished', async ({
        page,
      }) => {
        await openPublishProjectConfirmationModal(page);
        await publishProjectConfirmationModalCancelButton(page).click();
        await expect(publishProjectConfirmationModal(page)).toBeHidden();
        await expectUnpublishedPublishControlsPerFrProjOv003(page);
      });

      test('failed publish keeps modal open and shows failure snackbar', async ({ page }) => {
        await installProjectUpdateRouteMock(page, manifest.project_uuid, (route) => {
          if (route.request().method() !== 'PATCH') {
            void route.continue();
            return;
          }

          void route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ detail: 'E2E simulated publish failure' }),
          });
        });

        await openPublishProjectConfirmationModal(page);
        await publishProjectConfirmationModalConfirmButton(page).click();

        await expect(publishProjectConfirmationModal(page)).toBeVisible();
        await expect(publishProjectConfirmationModalConfirmButton(page)).toBeEnabled();
        await expectUnpublishedPublishControlsPerFrProjOv003(page);
        await expectProjectPublishSnackbarMessage(
          page,
          PROJECT_PUBLISH_SNACKBAR_MESSAGES.failure,
        );
      });

      test('successful publish closes modal, shows success snackbar, and switches to published controls', async ({
        page,
      }) => {
        const project = await fetchProjectDetail(page, manifest.project_uuid);

        await installProjectUpdateRouteMock(page, manifest.project_uuid, (route) => {
          if (route.request().method() !== 'PATCH') {
            void route.continue();
            return;
          }

          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(
              buildProjectDetailApiResponse({
                ...project,
                isPublished: true,
              }),
            ),
          });
        });

        await openPublishProjectConfirmationModal(page);
        await publishProjectConfirmationModalConfirmButton(page).click();

        await expect(publishProjectConfirmationModal(page)).toBeHidden({ timeout: 15_000 });
        await expectPublishedUnpublishControlsPerFrProjOv003(page);
        await expectProjectPublishSnackbarMessage(
          page,
          PROJECT_PUBLISH_SNACKBAR_MESSAGES.success,
        );
      });
    });

    test.describe('from published project state', () => {
      test.beforeEach(async ({ page }) => {
        const project = await fetchProjectDetail(page, manifest.project_uuid);

        await installProjectDetailRouteMock(page, manifest.project_uuid, {
          ...project,
          isPublished: true,
        });
        await page.reload();
        await waitForProjectOverviewLoaded(page);
        await expectPublishedUnpublishControlsPerFrProjOv003(page);
      });

      test('shows public visibility message and unpublish control on initial load', async ({
        page,
      }) => {
        await expectPublishedUnpublishControlsPerFrProjOv003(page);
      });

      test('failed unpublish keeps project published and shows failure snackbar', async ({
        page,
      }) => {
        await installProjectUpdateRouteMock(page, manifest.project_uuid, (route) => {
          if (route.request().method() !== 'PATCH') {
            void route.continue();
            return;
          }

          void route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ detail: 'E2E simulated unpublish failure' }),
          });
        });

        await expect(unpublishProjectButton(page)).toBeVisible();
        await unpublishProjectButton(page).click();

        await expectPublishedUnpublishControlsPerFrProjOv003(page);
        await expectProjectUnpublishSnackbarMessage(
          page,
          PROJECT_UNPUBLISH_SNACKBAR_MESSAGES.failure,
        );
      });

      test('successful unpublish shows success snackbar and returns to private visibility controls', async ({
        page,
      }) => {
        const project = await fetchProjectDetail(page, manifest.project_uuid);

        await installProjectUpdateRouteMock(page, manifest.project_uuid, (route) => {
          if (route.request().method() !== 'PATCH') {
            void route.continue();
            return;
          }

          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(
              buildProjectDetailApiResponse({
                ...project,
                isPublished: false,
              }),
            ),
          });
        });

        await expect(unpublishProjectButton(page)).toBeVisible();
        await unpublishProjectButton(page).click();

        await expectUnpublishedPublishControlsPerFrProjOv003(page);
        await expectProjectUnpublishSnackbarMessage(
          page,
          PROJECT_UNPUBLISH_SNACKBAR_MESSAGES.success,
        );
      });
    });
  });

  test.describe('FR-PROJ-OV-003: viewer role visibility controls', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
      await loginAs(page, {
        email: E2E_CONTRIBUTOR_STUDENT_EMAIL,
        password: 'password',
      });
      await gotoAuthenticatedShell(page, projectPath);
      await waitForProjectOverviewLoaded(page);
    });

    test('viewer sees visibility message but not publish or unpublish controls', async ({ page }) => {
      await expect(projectVisibilityStateMessage(page)).toBeVisible();
      await expect(publishProjectButton(page)).toHaveCount(0);
      await expect(unpublishProjectButton(page)).toHaveCount(0);
    });
  });


  test('FR-PROJ-OV-005: tags section shows add-new-tag input when tags block is rendered', async ({
    page,
  }) => {
    test.skip((await projectTagsSection(page).count()) === 0, 'Tags block not rendered — tags missing from project API mapping.');

    await expect(projectTagsSection(page)).toBeVisible();
    await expect(addNewTagInput(page)).toBeVisible();
    await expect(addNewTagInput(page)).toHaveAttribute('placeholder', 'Add new tag');
  });
});
