import { expect, type Page } from '@playwright/test';

import {
  createWorkflowDialog,
  createWorkflowDialogTitle,
  createWorkflowStepper,
} from '../e2e/home/home.locators';
import {
  addMenuItemActivity,
  addMenuItemCourse,
  addMenuDropdown,
  addMenuItemProgram,
  addMenuItemProject,
  addMenuTrigger,
  createProjectDialog,
} from '../e2e/navigation/navigation.locators';
import { createProjectFormDialogTitle } from '../e2e/project/project.locators';
import {
  createWorkflowStepperLabels,
  expectCreateWorkflowStepperStepLabels,
} from './create-workflow';

export type AddMenuWorkflowType = 'activity' | 'course' | 'program';

const ADD_MENU_WORKFLOW_ITEM_BY_TYPE = {
  program: addMenuItemProgram,
  course: addMenuItemCourse,
  activity: addMenuItemActivity,
} as const;

/** FR-TOP-002 — open add menu dropdown from top navigation. */
export async function openAddMenuDropdown(page: Page): Promise<void> {
  await addMenuTrigger(page).click();
}

/** FR-TOP-002 — add menu lists Project, Program, Course, and Activity rows. */
export async function expectAddMenuCreateRowsVisiblePerFrTop002(page: Page): Promise<void> {
  await openAddMenuDropdown(page);
  await expect(addMenuDropdown(page)).toBeVisible();
  await expect(addMenuItemProject(page)).toBeVisible();
  await expect(addMenuItemProgram(page)).toBeVisible();
  await expect(addMenuItemCourse(page)).toBeVisible();
  await expect(addMenuItemActivity(page)).toBeVisible();
}

/** FR-TOP-002 — Project opens createProjectDialog (not createWorkflowDialog). */
export async function expectAddMenuProjectOpensCreateProjectFormPerFrTop002(
  page: Page,
): Promise<void> {
  await openAddMenuDropdown(page);
  await addMenuItemProject(page).click();
  await expect(createProjectDialog(page)).toBeVisible();
  await expect(createProjectFormDialogTitle(page)).toBeVisible();
  await expect(createWorkflowStepper(page)).toHaveCount(0);
}

/** FR-TOP-002 — workflow add-menu row opens createWorkflowDialog with type-specific stepper copy. */
export async function expectAddMenuWorkflowOpensCreateWorkflowDialogPerFrTop002(
  page: Page,
  workflowType: AddMenuWorkflowType,
): Promise<void> {
  await openAddMenuDropdown(page);
  await ADD_MENU_WORKFLOW_ITEM_BY_TYPE[workflowType](page).click();
  await expect(createWorkflowDialog(page)).toBeVisible();
  await expect(createProjectFormDialogTitle(page)).toHaveCount(0);
  await expect(createWorkflowDialogTitle(page)).toHaveText('Select project');
  await expectCreateWorkflowStepperStepLabels(page, createWorkflowStepperLabels(workflowType));
}
