import { test, expect } from '../../fixtures';
import { loginAs } from '../../helpers/auth';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import { getProjectPath, loadWorkflowManifest } from '../../helpers/manifest';
import {
  ADD_CONTRIBUTORS_SNACKBAR_MESSAGES,
  expectAddContributorSnackbarMessage,
  expectAddContributorsDialogOpensPerFrProjOv002,
  expectAddContributorsDialogChromePerFrProjOv004,
  fetchProjectTeam,
  installAddProjectTeamMembersRouteMock,
  openAddContributorsDialog,
  selectAddContributorCandidatePerFrProjOv004,
  E2E_ADD_CONTRIBUTOR_CANDIDATE,
} from '../../helpers/add-contributors-dialog';
import {
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
  expectProjectOverviewDescriptionPerFrProjOv001,
  expectProjectOverviewDisciplinesPerFrProjOv001,
  expectProjectOverviewMetadataLabelsPerFrProjOv001,
  expectProjectPublishSnackbarMessage,
  expectProjectUnpublishSnackbarMessage,
  expectPublishedUnpublishControlsPerFrProjOv003,
  expectUnpublishedPublishControlsPerFrProjOv003,
  fetchProjectDetail,
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
  E2E_CONTRIBUTOR_EDITOR_EMAIL,
  E2E_CONTRIBUTOR_STUDENT_EMAIL,
  projectMetadataAddContributorsButton,
  projectMetadataFieldCreatedOn,
  projectPermissionsPanelContributorEmail,
  projectTitle,
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

test.use({
  seedDependencies: [
    'actor.teacher',
    'actor.editor',
    'actor.commenter',
    'actor.viewer',
    'project.primary',
  ],
});

/**
 * Calibration slice — FR-PROJ-OV-001 through FR-PROJ-OV-005.
 * Requirements: tests/docs/requirements/features/project/project_overview_requirements_v1.yaml
 * Auth: chromium project storage state (teacher@courseflow.com) unless noted.
 */

test.describe('Project overview — calibration (FR-PROJ-OV-001-005)', () => {
  const manifest = loadWorkflowManifest();
  const projectPath = getProjectPath(manifest);

  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, projectPath);
    const loginButton = page.getByRole('button', { name: /^Login$/i });
    await expect(projectTitle(page).or(loginButton)).toBeVisible({
      timeout: 15_000,
    });
    if (await loginButton.isVisible()) {
      // Explicit-role describes start with empty storage and log in from their
      // nested hook. Parent hooks run first, so leave authentication to them.
      return;
    }
    await waitForProjectOverviewLoaded(page);
  });

  test('FR-PROJ-OV-001: overview view renders required metadata', async ({ page }) => {
    await expectProjectOverviewMetadataLabelsPerFrProjOv001(page);
    await expect(projectMetadataFieldCreatedOn(page)).toHaveCount(0);
  });

  test('FR-PROJ-OV-001: description block reflects project API value', async ({ page }) => {
    const project = await fetchProjectDetail(page, manifest.project_uuid);
    await expectProjectOverviewDescriptionPerFrProjOv001(page, project);
  });

  test('FR-PROJ-OV-001: disciplines block shows A-Z comma-separated values', async ({ page }) => {
    await expectProjectOverviewDisciplinesPerFrProjOv001(page);
  });

  test('FR-PROJ-OV-002: Add CourseFlow user button opens add contributor dialog', async ({
    page,
  }) => {
    await expect(projectMetadataAddContributorsButton(page)).toBeVisible();
    await projectMetadataAddContributorsButton(page).click();
    await expectAddContributorsDialogOpensPerFrProjOv002(page);
  });

  test('FR-PROJ-OV-002: Sharing action menu icon opens add contributor dialog', async ({
    page,
  }) => {
    await expect(shareProjectButton(page)).toBeVisible();
    await shareProjectButton(page).click();
    await expectAddContributorsDialogOpensPerFrProjOv002(page);
  });

  test.describe('FR-PROJ-OV-002: contributor role dropdown', () => {
    test.use({
      projectAccess: 'disposable',
      projectContributors: {
        'actor.editor': 'editor',
        'actor.viewer': 'viewer',
      },
    });

    test.beforeEach(async ({ page, project }) => {
      await gotoAuthenticatedShell(page, project.path);
      await waitForProjectOverviewLoaded(page);
    });

    test('owner role control is read-only and cannot open a role menu', async ({ page }) => {
      await expectProjectOwnerRoleReadOnlyPerFrProjOv002(page);
    });

    test('shows role options', async ({ page, project }) => {
      const existingTeam = await fetchProjectTeam(page, project.uuid);
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
      project,
    }) => {
      const existingTeam = await fetchProjectTeam(page, project.uuid);
      const studentMember = existingTeam.find(
        (member) => member.userEmail === E2E_CONTRIBUTOR_STUDENT_EMAIL,
      );
      expect(studentMember).toBeDefined();
      expect(studentMember?.role).toBe('viewer');

      await selectContributorRoleOption(page, E2E_CONTRIBUTOR_STUDENT_EMAIL, 'Commenter');
      await expectContributorRoleButtonShows(page, E2E_CONTRIBUTOR_STUDENT_EMAIL, 'Commenter');
      await expectContributorRoleUpdateSnackbarMessage(
        page,
        CONTRIBUTOR_ROLE_UPDATE_SNACKBAR_MESSAGES.success,
      );

      const persistedTeam = await fetchProjectTeam(page, project.uuid);
      expect(persistedTeam.find((member) => member.id === studentMember!.id)?.role).toBe(
        'commenter',
      );
    });

    test('failed role update keeps displayed role and shows failure snackbar', async ({
      page,
      project,
    }) => {
      await installProjectTeamMemberRouteMock(page, project.uuid, (route) => {
        if (route.request().method() !== 'PATCH') {
          void route.continue();
          return;
        }

        void route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'E2E simulated contributor role update failure',
          }),
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
      project,
    }) => {
      const existingTeam = await fetchProjectTeam(page, project.uuid);
      const studentMember = existingTeam.find(
        (member) => member.userEmail === E2E_CONTRIBUTOR_STUDENT_EMAIL,
      );
      expect(studentMember).toBeDefined();

      await selectContributorRemoveAction(page, E2E_CONTRIBUTOR_STUDENT_EMAIL);

      await expectContributorRowHidden(page, E2E_CONTRIBUTOR_STUDENT_EMAIL);
      await expectContributorRemoveSnackbarMessage(
        page,
        CONTRIBUTOR_REMOVE_SNACKBAR_MESSAGES.success,
      );

      const persistedTeam = await fetchProjectTeam(page, project.uuid);
      expect(persistedTeam.some((member) => member.id === studentMember!.id)).toBe(false);
    });

    test('failed remove keeps contributor row and shows failure snackbar', async ({
      page,
      project,
    }) => {
      await installProjectTeamMemberRouteMock(page, project.uuid, (route) => {
        if (route.request().method() !== 'DELETE') {
          void route.continue();
          return;
        }

        void route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'E2E simulated contributor remove failure',
          }),
        });
      });

      await selectContributorRemoveAction(page, E2E_CONTRIBUTOR_EDITOR_EMAIL);

      await expectContributorRowVisible(page, E2E_CONTRIBUTOR_EDITOR_EMAIL);
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
      await expect(contributorRoleDropdown(page, E2E_CONTRIBUTOR_EDITOR_EMAIL)).toBeDisabled();
    });
  });

  test.describe('FR-PROJ-OV-004: addContributorsDialog interaction and outcomes', () => {
    test.use({ projectAccess: 'disposable' });

    test.beforeEach(async ({ page, project }) => {
      await gotoAuthenticatedShell(page, project.path);
      await waitForProjectOverviewLoaded(page);
    });

    test('dialog shows title, selectors, cancel label, and disabled submit', async ({ page }) => {
      await openAddContributorsDialog(page);
      await expectAddContributorsDialogChromePerFrProjOv004(page);
    });

    test('typing in user selector shows narrowed matching CourseFlow users', async ({ page }) => {
      await openAddContributorsDialog(page);
      await addContributorsUserSelector(page).click();
      await addContributorsUserSelector(page).fill(E2E_ADD_CONTRIBUTOR_CANDIDATE.searchTerm);
      await expect(
        page.getByRole('option', {
          name: E2E_ADD_CONTRIBUTOR_CANDIDATE.displayName,
          exact: true,
        }),
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

    test('cancel closes dialog without applying contributor changes', async ({ page, project }) => {
      const teamBefore = await fetchProjectTeam(page, project.uuid);

      await openAddContributorsDialog(page);
      await selectAddContributorCandidatePerFrProjOv004(page, 'Viewer');
      await addContributorsCancelButton(page).click();

      await expect(addContributorsDialog(page)).toBeHidden();
      const teamAfter = await fetchProjectTeam(page, project.uuid);
      expect(teamAfter).toEqual(teamBefore);
    });

    test('failed add keeps dialog open and shows failure snackbar', async ({ page, project }) => {
      const teamBefore = await fetchProjectTeam(page, project.uuid);

      await installAddProjectTeamMembersRouteMock(page, project.uuid, (route) => {
        if (route.request().method() !== 'POST') {
          void route.continue();
          return;
        }

        void route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'E2E simulated contributor add failure',
          }),
        });
      });

      await openAddContributorsDialog(page);
      await selectAddContributorCandidatePerFrProjOv004(page, 'Commenter');
      await addContributorsSubmitButton(page).click();

      await expect(addContributorsDialog(page)).toBeVisible();
      await expect(addContributorsSubmitButton(page)).toBeEnabled();
      const teamAfter = await fetchProjectTeam(page, project.uuid);
      expect(teamAfter).toEqual(teamBefore);
      await expectAddContributorSnackbarMessage(page, ADD_CONTRIBUTORS_SNACKBAR_MESSAGES.failure);
    });

    test('successful add closes dialog, updates contributors panel, and shows success snackbar', async ({
      page,
      project,
    }) => {
      await openAddContributorsDialog(page);
      await selectAddContributorCandidatePerFrProjOv004(page, 'Commenter');
      await addContributorsSubmitButton(page).click();

      await expect(addContributorsDialog(page)).toBeHidden({ timeout: 15_000 });
      await expect(
        projectPermissionsPanelContributorEmail(page, E2E_ADD_CONTRIBUTOR_CANDIDATE.email),
      ).toBeVisible({ timeout: 15_000 });
      await expectAddContributorSnackbarMessage(page, ADD_CONTRIBUTORS_SNACKBAR_MESSAGES.success);

      const persistedTeam = await fetchProjectTeam(page, project.uuid);
      const persistedMember = persistedTeam.find(
        (member) => member.userEmail === E2E_ADD_CONTRIBUTOR_CANDIDATE.email,
      );
      expect(persistedMember?.role).toBe('commenter');
    });
  });

  test.describe('FR-PROJ-OV-003: publish and unpublish controls', () => {
    test.use({ projectAccess: 'disposable' });

    test.beforeEach(async ({ page, project }) => {
      await gotoAuthenticatedShell(page, project.path);
      await waitForProjectOverviewLoaded(page);
    });

    test.describe('from unpublished project state', () => {
      test('shows private visibility message and publish control', async ({ page, project }) => {
        const detail = await fetchProjectDetail(page, project.uuid);
        expect(detail.isPublished).toBe(false);
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

      test('failed publish keeps modal open and shows failure snackbar', async ({
        page,
        project,
      }) => {
        await installProjectUpdateRouteMock(page, project.uuid, (route) => {
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
        const detail = await fetchProjectDetail(page, project.uuid);
        expect(detail.isPublished).toBe(false);
        await expectProjectPublishSnackbarMessage(page, PROJECT_PUBLISH_SNACKBAR_MESSAGES.failure);
      });

      test('successful publish closes modal, shows success snackbar, and switches to published controls', async ({
        page,
        project,
      }) => {
        await openPublishProjectConfirmationModal(page);
        await publishProjectConfirmationModalConfirmButton(page).click();

        await expect(publishProjectConfirmationModal(page)).toBeHidden({
          timeout: 15_000,
        });
        await expectPublishedUnpublishControlsPerFrProjOv003(page);
        await expectProjectPublishSnackbarMessage(page, PROJECT_PUBLISH_SNACKBAR_MESSAGES.success);

        const persisted = await fetchProjectDetail(page, project.uuid);
        expect(persisted.isPublished).toBe(true);
      });
    });

    test.describe('from published project state', () => {
      test.use({ projectInitialPublished: true });

      test.beforeEach(async ({ page }) => {
        await expectPublishedUnpublishControlsPerFrProjOv003(page);
      });

      test('shows public visibility message and unpublish control on initial load', async ({
        page,
      }) => {
        await expectPublishedUnpublishControlsPerFrProjOv003(page);
      });

      test('failed unpublish keeps project published and shows failure snackbar', async ({
        page,
        project,
      }) => {
        await installProjectUpdateRouteMock(page, project.uuid, (route) => {
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
        project,
      }) => {
        await expect(unpublishProjectButton(page)).toBeVisible();
        await unpublishProjectButton(page).click();

        await expectUnpublishedPublishControlsPerFrProjOv003(page);
        await expectProjectUnpublishSnackbarMessage(
          page,
          PROJECT_UNPUBLISH_SNACKBAR_MESSAGES.success,
        );

        const persisted = await fetchProjectDetail(page, project.uuid);
        expect(persisted.isPublished).toBe(false);
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

    test('viewer sees visibility message but not publish or unpublish controls', async ({
      page,
    }) => {
      await expect(projectVisibilityStateMessage(page)).toBeVisible();
      await expect(publishProjectButton(page)).toHaveCount(0);
      await expect(unpublishProjectButton(page)).toHaveCount(0);
    });
  });

  test('FR-PROJ-OV-005: tags section shows add-new-tag input when tags block is rendered', async ({
    page,
  }) => {
    await expect(projectTagsSection(page)).toBeVisible();
    await expect(addNewTagInput(page)).toBeVisible();
    await expect(addNewTagInput(page)).toHaveAttribute('placeholder', 'Add new tag');
  });
});
