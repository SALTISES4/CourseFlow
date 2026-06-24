import type { Locator, Page } from '@playwright/test';

/**
 * Locators for Home dashboard e2e — aligned with
 * tests/docs/requirements/features/shared/canonical_locators.yaml (home* uiObjects).
 */

export const HOME_WELCOME_HEADING = 'Welcome to CourseFlow';
export const HOME_RECENT_PROJECTS_TITLE = 'Recent projects';
export const HOME_VIEW_ALL_PROJECTS = 'View all projects';
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

export function homeViewAllProjectsLink(page: Page): Locator {
  return page.getByRole('link', { name: HOME_VIEW_ALL_PROJECTS, exact: true });
}

export function homeTemplatesSectionTitle(page: Page): Locator {
  return page.getByRole('heading', {
    name: new RegExp(`^(${HOME_TEMPLATES_TITLE_EXPLORE}|${HOME_TEMPLATES_TITLE_GET_STARTED})$`),
  });
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

export function homeErrorState(page: Page): Locator {
  return page.getByText('There was an error loading this content');
}
