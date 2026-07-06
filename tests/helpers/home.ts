import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  createWorkflowDialog,
  createWorkflowDialogTitle,
  HIDE_HOME_TEMPLATES_ALERT_COOKIE,
  HIDE_HOME_WELCOME_COOKIE,
  homeRecentProjectsTitle,
  homeTemplatesSectionTitle,
  homeWelcomeActivityButton,
  homeWelcomeCourseButton,
  homeWelcomeHeading,
  homeWelcomeProgramButton,
} from '../e2e/home/home.locators';
import { expectFollowsInDocumentOrder } from '../shared/locators/cards';

/** Clears home dismiss cookies so welcome panel and templates alert can render. */
export async function clearHomeDismissCookies(page: Page): Promise<void> {
  await page.evaluate(
    ([welcomeCookie, templatesCookie]) => {
      for (const name of [welcomeCookie, templatesCookie]) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
      }
    },
    [HIDE_HOME_WELCOME_COOKIE, HIDE_HOME_TEMPLATES_ALERT_COOKIE] as const,
  );
}

/**
 * FR-HOME-001 — visible dashboard sections follow welcome → recent projects → templates.
 * Skips sections that are not rendered (dismissed welcome, no recent projects).
 */
export async function expectHomeDashboardSectionOrder(page: Page): Promise<void> {
  const visibleSections: Locator[] = [];

  const welcome = homeWelcomeHeading(page);
  if ((await welcome.count()) > 0) {
    await expect(welcome).toBeVisible();
    visibleSections.push(welcome);
  }

  const recentProjects = homeRecentProjectsTitle(page);
  if ((await recentProjects.count()) > 0) {
    await expect(recentProjects).toBeVisible();
    visibleSections.push(recentProjects);
  }

  const templates = homeTemplatesSectionTitle(page);
  await expect(templates).toBeVisible();
  visibleSections.push(templates);

  for (let i = 0; i < visibleSections.length - 1; i++) {
    await expectFollowsInDocumentOrder(visibleSections[i]!, visibleSections[i + 1]!);
  }
}

export async function skipUnlessWelcomePanelVisible(page: Page): Promise<void> {
  const welcome = homeWelcomeHeading(page);
  if ((await welcome.count()) === 0) {
    test.skip(
      true,
      'Welcome panel not rendered — implementation hides it when library has no projects.',
    );
  }
  await expect(welcome).toBeVisible();
}

/** FR-HOME-002 — activity, course, program CTAs appear in document order. */
export async function expectWelcomeCtaButtonOrder(page: Page): Promise<void> {
  const activity = homeWelcomeActivityButton(page);
  const course = homeWelcomeCourseButton(page);
  const program = homeWelcomeProgramButton(page);

  await expect(activity).toBeVisible();
  await expect(course).toBeVisible();
  await expect(program).toBeVisible();
  await expectFollowsInDocumentOrder(activity, course);
  await expectFollowsInDocumentOrder(course, program);
}

/** FR-HOME-002 — welcome CTA opens createWorkflowDialog step 1 (Select project). */
export async function expectWelcomeCtaOpensCreateWorkflowStepOne(
  page: Page,
  cta: Locator,
): Promise<void> {
  await cta.click();
  await expect(createWorkflowDialog(page)).toBeVisible();
  await expect(createWorkflowDialogTitle(page)).toHaveText('Select project');
  await expect(createWorkflowDialog(page).getByRole('button', { name: 'Cancel' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(createWorkflowDialog(page)).toBeHidden();
}
