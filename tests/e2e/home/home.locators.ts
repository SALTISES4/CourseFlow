import type { Locator, Page } from '@playwright/test';

import {
  KEYWORD_SEARCH_PLACEHOLDER,
  LIBRARY_EMPTY_MESSAGE,
} from '../../shared/locators/library';

/**
 * Locators for Home dashboard e2e — aligned with
 * tests/docs/requirements/features/shared/canonical_locators.yaml (home* uiObjects).
 */

export const HOME_WELCOME_HEADING = 'Welcome to CourseFlow';
export const HOME_RECENT_PROJECTS_TITLE = 'Recent projects';
export const HOME_VIEW_ALL_PROJECTS = 'View all projects';
export const HOME_VIEW_ALL_TEMPLATES = 'View all templates';
export const HOME_TEMPLATES_TITLE_EXPLORE = 'Explore templates';
export const HOME_TEMPLATES_TITLE_GET_STARTED = 'Get started with templates';
export const HOME_TEMPLATES_ALERT_TITLE = 'How to use templates';
export const HOME_WELCOME_PROGRAM_LABEL = 'I want to create a program';
export const HOME_WELCOME_COURSE_LABEL = 'I want to create a course';
export const HOME_WELCOME_ACTIVITY_LABEL = 'I want to create an activity';

export const HIDE_HOME_WELCOME_COOKIE = 'hide_home_welcome_message';
export const HIDE_HOME_TEMPLATES_ALERT_COOKIE = 'hide_home_howto_template_message';

export function homeWelcomeHeading(page: Page): Locator {
  return page.getByRole('heading', { name: HOME_WELCOME_HEADING, exact: true });
}

export function homeWelcomeDismissButton(page: Page): Locator {
  return page.getByRole('button', { name: 'close' }).first();
}

export function homeWelcomeProgramButton(page: Page): Locator {
  return page.getByRole('button', { name: HOME_WELCOME_PROGRAM_LABEL, exact: true });
}

export function homeWelcomeCourseButton(page: Page): Locator {
  return page.getByRole('button', { name: HOME_WELCOME_COURSE_LABEL, exact: true });
}

export function homeWelcomeActivityButton(page: Page): Locator {
  return page.getByRole('button', { name: HOME_WELCOME_ACTIVITY_LABEL, exact: true });
}

export function homeRecentProjectsTitle(page: Page): Locator {
  return page.getByRole('heading', { name: HOME_RECENT_PROJECTS_TITLE, exact: true });
}

/** canonical: homeRecentProjectsSection — section wrapping recent project cards on /home */
export function homeRecentProjectsSection(page: Page): Locator {
  return page
    .locator('header')
    .filter({
      has: page.getByRole('heading', { name: HOME_RECENT_PROJECTS_TITLE, exact: true }),
    })
    .locator('..');
}

/** canonical: projectCard instances within homeRecentProjectsSection */
export function homeRecentProjectsProjectCards(page: Page): Locator {
  return homeRecentProjectsSection(page).locator('[data-test-id="project-card"]');
}

/** canonical: workflowCard instances within homeRecentProjectsSection (must be absent per FR-HOME-003) */
export function homeRecentProjectsWorkflowCards(page: Page): Locator {
  return homeRecentProjectsSection(page).locator('[data-test-id="workflow-card"]');
}

/** projectCard and workflowCard instances within homeRecentProjectsSection */
export function homeRecentProjectsCards(page: Page): Locator {
  return homeRecentProjectsSection(page).locator('[data-test-id$="-card"]');
}

export function homeViewAllProjectsLink(page: Page): Locator {
  return page.getByRole('link', { name: HOME_VIEW_ALL_PROJECTS, exact: true });
}

/** canonical: homeViewAllTemplatesLink */
export function homeViewAllTemplatesLink(page: Page): Locator {
  return homeTemplatesSection(page).getByRole('link', {
    name: HOME_VIEW_ALL_TEMPLATES,
    exact: true,
  });
}

/** workflowCard instances within homeTemplatesSection */
export function homeTemplatesWorkflowCards(page: Page): Locator {
  return homeTemplatesSection(page).locator('[data-test-id="workflow-card"]');
}

/** projectCard instances within homeTemplatesSection (must be absent per FR-HOME-004) */
export function homeTemplatesProjectCards(page: Page): Locator {
  return homeTemplatesSection(page).locator('[data-test-id="project-card"]');
}

/** projectCard and workflowCard instances within homeTemplatesSection */
export function homeTemplatesCards(page: Page): Locator {
  return homeTemplatesSection(page).locator('[data-test-id$="-card"]');
}

export function homeTemplatesSectionTitle(page: Page): Locator {
  return page.getByRole('heading', {
    name: new RegExp(`^(${HOME_TEMPLATES_TITLE_EXPLORE}|${HOME_TEMPLATES_TITLE_GET_STARTED})$`),
  });
}

/** canonical: homeTemplatesSection — section wrapping template content on /home */
export function homeTemplatesSection(page: Page): Locator {
  return page
    .locator('header')
    .filter({ has: homeTemplatesSectionTitle(page) })
    .locator('..');
}

/** canonical: homeLoadingIndicator — full-page loader while home context loads */
export function homeLoadingIndicator(page: Page): Locator {
  return page.locator('.load-screen');
}

export function homeTemplatesInfoAlert(page: Page): Locator {
  return page.getByRole('alert').filter({ hasText: HOME_TEMPLATES_ALERT_TITLE });
}

export function homeTemplatesInfoAlertCloseButton(page: Page): Locator {
  return homeTemplatesInfoAlert(page).getByRole('button', { name: 'Close' });
}

export function createWorkflowDialog(page: Page): Locator {
  return page.getByRole('dialog');
}

export function createWorkflowDialogTitle(page: Page): Locator {
  return createWorkflowDialog(page).getByRole('heading').first();
}

export function createWorkflowDialogNextStep(page: Page): Locator {
  return createWorkflowDialog(page).getByRole('button', { name: 'Next step', exact: true });
}

/** canonical: createWorkflowCancelButton */
export function createWorkflowCancelButton(page: Page): Locator {
  return createWorkflowDialog(page).getByRole('button', { name: 'Cancel', exact: true });
}

/** canonical: createWorkflowPreviousStepButton */
export function createWorkflowPreviousStepButton(page: Page): Locator {
  return createWorkflowDialog(page).getByRole('button', { name: 'Previous step', exact: true });
}

/** canonical: createWorkflowStepper — step indicator strip (MUI Stepper root) */
export function createWorkflowStepper(page: Page): Locator {
  return createWorkflowDialog(page).locator('.MuiStepper-root');
}

export function createWorkflowDialogFromTemplateOption(page: Page): Locator {
  return workflowCreationModeTemplateOption(page);
}

/** canonical: createWorkflowNoEligibleProjectsDialog (step 1) */
export function createWorkflowNoEligibleProjectsDialog(page: Page): Locator {
  return createWorkflowDialog(page).locator('[data-test-id="no-eligible-projects"]');
}

export const CREATE_WORKFLOW_NO_ELIGIBLE_PROJECTS_COPY = {
  title: 'You are not an owner or editor of any projects',
  body: 'All workflows, whether they are programs, courses, or activities, exist within projects. You must always start by creating a project before proceeding to create any type of workflow. Currently you are not the owner and have not been added as an editor of any project.',
} as const;

/** canonical: workflowCreationModeTemplateOption (step 2) */
export function workflowCreationModeTemplateOption(page: Page): Locator {
  return createWorkflowDialog(page).getByText('From a template', { exact: true });
}

/** TypeSelect option surface (TypeBlock) wrapping workflowCreationModeTemplateOption. */
export function workflowCreationModeTemplateOptionBlock(page: Page): Locator {
  return workflowCreationModeTemplateOption(page).locator('xpath=ancestor::*[@tabindex="0"][1]');
}

/** canonical: workflowCreationModeBlankOption (step 2) */
export function workflowCreationModeBlankOption(
  page: Page,
  workflowType: 'activity' | 'course' | 'program',
): Locator {
  return createWorkflowDialog(page).getByText(`Blank ${workflowType}`, { exact: true });
}

/** TypeSelect option surface (TypeBlock) wrapping workflowCreationModeBlankOption. */
export function workflowCreationModeBlankOptionBlock(
  page: Page,
  workflowType: 'activity' | 'course' | 'program',
): Locator {
  return workflowCreationModeBlankOption(page, workflowType).locator(
    'xpath=ancestor::*[@tabindex="0"][1]',
  );
}

/** canonical: workflowProjectSearchView (step 1) */
export function workflowProjectSearchView(page: Page): Locator {
  return createWorkflowDialog(page).locator('[data-test-id="library-results"]');
}

/** canonical: workflowProjectSearchField (step 1) */
export function workflowProjectSearchField(page: Page): Locator {
  return createWorkflowDialog(page).getByPlaceholder(KEYWORD_SEARCH_PLACEHOLDER);
}

/** canonical: workflowProjectSearchEmptyState (step 1) */
export function workflowProjectSearchEmptyState(page: Page): Locator {
  return createWorkflowDialog(page).getByText(LIBRARY_EMPTY_MESSAGE, { exact: true });
}

/** projectCard instances in createWorkflowDialog step 1 */
export function createWorkflowDialogProjectCards(page: Page): Locator {
  return createWorkflowDialog(page).locator('[data-test-id="project-card"]');
}

/** FR shared field labels on workflowBlankForm (create stepped form requirements). */
export const WORKFLOW_BLANK_FORM_VISIBLE_LABELS = {
  title: 'Title',
} as const;

/** Product-only / type-varying metadata labels that FR forbids on blank create (do not differ by type). */
export const WORKFLOW_BLANK_FORM_FORBIDDEN_METADATA_LABELS = [
  'Duration',
  'Unit type',
  'Course number',
  'Ponderation',
  'Theory (hrs)',
  'Practice (hrs)',
  'Individual work (hrs)',
  'General education (hrs)',
  'Specific education (hrs)',
] as const;

export function workflowBlankDescriptionVisibleLabel(
  workflowType: 'activity' | 'course' | 'program',
): string {
  const typeLabel = workflowType.charAt(0).toUpperCase() + workflowType.slice(1);
  return `${typeLabel} description`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Visible label text on workflowBlankForm (not accessibility-name inference). */
export function workflowBlankFormVisibleLabel(page: Page, label: string): Locator {
  return workflowBlankForm(page).locator('label').filter({
    hasText: new RegExp(`^${escapeRegExp(label)}([\\s\\u2009]*\\*)?$`),
  });
}

/** canonical: workflowTitleField (blank mode step 3) */
export function workflowTitleField(page: Page): Locator {
  return createWorkflowDialog(page).locator('input[name="title"]');
}

/** canonical: workflowFormFieldValidationMessage (blank create step 3) */
export function workflowFormFieldValidationMessage(page: Page, message: string): Locator {
  return createWorkflowDialog(page).getByText(message, { exact: true });
}

export const WORKFLOW_CREATE_TITLE_REQUIRED_MESSAGE = 'Title is required';
export const WORKFLOW_CREATE_TITLE_MAX_LENGTH_MESSAGE =
  'Title cannot be longer than 200 characters';

/** canonical: workflowBlankForm (blank mode step 3) */
export function workflowBlankForm(page: Page): Locator {
  return createWorkflowDialog(page).locator('form');
}

/** canonical: workflowDescriptionField (blank mode step 3) — FR label e.g. 'Activity description'. */
export function workflowDescriptionField(
  page: Page,
  workflowType: 'activity' | 'course' | 'program',
): Locator {
  return createWorkflowDialog(page).getByLabel(workflowBlankDescriptionVisibleLabel(workflowType), {
    exact: true,
  });
}

/** canonical: createWorkflowSubmitButton — label pattern 'Create {workflowType}' */
export function createWorkflowSubmitButton(
  page: Page,
  workflowType: 'activity' | 'course' | 'program',
): Locator {
  return createWorkflowDialog(page).getByRole('button', {
    name: `Create ${workflowType}`,
    exact: true,
  });
}

export function createWorkflowDialogProjectCardByTitle(page: Page, title: string): Locator {
  return createWorkflowDialog(page)
    .locator('[data-test-id="project-card"]')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
}

export function homeErrorState(page: Page): Locator {
  return page.getByText('There was an error loading this content');
}
