import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  createWorkflowCancelButton,
  createWorkflowDialog,
  createWorkflowDialogFromTemplateOption,
  createWorkflowDialogNextStep,
  createWorkflowDialogProjectCardByTitle,
  createWorkflowDialogProjectCards,
  createWorkflowDialogTitle,
  createWorkflowPreviousStepButton,
  createWorkflowStepper,
  createWorkflowSubmitButton,
  workflowBlankForm,
  workflowCreationModeBlankOption,
  workflowCreationModeTemplateOption,
  workflowDescriptionField,
  workflowProjectSearchEmptyState,
  workflowProjectSearchField,
  workflowProjectSearchView,
  workflowTitleField,
} from '../home/home.locators';
import {
  addMenuItemActivity,
  addMenuItemCourse,
  addMenuItemProgram,
  addMenuTrigger,
} from '../navigation/navigation.locators';
import {
  createWorkflowBlankSuccessSnackbarText,
  createWorkflowDialogTitles,
  createWorkflowStepperLabels,
  expectCancelClosesCreateWorkflowDialog,
  expectCreateWorkflowStepperStepLabels,
  expectDefaultWorkflowChannelsInHeaderRow,
  waitForCreateWorkflowProjectSearchLoaded,
} from '../../helpers/create-workflow';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import {
  getTemplateWorkflowFixture,
  loadWorkflowManifest,
  type TemplateWorkflowType,
} from '../../helpers/manifest';
import { globalMessageSnackbar } from '../../shared/locators/global';
import { workflowSectionContainers } from '../../shared/locators/workflow';
import { cardByTitle, cardChipWithLabel } from '../../shared/locators/cards';
import { workflowNodes } from './workflow-graph.locators';

/**
 * Calibration slice — FR-WF-CREATE-STEPPER-001 through FR-WF-CREATE-STEPPER-006.
 * Requirements: tests/docs/requirements/features/workflow/workflow_create_stepped_form_requirements_v1.yaml
 * Card content in dialog: tests/docs/requirements/features/global/card_content_requirements_v1.yaml (FR-CARD-002)
 * Auth: chromium project storage state (teacher@courseflow.com).
 */

type CreateWorkflowEntry = {
  workflowType: TemplateWorkflowType;
  openDialog: (page: Page) => Promise<void>;
  step2DialogTitle: string;
  step3BlankDialogTitle: string;
  step3TemplateDialogTitle: string;
};

const CREATE_WORKFLOW_ENTRIES: CreateWorkflowEntry[] = (
  ['activity', 'course', 'program'] as const
).map((workflowType) => {
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
});

const DEFAULT_ENTRY = CREATE_WORKFLOW_ENTRIES[0]!;

async function openCreateWorkflowDialogStep1(
  page: Page,
  entry: CreateWorkflowEntry = DEFAULT_ENTRY,
): Promise<void> {
  await entry.openDialog(page);
  await expect(createWorkflowDialog(page)).toBeVisible();
  await expect(createWorkflowDialogTitle(page)).toHaveText('Select project');
  await waitForCreateWorkflowProjectSearchLoaded(page);
}

async function selectFixtureProjectOnStep1(page: Page, projectTitle: string): Promise<void> {
  const projectCard = createWorkflowDialogProjectCardByTitle(page, projectTitle);
  if ((await projectCard.count()) === 0) {
    test.skip(true, 'E2E fixture project card not visible in create-workflow step 1.');
  }
  await projectCard.click();
}

async function openCreateWorkflowDialogStep2(
  page: Page,
  projectTitle: string,
  entry: CreateWorkflowEntry = DEFAULT_ENTRY,
): Promise<void> {
  await openCreateWorkflowDialogStep1(page, entry);
  await selectFixtureProjectOnStep1(page, projectTitle);
  await createWorkflowDialogNextStep(page).click();
  await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);
}

async function openCreateWorkflowDialogBlankStep3(
  page: Page,
  projectTitle: string,
  entry: CreateWorkflowEntry = DEFAULT_ENTRY,
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

test.describe('Create workflow stepped form — calibration (FR-WF-CREATE-STEPPER-001–006)', () => {
  const manifest = loadWorkflowManifest();

  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, '/home');
  });

  test.describe('FR-WF-CREATE-STEPPER-001: step 1 shell', () => {
    for (const entry of CREATE_WORKFLOW_ENTRIES) {
      test(`createWorkflowStepper shows Select project, Select ${entry.workflowType} type, and Create ${entry.workflowType}`, async ({
        page,
      }) => {
        await openCreateWorkflowDialogStep1(page, entry);
        await expectCreateWorkflowStepperStepLabels(
          page,
          createWorkflowStepperLabels(entry.workflowType),
        );
      });
    }

    test('opens dialog on project selection with Cancel, Previous hidden, and Next disabled', async ({
      page,
    }) => {
      await openCreateWorkflowDialogStep1(page);

      await expect(createWorkflowStepper(page)).toBeVisible();
      await expectCreateWorkflowStepperStepLabels(
        page,
        createWorkflowStepperLabels(DEFAULT_ENTRY.workflowType),
      );
      await expect(createWorkflowCancelButton(page)).toBeVisible();
      await expect(createWorkflowPreviousStepButton(page)).toBeHidden();
      await expect(createWorkflowDialogNextStep(page)).toBeVisible();
      await expect(createWorkflowDialogNextStep(page)).toBeDisabled();
    });

    test.describe('Cancel closes dialog without creating workflow', () => {
      test('from step 1 returns to route active before dialog open', async ({ page }) => {
        const routeBeforeDialog = page.url();
        await openCreateWorkflowDialogStep1(page);
        await expectCancelClosesCreateWorkflowDialog(page, routeBeforeDialog);
      });

      test('from step 2 returns to route active before dialog open', async ({ page }) => {
        const routeBeforeDialog = page.url();
        await openCreateWorkflowDialogStep2(page, manifest.project_title);
        await expectCancelClosesCreateWorkflowDialog(page, routeBeforeDialog);
      });

      test('from step 3 blank mode returns to route active before dialog open', async ({
        page,
      }) => {
        const routeBeforeDialog = page.url();
        await openCreateWorkflowDialogBlankStep3(page, manifest.project_title);
        await workflowTitleField(page).fill('Would not persist if created');
        await expectCancelClosesCreateWorkflowDialog(page, routeBeforeDialog);
      });

      test('from step 3 template mode returns to route active before dialog open', async ({
        page,
      }) => {
        const routeBeforeDialog = page.url();
        await openCreateWorkflowTemplateStep3(page, DEFAULT_ENTRY, manifest.project_title);
        await expectCancelClosesCreateWorkflowDialog(page, routeBeforeDialog);
      });
    });
  });

  test.describe('FR-WF-CREATE-STEPPER-002: no eligible destination projects', () => {
    // Default chromium storage state is teacher@courseflow.com, who owns the E2E fixture projects.
    // FR-WF-CREATE-STEPPER-002 needs an authenticated user with no owner or editor role on any
    // project, plus createWorkflowNoEligibleProjectsDialog in CreateWizardDialog.
    test.skip('shows no-eligible-projects warning, disables Next step, and blocks advance to step 2', async ({
      page,
    }) => {
      await openCreateWorkflowDialogStep1(page);
    });
  });

  test.describe('FR-WF-CREATE-STEPPER-003: step 1 select destination project', () => {
    test('shows project search view with at most four projectCard items', async ({ page }) => {
      await openCreateWorkflowDialogStep1(page);

      await expect(workflowProjectSearchField(page)).toBeVisible();
      await expect(workflowProjectSearchView(page)).toBeVisible();

      const projectCards = createWorkflowDialogProjectCards(page);
      const count = await projectCards.count();
      if (count === 0) {
        test.skip(true, 'No eligible project cards in create-workflow step 1.');
      }
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(4);
    });

    test('Next step stays disabled until a projectCard is selected', async ({ page }) => {
      await openCreateWorkflowDialogStep1(page);

      const projectCard = createWorkflowDialogProjectCardByTitle(page, manifest.project_title);
      if ((await projectCard.count()) === 0) {
        test.skip(true, 'E2E fixture project card not visible in create-workflow step 1.');
      }

      await expect(createWorkflowDialogNextStep(page)).toBeDisabled();
      await projectCard.click();
      await expect(projectCard).toHaveClass(/selected/);
      await expect(createWorkflowDialogNextStep(page)).toBeEnabled();
    });

    test('advances to step 2 after project selection', async ({ page }) => {
      await openCreateWorkflowDialogStep1(page);

      const projectCard = createWorkflowDialogProjectCardByTitle(page, manifest.project_title);
      if ((await projectCard.count()) === 0) {
        test.skip(true, 'E2E fixture project card not visible in create-workflow step 1.');
      }

      await projectCard.click();
      await createWorkflowDialogNextStep(page).click();
      await expect(createWorkflowDialogTitle(page)).toHaveText(DEFAULT_ENTRY.step2DialogTitle);
    });

    test('zero-match search shows empty state and disables Next step', async ({ page }) => {
      await openCreateWorkflowDialogStep1(page);

      const projectCard = createWorkflowDialogProjectCardByTitle(page, manifest.project_title);
      if ((await projectCard.count()) === 0) {
        test.skip(true, 'E2E fixture project card not visible in create-workflow step 1.');
      }

      await workflowProjectSearchField(page).fill('zzz-no-matching-project-title');
      await workflowProjectSearchField(page).press('Enter');
      await waitForCreateWorkflowProjectSearchLoaded(page);

      await expect(workflowProjectSearchEmptyState(page)).toBeVisible();
      await expect(createWorkflowDialogProjectCards(page)).toHaveCount(0);
      await expect(createWorkflowDialogNextStep(page)).toBeDisabled();
    });
  });

  test.describe('FR-WF-CREATE-STEPPER-004: step 2 choose blank or template creation mode', () => {
    for (const entry of CREATE_WORKFLOW_ENTRIES) {
      test(`${entry.workflowType}: shows both creation modes with blank default and step 2 dialog title`, async ({
        page,
      }) => {
        await openCreateWorkflowDialogStep2(page, manifest.project_title, entry);

        await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);
        await expect(workflowCreationModeBlankOption(page, entry.workflowType)).toBeVisible();
        await expect(workflowCreationModeTemplateOption(page)).toBeVisible();
        await expect(createWorkflowPreviousStepButton(page)).toBeVisible();
        await expect(createWorkflowDialogNextStep(page)).toBeEnabled();
      });

      test(`${entry.workflowType}: Next step opens blank step 3 when blank mode is default`, async ({
        page,
      }) => {
        await openCreateWorkflowDialogStep2(page, manifest.project_title, entry);

        await createWorkflowDialogNextStep(page).click();
        await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3BlankDialogTitle);
        await expect(workflowTitleField(page)).toBeVisible();
      });

      test(`${entry.workflowType}: template mode opens template step 3`, async ({ page }) => {
        await openCreateWorkflowDialogStep2(page, manifest.project_title, entry);

        await workflowCreationModeTemplateOption(page).click();
        await createWorkflowDialogNextStep(page).click();
        await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3TemplateDialogTitle);
      });

      test(`${entry.workflowType}: blank mode opens blank step 3 after selecting blank option`, async ({
        page,
      }) => {
        await openCreateWorkflowDialogStep2(page, manifest.project_title, entry);

        await workflowCreationModeTemplateOption(page).click();
        await workflowCreationModeBlankOption(page, entry.workflowType).click();
        await createWorkflowDialogNextStep(page).click();
        await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3BlankDialogTitle);
        await expect(workflowTitleField(page)).toBeVisible();
      });

      test(`${entry.workflowType}: Previous step returns to step 1 with project still selected`, async ({
        page,
      }) => {
        await openCreateWorkflowDialogStep1(page, entry);

        const projectCard = createWorkflowDialogProjectCardByTitle(page, manifest.project_title);
        if ((await projectCard.count()) === 0) {
          test.skip(true, 'E2E fixture project card not visible in create-workflow step 1.');
        }

        await projectCard.click();
        await createWorkflowDialogNextStep(page).click();
        await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);

        await createWorkflowPreviousStepButton(page).click();
        await expect(createWorkflowDialogTitle(page)).toHaveText('Select project');
        await expect(projectCard).toHaveClass(/selected/);
        await expect(createWorkflowDialogNextStep(page)).toBeEnabled();
      });

      test(`${entry.workflowType}: returning from template step 3 preserves template mode`, async ({
        page,
      }) => {
        await openCreateWorkflowDialogStep2(page, manifest.project_title, entry);
        await workflowCreationModeTemplateOption(page).click();
        await createWorkflowDialogNextStep(page).click();
        await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3TemplateDialogTitle);

        await createWorkflowPreviousStepButton(page).click();
        await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);
        await expect(createWorkflowDialogNextStep(page)).toBeEnabled();

        await createWorkflowDialogNextStep(page).click();
        await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3TemplateDialogTitle);
      });
    }
  });

  test.describe('FR-WF-CREATE-STEPPER-005: step 3 blank workflow form and submit outcome', () => {
    for (const entry of CREATE_WORKFLOW_ENTRIES) {
      test(`${entry.workflowType}: blank step 3 shows form, title field, and optional description`, async ({
        page,
      }) => {
        await openCreateWorkflowDialogBlankStep3(page, manifest.project_title, entry);

        await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3BlankDialogTitle);
        await expect(workflowBlankForm(page)).toBeVisible();
        await expect(workflowTitleField(page)).toBeVisible();
        await expect(workflowDescriptionField(page, entry.workflowType)).toBeVisible();
        await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeVisible();
      });

      test(`${entry.workflowType}: workflowTitleField is required — submit enabled only when title is non-empty`, async ({
        page,
      }) => {
        await openCreateWorkflowDialogBlankStep3(page, manifest.project_title, entry);

        await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeDisabled();

        await workflowDescriptionField(page, entry.workflowType).fill(
          'Description only — must not enable submit without title',
        );
        await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeDisabled();

        await workflowTitleField(page).fill(`E2E ${entry.workflowType} title`);
        await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeEnabled();

        await workflowTitleField(page).fill('');
        await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeDisabled();
      });

      test(`${entry.workflowType}: Previous step returns to step 2 with destination project preserved`, async ({
        page,
      }) => {
        await openCreateWorkflowDialogBlankStep3(page, manifest.project_title, entry);

        await createWorkflowPreviousStepButton(page).click();
        await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);

        await createWorkflowPreviousStepButton(page).click();
        await expect(createWorkflowDialogTitle(page)).toHaveText('Select project');
        const projectCard = createWorkflowDialogProjectCardByTitle(page, manifest.project_title);
        await expect(projectCard).toHaveClass(/selected/);
      });

      test(`${entry.workflowType}: returning from step 2 preserves blank form values`, async ({
        page,
      }) => {
        const title = `E2E blank ${entry.workflowType} ${Date.now()}`;
        const description = 'Optional description for FR-WF-CREATE-STEPPER-005';

        await openCreateWorkflowDialogBlankStep3(page, manifest.project_title, entry);
        await workflowTitleField(page).fill(title);
        await workflowDescriptionField(page, entry.workflowType).fill(description);
        await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeEnabled();

        await createWorkflowPreviousStepButton(page).click();
        await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step2DialogTitle);

        await createWorkflowDialogNextStep(page).click();
        await expect(createWorkflowDialogTitle(page)).toHaveText(entry.step3BlankDialogTitle);
        await expect(workflowTitleField(page)).toHaveValue(title);
        await expect(workflowDescriptionField(page, entry.workflowType)).toHaveValue(description);
        await expect(createWorkflowSubmitButton(page, entry.workflowType)).toBeEnabled();
      });

      test(`${entry.workflowType}: blank create navigates to workflow graph with success feedback and defaults`, async ({
        page,
      }) => {
        const uniqueTitle = `E2E ${entry.workflowType} ${Date.now()}`;

        await openCreateWorkflowDialogBlankStep3(page, manifest.project_title, entry);
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
    }

    // FR-WF-CREATE-STEPPER-005 failure snackbar needs a deterministic API-failure harness.
    test.skip('shows failure snackbar when blank create submit fails', async () => {});
  });

  test.describe('FR-WF-CREATE-STEPPER-006: step 3 template picker', () => {
    for (const entry of CREATE_WORKFLOW_ENTRIES) {
      test(`${entry.workflowType} template workflowCard shows Template chip (FR-CARD-002)`, async ({
        page,
      }) => {
        const templateFixture = getTemplateWorkflowFixture(manifest, entry.workflowType);
        const dialog = await openCreateWorkflowTemplateStep3(page, entry, manifest.project_title);

        const templateCard = cardByTitle(dialog, templateFixture.workflow_title);
        await expect(templateCard).toBeVisible({ timeout: 15_000 });
        await expect(cardChipWithLabel(templateCard, 'Template')).toBeVisible();
      });
    }
  });
});
