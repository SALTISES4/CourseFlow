import { expect, type Page } from '@playwright/test';
import {
  createWorkflowCancelButton,
  createWorkflowDialog,
  createWorkflowDialogNextStep,
  createWorkflowDialogProjectCardByTitle,
  createWorkflowDialogProjectCards,
  createWorkflowDialogTitle,
  createWorkflowStepper,
  createWorkflowSubmitButton,
  WORKFLOW_BLANK_FORM_FORBIDDEN_METADATA_LABELS,
  workflowBlankDescriptionVisibleLabel,
  workflowBlankForm,
  workflowBlankFormVisibleLabel,
  workflowBlankTitleVisibleLabel,
  workflowCreationModeBlankOptionBlock,
  workflowCreationModeTemplateOptionBlock,
  workflowDescriptionField,
  workflowProjectSearchEmptyState,
  workflowProjectSearchField,
  workflowTitleField,
} from '../e2e/home/home.locators';
import {
  addMenuItemActivity,
  addMenuItemCourse,
  addMenuItemProgram,
  addMenuTrigger,
} from '../shared/locators/navigation';
import {
  workflowAddTabCustomNodeCategoryItem,
  workflowAddTabNodeCategoriesGroup,
  workflowAddTabNodeCategoryItems,
} from '../e2e/workflow/workflow-add-tab.locators';
import { workflowChannelsHeaderRow, workflowRightSidebarAddTab } from '../shared/locators/workflow';
import { globalMessageSnackbar } from '../shared/locators/global';
import { gotoAuthenticatedShell } from './navigation';

export type CreateWorkflowStepperLabels = {
  step2: string;
  step3: string;
};

export function createWorkflowStepperLabels(
  workflowType: 'activity' | 'course' | 'program',
): CreateWorkflowStepperLabels {
  return {
    step2: `Select ${workflowType} type`,
    step3: `Create ${workflowType}`,
  };
}

/** Dialog titles per FR-WF-CREATE-STEPPER-004/005/006 (createWorkflowDialogTitle). */
export function createWorkflowDialogTitles(workflowType: 'activity' | 'course' | 'program') {
  return {
    step2DialogTitle: `Select ${workflowType} type`,
    step3BlankDialogTitle: `Create blank ${workflowType}`,
    step3TemplateDialogTitle: `Create ${workflowType} from a template`,
  };
}

/** FR-WF-CREATE-STEPPER-001 — stepper shows Select project, Select {type} type, Create {type}. */
export async function expectCreateWorkflowStepperStepLabels(
  page: Page,
  labels: CreateWorkflowStepperLabels,
): Promise<void> {
  const stepper = createWorkflowStepper(page);
  await expect(stepper).toBeVisible();
  await expect(stepper.getByText('Select project', { exact: true })).toBeVisible();
  await expect(stepper.getByText(labels.step2, { exact: true })).toBeVisible();
  await expect(stepper.getByText(labels.step3, { exact: true })).toBeVisible();
}

export async function waitForCreateWorkflowProjectSearchLoaded(page: Page): Promise<void> {
  const dialog = createWorkflowDialog(page);
  await expect(dialog.locator('[data-test-id="library-loading-skeleton"]')).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(
    createWorkflowDialogProjectCards(page).first().or(workflowProjectSearchEmptyState(page)),
  ).toBeVisible({ timeout: 15_000 });
}

/**
 * Select a destination project on step 1, searching by title when it is outside the
 * unfiltered 4-card window (FR-WF-CREATE-STEPPER-003).
 */
export async function selectCreateWorkflowDestinationProject(
  page: Page,
  projectTitle: string,
): Promise<void> {
  let projectCard = createWorkflowDialogProjectCardByTitle(page, projectTitle);
  if ((await projectCard.count()) === 0) {
    await workflowProjectSearchField(page).fill(projectTitle);
    await workflowProjectSearchField(page).press('Enter');
    projectCard = createWorkflowDialogProjectCardByTitle(page, projectTitle);
    await expect(projectCard).toBeVisible({ timeout: 15_000 });
  }
  await projectCard.click();
  await expect(projectCard).toHaveClass(/selected/);
}

/** FR-WF-CREATE-STEPPER-004 — blank option selected (primary border) vs template. */
export async function expectCreateWorkflowCreationModeSelected(
  page: Page,
  workflowType: 'activity' | 'course' | 'program',
  mode: 'blank' | 'template',
): Promise<void> {
  const blank = workflowCreationModeBlankOptionBlock(page, workflowType);
  const template = workflowCreationModeTemplateOptionBlock(page);
  await expect(blank).toBeVisible();
  await expect(template).toBeVisible();

  const blankBorder = await blank.evaluate((el) => getComputedStyle(el).borderColor);
  const templateBorder = await template.evaluate((el) => getComputedStyle(el).borderColor);

  if (mode === 'blank') {
    expect(blankBorder, 'blank creation mode should use selected (primary) border').not.toBe(
      templateBorder,
    );
  } else {
    expect(templateBorder, 'template creation mode should use selected (primary) border').not.toBe(
      blankBorder,
    );
  }
}

/**
 * FR-WF-CREATE-STEPPER-005 — blank form chrome: type-scoped title and description labels,
 * and no type-varying metadata fields.
 */
export async function expectBlankWorkflowFormLayoutPerFrCreateStepper005(
  page: Page,
  workflowType: 'activity' | 'course' | 'program',
): Promise<void> {
  await expect(workflowBlankForm(page)).toBeVisible();
  await expect(
    workflowBlankFormVisibleLabel(page, workflowBlankTitleVisibleLabel(workflowType)),
  ).toBeVisible();
  await expect(workflowTitleField(page)).toBeVisible();
  await expect(
    workflowBlankFormVisibleLabel(page, workflowBlankDescriptionVisibleLabel(workflowType)),
  ).toBeVisible();
  const description = workflowDescriptionField(page, workflowType);
  await expect(description).toBeVisible();
  await expect(description).toHaveAttribute('contenteditable', 'true');
  await expect(
    workflowBlankForm(page).getByRole('toolbar', { name: 'Description formatting' }),
  ).toBeVisible();

  for (const label of WORKFLOW_BLANK_FORM_FORBIDDEN_METADATA_LABELS) {
    await expect(
      workflowBlankForm(page).getByText(label, { exact: true }),
      `FR-WF-CREATE-STEPPER-005: blank form must not show metadata field ${JSON.stringify(label)}`,
    ).toHaveCount(0);
  }
}

/** FR-WF-CREATE-STEPPER-001 — Cancel closes dialog, no workflow route, returns to pre-dialog URL. */
export async function expectCancelClosesCreateWorkflowDialog(
  page: Page,
  routeBeforeDialog: string,
): Promise<void> {
  await createWorkflowCancelButton(page).click();
  await expect(createWorkflowDialog(page)).toBeHidden();
  await expect(page).toHaveURL(routeBeforeDialog);
  await expect(page).not.toHaveURL(/\/workflow\/[^/]+/);
}

/** FR-WF-CREATE-STEPPER-005 — success snackbar copy per requirements. */
export function createWorkflowBlankSuccessSnackbarText(
  workflowType: 'activity' | 'course' | 'program',
): string {
  return `Your ${workflowType} has been successfully created`;
}

/** FR-WF-CREATE-STEPPER-005 — failure snackbar copy per requirements. */
export function createWorkflowBlankFailureSnackbarText(
  workflowType: 'activity' | 'course' | 'program',
): string {
  return `We encountered an issue and your ${workflowType} was not created`;
}

/** Default workflowChannel titles per FR-WF-ADD-003 (unchanged defaults at blank create). */
export const DEFAULT_WORKFLOW_CHANNEL_TITLES_BY_TYPE: Record<
  'activity' | 'course' | 'program',
  readonly string[]
> = {
  activity: [
    'Out of class (instructor)',
    'Out of class (students)',
    'In class (instructor)',
    'In class (students)',
  ],
  course: ['Preparation', 'Lesson', 'Artifact', 'Assessment'],
  program: ['Custom node category', 'Custom node category', 'Custom node category'],
};

/** FR-WF-CREATE-STEPPER-005 / FR-WF-ADD-003 — default channels in workflowChannelsHeaderRow. */
export async function expectDefaultWorkflowChannelsInHeaderRow(
  page: Page,
  workflowType: 'activity' | 'course' | 'program',
): Promise<void> {
  const row = workflowChannelsHeaderRow(page);
  await expect(row).toBeVisible();
  const titles = DEFAULT_WORKFLOW_CHANNEL_TITLES_BY_TYPE[workflowType];
  const headers = row.locator('[data-column-id]');

  if (workflowType === 'program') {
    await expect(
      headers.filter({
        has: page.getByText('Custom node category', { exact: true }),
      }),
    ).toHaveCount(3);
    return;
  }

  for (const title of titles) {
    await expect(headers.filter({ has: page.getByText(title, { exact: true }) })).toHaveCount(1);
  }
  await expect(headers).toHaveCount(titles.length);
}

const OPEN_CREATE_WORKFLOW_MENU_ITEM: Record<
  'activity' | 'course' | 'program',
  (page: Page) => ReturnType<typeof addMenuItemActivity>
> = {
  activity: addMenuItemActivity,
  course: addMenuItemCourse,
  program: addMenuItemProgram,
};

/**
 * FR-WF-CREATE-STEPPER-005 — blank-create a workflow from Home and land on its graph route.
 * Clears Duration before submit (form default is numeric 0; schema expects a string).
 */
export async function createBlankWorkflowFromHome(
  page: Page,
  options: {
    workflowType: 'activity' | 'course' | 'program';
    projectTitle: string;
    title: string;
  },
): Promise<string> {
  const { workflowType, projectTitle, title } = options;
  const titles = createWorkflowDialogTitles(workflowType);

  await gotoAuthenticatedShell(page, '/home');
  await addMenuTrigger(page).click();
  await OPEN_CREATE_WORKFLOW_MENU_ITEM[workflowType](page).click();
  await expect(createWorkflowDialog(page)).toBeVisible();
  await waitForCreateWorkflowProjectSearchLoaded(page);

  const projectCard = createWorkflowDialogProjectCardByTitle(page, projectTitle);
  if ((await projectCard.count()) === 0) {
    await workflowProjectSearchField(page).fill(projectTitle);
    await workflowProjectSearchField(page).press('Enter');
    await expect(createWorkflowDialogProjectCardByTitle(page, projectTitle)).toBeVisible({
      timeout: 15_000,
    });
  }
  await createWorkflowDialogProjectCardByTitle(page, projectTitle).click();
  await createWorkflowDialogNextStep(page).click();
  await expect(createWorkflowDialogTitle(page)).toHaveText(titles.step2DialogTitle);
  await createWorkflowDialogNextStep(page).click();
  await expect(createWorkflowDialogTitle(page)).toHaveText(titles.step3BlankDialogTitle);

  await workflowTitleField(page).fill(title);
  // Product still renders Duration on blank create; clear numeric default so submit validates.
  const duration = createWorkflowDialog(page).getByLabel('Duration', {
    exact: true,
  });
  if ((await duration.count()) > 0) {
    await duration.fill('');
  }
  await createWorkflowSubmitButton(page, workflowType).click();

  await expect(createWorkflowDialog(page)).toBeHidden({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/workflow\/[0-9a-f-]+\/graph\/?$/);
  await expect(globalMessageSnackbar(page)).toHaveText(
    createWorkflowBlankSuccessSnackbarText(workflowType),
  );

  const workflowUuid = new URL(page.url()).pathname.match(
    /^\/workflow\/([0-9a-f-]+)\/graph\/?$/,
  )?.[1];
  if (!workflowUuid) {
    throw new Error(`Could not read created workflow UUID from ${page.url()}`);
  }
  return workflowUuid;
}

/**
 * FR-WF-ADD-003 — Add tab lists default node categories for a newly created workflow type,
 * plus workflowAddTabCustomNodeCategoryItem.
 */
export async function expectDefaultAddTabNodeCategories(
  page: Page,
  workflowType: 'activity' | 'course' | 'program',
): Promise<void> {
  await workflowRightSidebarAddTab(page).click();
  await expect(workflowAddTabNodeCategoriesGroup(page)).toBeVisible({
    timeout: 15_000,
  });

  const expectedTitles = DEFAULT_WORKFLOW_CHANNEL_TITLES_BY_TYPE[workflowType];
  const items = workflowAddTabNodeCategoryItems(page);
  await expect(items).toHaveCount(expectedTitles.length);

  for (let index = 0; index < expectedTitles.length; index += 1) {
    await expect(items.nth(index)).toContainText(expectedTitles[index]!);
  }

  await expect(workflowAddTabCustomNodeCategoryItem(page)).toBeVisible();
  await expect(workflowAddTabCustomNodeCategoryItem(page)).toContainText('Custom node category');

  // Same defaults must appear on the canvas header (FR-WF-ADD-003 / FR-CHAN-002 alignment).
  await expectDefaultWorkflowChannelsInHeaderRow(page, workflowType);
}
