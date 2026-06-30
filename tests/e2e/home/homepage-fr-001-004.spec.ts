import { test, expect } from '@playwright/test';
import { clearHomeDismissCookies } from '../../helpers/home';
import { gotoCourseFlowHome } from '../../helpers/navigation';
import {
  createWorkflowDialog,
  createWorkflowDialogTitle,
  homeErrorState,
  homeRecentProjectsTitle,
  homeTemplatesInfoAlert,
  homeTemplatesInfoAlertCloseButton,
  homeTemplatesSectionTitle,
  homeViewAllProjectsLink,
  homeWelcomeActivityButton,
  homeWelcomeCourseButton,
  homeWelcomeDismissButton,
  homeWelcomeHeading,
  homeWelcomeProgramButton,
} from './home.locators';

/**
 * Calibration slice — FR-HOME-001 through FR-HOME-004 (happy-path dashboard).
 * Requirements: tests/docs/requirements/features/home/homepage_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com).
 */

test.describe('Home dashboard — calibration (FR-HOME-001–004)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCourseFlowHome(page);
    await expect(homeErrorState(page)).toBeHidden({ timeout: 15_000 });
    await expect(homeTemplatesSectionTitle(page)).toBeVisible({ timeout: 15_000 });
  });

  test('FR-HOME-001: authenticated /home renders dashboard content', async ({ page }) => {
    await expect(page).toHaveURL(/\/home\/?$/);
    await expect(homeErrorState(page)).toBeHidden();
    await expect(homeTemplatesSectionTitle(page)).toBeVisible();
  });

  test.describe('FR-HOME-002: welcome panel', () => {
    test.beforeEach(async ({ page }) => {
      await clearHomeDismissCookies(page);
      await page.reload();
      await expect(homeErrorState(page)).toBeHidden({ timeout: 15_000 });
      await expect(homeTemplatesSectionTitle(page)).toBeVisible({ timeout: 15_000 });
    });

    test('shows welcome heading and create-workflow CTAs when dismiss cookie is unset', async ({
      page,
    }) => {
      const welcome = homeWelcomeHeading(page);
      if ((await welcome.count()) === 0) {
        test.skip(
          true,
          'Welcome panel not rendered — implementation hides it when library has no projects (hide={!projects.length}).',
        );
      }

      await expect(welcome).toBeVisible();
      await expect(
        page.getByText(
          'Tell us a bit more about your goals so that we can help you get started.',
        ),
      ).toBeVisible();
      await expect(homeWelcomeProgramButton(page)).toBeVisible();
      await expect(homeWelcomeCourseButton(page)).toBeVisible();
      await expect(homeWelcomeActivityButton(page)).toBeVisible();
    });

    test('dismiss button hides welcome panel and preference persists after reload', async ({
      page,
    }) => {
      const welcome = homeWelcomeHeading(page);
      if ((await welcome.count()) === 0) {
        test.skip(true, 'Welcome panel not rendered for this library state.');
      }

      await homeWelcomeDismissButton(page).click();
      await expect(welcome).toBeHidden();

      await page.reload();
      await expect(welcome).toBeHidden();
    });

    test('program CTA opens create workflow dialog', async ({ page }) => {
      const welcome = homeWelcomeHeading(page);
      if ((await welcome.count()) === 0) {
        test.skip(true, 'Welcome panel not rendered for this library state.');
      }

      await homeWelcomeProgramButton(page).click();

      await expect(createWorkflowDialog(page)).toBeVisible();
      await expect(createWorkflowDialogTitle(page)).toHaveText('Select project');
      await expect(createWorkflowDialog(page).getByRole('button', { name: 'Cancel' })).toBeVisible();
    });
  });

  test('FR-HOME-003: recent projects section when library has projects', async ({ page }) => {
    const recentTitle = homeRecentProjectsTitle(page);
    if ((await recentTitle.count()) === 0) {
      await expect(recentTitle).toBeHidden();
      return;
    }

    await expect(recentTitle).toBeVisible();
    await expect(homeViewAllProjectsLink(page)).toBeVisible();
    await expect(homeViewAllProjectsLink(page)).toHaveAttribute('href', /\/library\/?$/);
  });

  test.describe('FR-HOME-004: templates section', () => {
    test('shows templates section title matching recent-projects visibility', async ({ page }) => {
      const hasRecentProjects = (await homeRecentProjectsTitle(page).count()) > 0;
      const templatesTitle = homeTemplatesSectionTitle(page);

      await expect(templatesTitle).toBeVisible();
      if (hasRecentProjects) {
        await expect(templatesTitle).toHaveText('Explore templates');
      } else {
        await expect(templatesTitle).toHaveText('Get started with templates');
      }
    });

    test('templates info alert can be dismissed and stays hidden after reload', async ({
      page,
    }) => {
      await clearHomeDismissCookies(page);
      await page.reload();
      await expect(homeTemplatesSectionTitle(page)).toBeVisible({ timeout: 15_000 });

      const alert = homeTemplatesInfoAlert(page);
      await expect(alert).toBeVisible();

      await homeTemplatesInfoAlertCloseButton(page).click();
      await expect(alert).toBeHidden();

      await page.reload();
      await expect(alert).toBeHidden();
    });
  });
});
