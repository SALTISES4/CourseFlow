import { expect, type Page } from '@playwright/test';

import {
  createWorkflowCancelButton,
  createWorkflowDialog,
  createWorkflowDialogProjectCards,
  createWorkflowStepper,
  workflowProjectSearchEmptyState,
} from '../e2e/home/home.locators';
import { workflowChannelsHeaderRow } from '../shared/locators/workflow';

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
      headers.filter({ has: page.getByText('Custom node category', { exact: true }) }),
    ).toHaveCount(3);
    return;
  }

  for (const title of titles) {
    await expect(
      headers.filter({ has: page.getByText(title, { exact: true }) }),
    ).toHaveCount(1);
  }
  await expect(headers).toHaveCount(titles.length);
}
