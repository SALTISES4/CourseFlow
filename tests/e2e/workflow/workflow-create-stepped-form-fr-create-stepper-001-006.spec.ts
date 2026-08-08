import { test, expect, type Locator, type Page } from '../../fixtures';
import {
  CREATE_WORKFLOW_NO_ELIGIBLE_PROJECTS_COPY,
  createWorkflowCancelButton,
  createWorkflowDialog,
  createWorkflowDialogFromTemplateOption,
  createWorkflowDialogNextStep,
  createWorkflowDialogProjectCardByTitle,
  createWorkflowDialogProjectCards,
  createWorkflowDialogTemplateCards,
  createWorkflowDialogTitle,
  createWorkflowNoEligibleProjectsDialog,
  createWorkflowPreviousStepButton,
  createWorkflowStepper,
  createWorkflowSubmitButton,
  workflowCreationModeBlankOption,
  workflowCreationModeTemplateOption,
  workflowDescriptionField,
  workflowFormFieldValidationMessage,
  WORKFLOW_CREATE_TITLE_MAX_LENGTH_MESSAGE,
  WORKFLOW_CREATE_TITLE_REQUIRED_MESSAGE,
  workflowProjectSearchEmptyState,
  workflowProjectSearchField,
  workflowProjectSearchView,
  workflowTemplateSearchEmptyState,
  workflowTemplateSearchField,
  workflowTitleField,
} from '../home/home.locators';
import {
  addMenuItemActivity,
  addMenuItemCourse,
  addMenuItemProgram,
  addMenuTrigger,
} from '../navigation/navigation.locators';
import { loginAs } from '../../helpers/auth';
import {
  createWorkflowBlankFailureSnackbarText,
  createWorkflowBlankSuccessSnackbarText,
  createWorkflowDialogTitles,
  createWorkflowStepperLabels,
  expectBlankWorkflowFormLayoutPerFrCreateStepper005,
  expectCancelClosesCreateWorkflowDialog,
  expectCreateWorkflowCreationModeSelected,
  expectCreateWorkflowStepperStepLabels,
  expectDefaultWorkflowChannelsInHeaderRow,
  selectCreateWorkflowDestinationProject,
  waitForCreateWorkflowProjectSearchLoaded,
} from '../../helpers/create-workflow';
import { authenticatedApiRequest } from '../../helpers/api';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import {
  contributorByRole,
  getTemplateWorkflowFixture,
  loadWorkflowManifest,
  type TemplateWorkflowType,
} from '../../helpers/manifest';
import { globalMessageSnackbar } from '../../shared/locators/global';
import { workflowSectionContainers, workflowTitle } from '../../shared/locators/workflow';
import { cardByTitle, cardChipWithLabel, cardTitleText } from '../../shared/locators/cards';
import { workflowNodes } from './workflow-graph.locators';

test.use({
  seedDependencies: [
    'actor.teacher',
    'project.recent_collection',
    'project.templates',
    'workflow.template_activity',
    'workflow.template_course',
    'workflow.template_program',
  ],
});

/**
 * Create workflow stepped form — FR-WF-CREATE-STEPPER-001 through FR-WF-CREATE-STEPPER-006.
 * Requirements: tests/docs/requirements/features/workflow/workflow_create_stepped_form_requirements_v1.yaml
 * Card content in dialog: tests/docs/requirements/features/global/card_content_requirements_v1.yaml (FR-CARD-002)
 * Auth: chromium storage state (teacher@courseflow.com) for owner/editor paths;
 * FR-WF-CREATE-STEPPER-002 uses empty storage + viewer login (no canCreateWorkflow destinations).
 * Suites are nested by workflow type so type-scoped titles/labels are asserted per fixture.
 */

type CreateWorkflowEntry = {
  workflowType: TemplateWorkflowType;
  openDialog: (page: Page) => Promise<void>;
  step2DialogTitle: string;
  step3BlankDialogTitle: string;
  step3TemplateDialogTitle: string;
};

const WORKFLOW_TYPES = ['activity', 'course', 'program'] as const satisfies readonly TemplateWorkflowType[];

function buildCreateWorkflowEntry(workflowType: TemplateWorkflowType): CreateWorkflowEntry {
  const openDialogByType = {
    activity: async (page: Page) => {
      await addMenuTrigger(page).click();
      await addMenuItemActivity(page).click();
    },
    course: async (page: Page) => {
      await addMenuTrigger(page).click();
      await addMenuItemCourse(page).click();
    },
    program: async (page: Page) => {
      await addMenuTrigger(page).click();
      await addMenuItemProgram(page).click();
    },
  };

  return {
    workflowType,
    openDialog: openDialogByType[workflowType],
    ...createWorkflowDialogTitles(workflowType),
  };
}

async function openCreateWorkflowDialogStep1(
  page: Page,
  entry: CreateWorkflowEntry,
): Promise<void> {
  await entry.openDialog(page);
  await expect(createWorkflowDialog(page)).toBeVisible();
  await expect(createWorkflowDialogTitle(page)).toHaveText('Select project');
  await waitForCreateWorkflowProjectSearchLoaded(page);
}

async function openCreateWorkflowDialogStep2(
  page: Page,
  projectTitle: string,
  entry: CreateWorkflowEntry,
): Promise<void> {
  await openCreateWorkflowDialogStep1(page, entry);
  await selectCreateWorkflowDestinationProject(page, projectTitle);
  await createWorkflowDialogNextStep(page).click();
  await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);
}

async function openCreateWorkflowDialogBlankStep3(
  page: Page,
  projectTitle: string,
  entry: CreateWorkflowEntry,
): Promise<void> {
  await openCreateWorkflowDialogStep2(page, projectTitle, entry);
  await createWorkflowDialogNextStep(page).click();
  await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3BlankDialogTitle);
  await expect(workflowTitleField(page)).toBeVisible();
}

async function openCreateWorkflowTemplateStep3(
  page: Page,
  entry: CreateWorkflowEntry,
  projectTitle: string,
): Promise<Locator> {
  await openCreateWorkflowDialogStep2(page, projectTitle, entry);
  await createWorkflowDialogFromTemplateOption(page).click();
  await createWorkflowDialogNextStep(page).click();

  await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3TemplateDialogTitle);
  return createWorkflowDialog(page);
}

test.describe('Create workflow stepped form — FR-WF-CREATE-STEPPER-001–006', () => {
  const manifest = loadWorkflowManifest();

  for (const workflowType of WORKFLOW_TYPES) {
    const entry = buildCreateWorkflowEntry(workflowType);
    let destinationProjectTitle = '';

    test.describe(workflowType, () => {
      test.describe('FR-WF-CREATE-STEPPER-002: no eligible destination projects', () => {
        test.use({ storageState: { cookies: [], origins: [] } });

        test('shows no-eligible warning with type-scoped stepper and disables Next', async ({
          page,
        }) => {
          // Viewer is contributor but not owner/editor → no canCreateWorkflow destinations.
          const viewer = contributorByRole(manifest, 'viewer');
          await loginAs(page, { email: viewer.email, password: viewer.password });
          await gotoAuthenticatedShell(page, '/home');

          const routeBeforeDialog = page.url();
          await entry.openDialog(page);
          await expect(createWorkflowDialog(page)).toBeVisible();

          // Step 1 shell still matches FR-WF-CREATE-STEPPER-001 (type from entry point).
          await expect(createWorkflowDialogTitle(page)).toHaveText('Select project');
          await expectCreateWorkflowStepperStepLabels(
            page,
            createWorkflowStepperLabels(entry.workflowType),
          );

          const warning = createWorkflowNoEligibleProjectsDialog(page);
          await expect(warning).toBeVisible({ timeout: 15_000 });
          await expect(warning).toContainText(CREATE_WORKFLOW_NO_ELIGIBLE_PROJECTS_COPY.title);
          await expect(warning).toContainText(CREATE_WORKFLOW_NO_ELIGIBLE_PROJECTS_COPY.body);

          await expect(createWorkflowDialogNextStep(page)).toBeVisible();
          await expect(createWorkflowDialogNextStep(page)).toHaveText('Next step');
          await expect(createWorkflowDialogNextStep(page)).toBeDisabled();
          await expect(createWorkflowDialogProjectCards(page)).toHaveCount(0);

          await expectCancelClosesCreateWorkflowDialog(page, routeBeforeDialog);
        });
      });

      test.describe('owner/editor path', () => {
        test.use({ projectAccess: 'disposable' });

        test.beforeEach(async ({ page, project }) => {
          destinationProjectTitle = project.title;
          await gotoAuthenticatedShell(page, '/home');
        });

        test.describe('FR-WF-CREATE-STEPPER-001: step 1 shell', () => {
          test('createWorkflowStepper shows Select project, Select type, and Create type', async ({
            page,
          }) => {
            await openCreateWorkflowDialogStep1(page, entry);
            await expectCreateWorkflowStepperStepLabels(
              page,
              createWorkflowStepperLabels(entry.workflowType),
            );
          });

          test('opens dialog on project selection with Cancel, Previous hidden, and Next disabled', async ({
            page,
          }) => {
            await openCreateWorkflowDialogStep1(page, entry);

            await expect(createWorkflowStepper(page)).toBeVisible();
            await expectCreateWorkflowStepperStepLabels(
              page,
              createWorkflowStepperLabels(entry.workflowType),
            );
            await expect(createWorkflowCancelButton(page)).toBeVisible();
            await expect(createWorkflowPreviousStepButton(page)).toBeHidden();
            await expect(createWorkflowDialogNextStep(page)).toBeVisible();
            await expect(createWorkflowDialogNextStep(page)).toBeDisabled();
          });

          test.describe('Cancel closes dialog without creating workflow', () => {
            test('from step 1 returns to route active when user clicks cancel', async ({
              page,
            }) => {
              const routeBeforeDialog = page.url();
              await openCreateWorkflowDialogStep1(page, entry);
              await expectCancelClosesCreateWorkflowDialog(page, routeBeforeDialog);
            });

            test('from step 2 returns to route active when user clicks cancel', async ({
              page,
            }) => {
              const routeBeforeDialog = page.url();
              await openCreateWorkflowDialogStep2(page, destinationProjectTitle, entry);
              await expectCancelClosesCreateWorkflowDialog(page, routeBeforeDialog);
            });

            test('from step 3 blank mode returns to route active when user clicks cancel', async ({
              page,
            }) => {
              const routeBeforeDialog = page.url();
              await openCreateWorkflowDialogBlankStep3(page, destinationProjectTitle, entry);
              await workflowTitleField(page).fill('Would not persist if created');
              await expectCancelClosesCreateWorkflowDialog(page, routeBeforeDialog);
            });

            test('from step 3 template mode returns to route active when user clicks cancel', async ({
              page,
            }) => {
              const routeBeforeDialog = page.url();
              await openCreateWorkflowTemplateStep3(page, entry, destinationProjectTitle);
              await expectCancelClosesCreateWorkflowDialog(page, routeBeforeDialog);
            });
          });
        });

        test.describe('FR-WF-CREATE-STEPPER-003: step 1 select destination project', () => {
          test('shows project search view with at most four projectCard items', async ({ page }) => {
            await openCreateWorkflowDialogStep1(page, entry);

            await expect(workflowProjectSearchField(page)).toBeVisible();
            await expect(workflowProjectSearchView(page)).toBeVisible();

            const projectCards = createWorkflowDialogProjectCards(page);
            const count = await projectCards.count();
            expect(count).toBeGreaterThanOrEqual(1);
            expect(count).toBeLessThanOrEqual(4);
          });

          test('current eligible project route is pinned first and preselected', async ({
            page,
            project,
          }) => {
            await expect(addMenuTrigger(page)).toBeVisible();
            await gotoAuthenticatedShell(page, project.path);
            await openCreateWorkflowDialogStep1(page, entry);

            const firstProjectCard = createWorkflowDialogProjectCards(page).first();
            await expect(cardTitleText(firstProjectCard)).toHaveText(project.title);
            await expect(firstProjectCard).toHaveClass(/selected/);
            await expect(createWorkflowDialogNextStep(page)).toBeEnabled();
          });

          test('current eligible child-workflow project is pinned first and preselected', async ({
            page,
            project,
          }) => {
            await expect(addMenuTrigger(page)).toBeVisible();
            const createResponse = await authenticatedApiRequest(page, 'POST', '/api/workflow', {
              data: {
                projectUuid: project.uuid,
                title: `E2E context ${entry.workflowType} ${Date.now()}`,
                workflowType: entry.workflowType,
                description: '',
              },
            });
            expect(createResponse.ok()).toBe(true);
            const created = (await createResponse.json()) as { uuid: string };

            await gotoAuthenticatedShell(page, `/workflow/${created.uuid}/graph`);
            await openCreateWorkflowDialogStep1(page, entry);

            const firstProjectCard = createWorkflowDialogProjectCards(page).first();
            await expect(cardTitleText(firstProjectCard)).toHaveText(project.title);
            await expect(firstProjectCard).toHaveClass(/selected/);
            await expect(createWorkflowDialogNextStep(page)).toBeEnabled();
          });

        test('Next step stays disabled until a projectCard is selected', async ({ page }) => {
          await openCreateWorkflowDialogStep1(page, entry);

          await expect(createWorkflowDialogNextStep(page)).toBeDisabled();
          await selectCreateWorkflowDestinationProject(page, destinationProjectTitle);
          await expect(createWorkflowDialogNextStep(page)).toBeEnabled();
        });

        test('advances to step 2 after project selection', async ({ page }) => {
          await openCreateWorkflowDialogStep1(page, entry);
          await selectCreateWorkflowDestinationProject(page, destinationProjectTitle);
          await createWorkflowDialogNextStep(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);
        });

        test('zero-match search shows empty state and disables Next step', async ({ page }) => {
          await openCreateWorkflowDialogStep1(page, entry);

          await workflowProjectSearchField(page).fill('zzz-no-matching-project-title');
          await workflowProjectSearchField(page).press('Enter');
          await waitForCreateWorkflowProjectSearchLoaded(page);

          await expect(workflowProjectSearchEmptyState(page)).toBeVisible();
          await expect(createWorkflowDialogProjectCards(page)).toHaveCount(0);
          await expect(createWorkflowDialogNextStep(page)).toBeDisabled();
        });

        test('title-matching search filters visible projectCard items', async ({ page }) => {
          await openCreateWorkflowDialogStep1(page, entry);

          const otherRecentTitle = manifest.recent_projects.find(
            (project) => project.title !== destinationProjectTitle,
          )?.title;

          // Disposable project titles are unique, so only this test's destination matches.
          const searchTerm = destinationProjectTitle;
          await workflowProjectSearchField(page).fill(searchTerm);
          await workflowProjectSearchField(page).press('Enter');

          await expect(createWorkflowDialogProjectCards(page)).toHaveCount(1, { timeout: 15_000 });
          await expect(workflowProjectSearchEmptyState(page)).toBeHidden();
          await expect(cardTitleText(createWorkflowDialogProjectCards(page).first())).toContainText(
            searchTerm,
          );
          await expect(
            createWorkflowDialogProjectCardByTitle(page, destinationProjectTitle),
          ).toBeVisible();
          if (otherRecentTitle) {
            await expect(createWorkflowDialogProjectCardByTitle(page, otherRecentTitle)).toHaveCount(
              0,
            );
          }
        });

        test('clearing search after zero-match restores projectCard items', async ({ page }) => {
          await openCreateWorkflowDialogStep1(page, entry);

          const cardsBeforeSearch = await createWorkflowDialogProjectCards(page).count();
          expect(cardsBeforeSearch).toBeGreaterThanOrEqual(1);

          await workflowProjectSearchField(page).fill('zzz-no-matching-project-title');
          await workflowProjectSearchField(page).press('Enter');
          await waitForCreateWorkflowProjectSearchLoaded(page);
          await expect(workflowProjectSearchEmptyState(page)).toBeVisible();
          await expect(createWorkflowDialogProjectCards(page)).toHaveCount(0);

          await workflowProjectSearchField(page).fill('');
          await workflowProjectSearchField(page).press('Enter');
          await waitForCreateWorkflowProjectSearchLoaded(page);

          await expect(workflowProjectSearchEmptyState(page)).toBeHidden();
          await expect(createWorkflowDialogProjectCards(page).first()).toBeVisible();
          expect(await createWorkflowDialogProjectCards(page).count()).toBeGreaterThanOrEqual(1);
          await expect(createWorkflowDialogNextStep(page)).toBeDisabled();
        });

        test('after zero-match, clear search and select projectCard enables Next and advances', async ({
          page,
        }) => {
          await openCreateWorkflowDialogStep1(page, entry);

          await selectCreateWorkflowDestinationProject(page, destinationProjectTitle);
          await expect(createWorkflowDialogNextStep(page)).toBeEnabled();

          await workflowProjectSearchField(page).fill('zzz-no-matching-project-title');
          await workflowProjectSearchField(page).press('Enter');
          await waitForCreateWorkflowProjectSearchLoaded(page);
          await expect(workflowProjectSearchEmptyState(page)).toBeVisible();
          await expect(createWorkflowDialogNextStep(page)).toBeDisabled();

          await workflowProjectSearchField(page).fill('');
          await workflowProjectSearchField(page).press('Enter');
          await waitForCreateWorkflowProjectSearchLoaded(page);

          await selectCreateWorkflowDestinationProject(page, destinationProjectTitle);
          await expect(createWorkflowDialogNextStep(page)).toBeEnabled();
          await createWorkflowDialogNextStep(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);
        });
      });

        test.describe('FR-WF-CREATE-STEPPER-004: step 2 choose blank or template creation mode', () => {
        test('shows both creation modes with blank default and step 2 dialog title', async ({
          page,
        }) => {
          await openCreateWorkflowDialogStep2(page, destinationProjectTitle, entry);

          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);
          await expect(workflowCreationModeBlankOption(page, entry.workflowType)).toBeVisible();
          await expect(workflowCreationModeTemplateOption(page)).toBeVisible();
          await expectCreateWorkflowCreationModeSelected(page, entry.workflowType, 'blank');
          await expect(createWorkflowPreviousStepButton(page)).toBeVisible();
          await expect(createWorkflowDialogNextStep(page)).toBeEnabled();
        });

        test('Next step opens blank step 3 when blank mode is default', async ({ page }) => {
          await openCreateWorkflowDialogStep2(page, destinationProjectTitle, entry);

          await createWorkflowDialogNextStep(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3BlankDialogTitle);
          await expect(workflowTitleField(page)).toBeVisible();
        });

        test('template mode opens template step 3', async ({ page }) => {
          await openCreateWorkflowDialogStep2(page, destinationProjectTitle, entry);

          await workflowCreationModeTemplateOption(page).click();
          await expectCreateWorkflowCreationModeSelected(page, entry.workflowType, 'template');
          await createWorkflowDialogNextStep(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3TemplateDialogTitle);
        });

        test('blank mode opens blank step 3 after selecting blank option', async ({ page }) => {
          await openCreateWorkflowDialogStep2(page, destinationProjectTitle, entry);

          await workflowCreationModeTemplateOption(page).click();
          await expectCreateWorkflowCreationModeSelected(page, entry.workflowType, 'template');
          await workflowCreationModeBlankOption(page, entry.workflowType).click();
          await expectCreateWorkflowCreationModeSelected(page, entry.workflowType, 'blank');
          await createWorkflowDialogNextStep(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3BlankDialogTitle);
          await expect(workflowTitleField(page)).toBeVisible();
        });

        test('Previous step returns to step 1 with project still selected', async ({ page }) => {
          await openCreateWorkflowDialogStep2(page, destinationProjectTitle, entry);

          await createWorkflowPreviousStepButton(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText('Select project');
          const projectCard = createWorkflowDialogProjectCardByTitle(page, destinationProjectTitle);
          await expect(projectCard).toHaveClass(/selected/);
          await expect(createWorkflowDialogNextStep(page)).toBeEnabled();
        });

        test('returning from template step 3 preserves template mode', async ({ page }) => {
          await openCreateWorkflowDialogStep2(page, destinationProjectTitle, entry);
          await workflowCreationModeTemplateOption(page).click();
          await createWorkflowDialogNextStep(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3TemplateDialogTitle);

          await createWorkflowPreviousStepButton(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);
          await expectCreateWorkflowCreationModeSelected(page, entry.workflowType, 'template');
          await expect(createWorkflowDialogNextStep(page)).toBeEnabled();

          await createWorkflowDialogNextStep(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3TemplateDialogTitle);
        });
      });

        test.describe('FR-WF-CREATE-STEPPER-005: step 3 blank workflow form and submit outcome', () => {
          test('blank step 3 shows type-scoped title and description labels only', async ({
          page,
        }) => {
          await openCreateWorkflowDialogBlankStep3(page, destinationProjectTitle, entry);

          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3BlankDialogTitle);
          await expectBlankWorkflowFormLayoutPerFrCreateStepper005(page, entry.workflowType);
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeVisible();
        });

        test('workflowTitleField is required and at most 200 characters', async ({ page }) => {
          await openCreateWorkflowDialogBlankStep3(page, destinationProjectTitle, entry);

          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeDisabled();

          await workflowDescriptionField(page, entry.workflowType).fill(
            'Description only — must not enable submit without title',
          );
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeDisabled();

          await workflowTitleField(page).fill('   ');
          await workflowTitleField(page).blur();
          await expect(
            workflowFormFieldValidationMessage(page, WORKFLOW_CREATE_TITLE_REQUIRED_MESSAGE),
          ).toBeVisible();
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeDisabled();

          await workflowTitleField(page).fill('x'.repeat(201));
          await workflowTitleField(page).blur();
          await expect(
            workflowFormFieldValidationMessage(page, WORKFLOW_CREATE_TITLE_MAX_LENGTH_MESSAGE),
          ).toBeVisible();
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeDisabled();

          await workflowTitleField(page).fill('x'.repeat(200));
          await expect(
            workflowFormFieldValidationMessage(page, WORKFLOW_CREATE_TITLE_MAX_LENGTH_MESSAGE),
          ).toBeHidden();
          await expect(
            workflowFormFieldValidationMessage(page, WORKFLOW_CREATE_TITLE_REQUIRED_MESSAGE),
          ).toBeHidden();
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeEnabled();

          await workflowTitleField(page).fill('');
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeDisabled();
        });

        test('Previous step returns to step 2 with destination project preserved', async ({
          page,
        }) => {
          await openCreateWorkflowDialogBlankStep3(page, destinationProjectTitle, entry);

          await createWorkflowPreviousStepButton(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);

          await createWorkflowPreviousStepButton(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText('Select project');
          const projectCard = createWorkflowDialogProjectCardByTitle(page, destinationProjectTitle);
          await expect(projectCard).toHaveClass(/selected/);
        });

        test('returning from step 2 preserves blank form values', async ({ page }) => {
          const title = `E2E blank ${entry.workflowType} ${Date.now()}`;
          const description = 'Optional description for FR-WF-CREATE-STEPPER-005';

          await openCreateWorkflowDialogBlankStep3(page, destinationProjectTitle, entry);
          await workflowTitleField(page).fill(title);
          await workflowDescriptionField(page, entry.workflowType).fill(description);
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeEnabled();

          await createWorkflowPreviousStepButton(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);

          await createWorkflowDialogNextStep(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3BlankDialogTitle);
          await expect(workflowTitleField(page)).toHaveValue(title);
          await expect(workflowDescriptionField(page, entry.workflowType)).toHaveText(description);
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeEnabled();
        });

        test('blank create navigates to workflow graph with success feedback and defaults', async ({
          page,
        }) => {
          const uniqueTitle = `E2E ${entry.workflowType} ${Date.now()}`;

          await openCreateWorkflowDialogBlankStep3(page, destinationProjectTitle, entry);
          await expectBlankWorkflowFormLayoutPerFrCreateStepper005(page, entry.workflowType);
          await workflowTitleField(page).fill(uniqueTitle);
          await createWorkflowSubmitButton(page, entry.workflowType).click();

          await expect(createWorkflowDialog(page)).toBeHidden({ timeout: 15_000 });
          await expect(page).toHaveURL(/\/workflow\/[0-9a-f-]+\/graph\/?$/);
          await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
          await expect(globalMessageSnackbar(page)).toHaveText(
            createWorkflowBlankSuccessSnackbarText(entry.workflowType),
          );
          await expect(workflowSectionContainers(page)).toHaveCount(1);
          await expect(workflowNodes(page)).toHaveCount(0);
          await expectDefaultWorkflowChannelsInHeaderRow(page, entry.workflowType);
        });
      });

        test.describe('FR-WF-CREATE-STEPPER-006: step 3 template picker', () => {
        test('template workflowCard shows Template chip (FR-CARD-002)', async ({ page }) => {
          const templateFixture = getTemplateWorkflowFixture(manifest, entry.workflowType);
          const dialog = await openCreateWorkflowTemplateStep3(
            page,
            entry,
            destinationProjectTitle,
          );

          const templateCard = cardByTitle(dialog, templateFixture.workflow_title);
          await expect(workflowTemplateSearchField(page)).toBeVisible();
          await expect(templateCard).toBeVisible({ timeout: 15_000 });
          await expect(cardChipWithLabel(templateCard, 'Template')).toBeVisible();
          const templateCount = await createWorkflowDialogTemplateCards(page).count();
          expect(templateCount).toBeGreaterThanOrEqual(1);
          expect(templateCount).toBeLessThanOrEqual(4);
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeDisabled();
        });

        test('template title search shows matching cards and recovers after an empty result', async ({
          page,
        }) => {
          const templateFixture = getTemplateWorkflowFixture(manifest, entry.workflowType);
          const dialog = await openCreateWorkflowTemplateStep3(
            page,
            entry,
            destinationProjectTitle,
          );

          await workflowTemplateSearchField(page).fill('zzz-no-matching-template-title');
          await expect(workflowTemplateSearchEmptyState(page)).toBeVisible({ timeout: 15_000 });
          await expect(createWorkflowDialogTemplateCards(page)).toHaveCount(0);
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeDisabled();

          await workflowTemplateSearchField(page).fill(templateFixture.workflow_title);
          const matchingCard = cardByTitle(dialog, templateFixture.workflow_title);
          await expect(matchingCard).toBeVisible({ timeout: 15_000 });
          await expect(workflowTemplateSearchEmptyState(page)).toBeHidden();
          await expect(createWorkflowDialogTemplateCards(page)).toHaveCount(1);
        });

        test('selected template remains selected after returning from step 2', async ({ page }) => {
          const templateFixture = getTemplateWorkflowFixture(manifest, entry.workflowType);
          let dialog = await openCreateWorkflowTemplateStep3(
            page,
            entry,
            destinationProjectTitle,
          );
          let templateCard = cardByTitle(dialog, templateFixture.workflow_title);

          await templateCard.click();
          await expect(templateCard).toHaveClass(/selected/);
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeEnabled();

          await createWorkflowPreviousStepButton(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);
          await createWorkflowDialogNextStep(page).click();
          await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3TemplateDialogTitle);

          dialog = createWorkflowDialog(page);
          templateCard = cardByTitle(dialog, templateFixture.workflow_title);
          await expect(templateCard).toHaveClass(/selected/);
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeEnabled();
        });

        test('selected template is copied through the workflow-copy endpoint', async ({ page }) => {
          const templateFixture = getTemplateWorkflowFixture(manifest, entry.workflowType);
          const dialog = await openCreateWorkflowTemplateStep3(
            page,
            entry,
            destinationProjectTitle,
          );
          const templateCard = cardByTitle(dialog, templateFixture.workflow_title);

          await templateCard.click();
          await expect(templateCard).toHaveClass(/selected/);
          await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeEnabled();
          await createWorkflowSubmitButton(page, entry.workflowType).click();

          await expect(createWorkflowDialog(page)).toBeHidden({ timeout: 15_000 });
          await expect(page).toHaveURL(/\/workflow\/[0-9a-f-]+\/graph\/?$/);
          await expect(workflowTitle(page)).toContainText(templateFixture.workflow_title);
          await expect(workflowSectionContainers(page).first()).toBeVisible();
          await expect(globalMessageSnackbar(page)).toHaveText(
            `Your ${entry.workflowType} has been successfully created`,
          );
        });
      });
      });
    });
  }

  test.describe('FR-WF-CREATE-STEPPER-005: real API failure feedback', () => {
    test.use({ projectAccess: 'disposable' });

    test('shows failure snackbar and keeps dialog open when blank create submit fails', async ({
      page,
      project,
    }) => {
      const entry = buildCreateWorkflowEntry('activity');
      await gotoAuthenticatedShell(page, '/home');
      await openCreateWorkflowDialogBlankStep3(page, project.title, entry);
      await workflowTitleField(page).fill(`E2E failed activity ${Date.now()}`);

      const archived = await authenticatedApiRequest(
        page,
        'POST',
        `/api/project/${project.uuid}/archive`,
      );
      expect(archived.ok()).toBe(true);
      const deleted = await authenticatedApiRequest(page, 'DELETE', `/api/project/${project.uuid}`);
      expect(deleted.ok()).toBe(true);

      await createWorkflowSubmitButton(page, entry.workflowType).click();

      await expect(createWorkflowDialog(page)).toBeVisible();
      await expect(globalMessageSnackbar(page)).toHaveText(
        createWorkflowBlankFailureSnackbarText(entry.workflowType),
      );
    });

    test('shows failure snackbar and keeps dialog open when template copy fails', async ({
      page,
      project,
    }) => {
      const entry = buildCreateWorkflowEntry('activity');
      const templateFixture = getTemplateWorkflowFixture(manifest, entry.workflowType);
      await gotoAuthenticatedShell(page, '/home');
      const dialog = await openCreateWorkflowTemplateStep3(page, entry, project.title);
      const templateCard = cardByTitle(dialog, templateFixture.workflow_title);
      await templateCard.click();

      const archived = await authenticatedApiRequest(
        page,
        'POST',
        `/api/project/${project.uuid}/archive`,
      );
      expect(archived.ok()).toBe(true);
      const deleted = await authenticatedApiRequest(page, 'DELETE', `/api/project/${project.uuid}`);
      expect(deleted.ok()).toBe(true);

      await createWorkflowSubmitButton(page, entry.workflowType).click();

      await expect(createWorkflowDialog(page)).toBeVisible();
      await expect(globalMessageSnackbar(page)).toHaveText(
        createWorkflowBlankFailureSnackbarText(entry.workflowType),
      );
    });
  });
});
