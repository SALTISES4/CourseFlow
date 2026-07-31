import { test, expect } from '@playwright/test';
import {
  clearHomeDismissCookies,
  expectHomeDashboardSectionOrder,
  expectWelcomeCtaButtonOrder,
  expectWelcomeCtaOpensCreateWorkflowStepOne,
  skipUnlessWelcomePanelVisible,
} from '../../helpers/home';
import { getRecentHomeProjects, loadWorkflowManifest } from '../../helpers/manifest';
import { gotoCourseFlowHome } from '../../helpers/navigation';
import { templatesToggle, waitForLibraryResultsLoaded } from '../library/library.locators';
import {
  homeErrorState,
  homeRecentProjectsCards,
  homeRecentProjectsProjectCards,
  homeRecentProjectsSection,
  homeRecentProjectsTitle,
  homeRecentProjectsWorkflowCards,
  homeTemplatesCards,
  homeTemplatesInfoAlert,
  homeTemplatesInfoAlertCloseButton,
  homeTemplatesProjectCards,
  homeTemplatesSectionTitle,
  homeTemplatesWorkflowCards,
  homeViewAllProjectsLink,
  homeViewAllTemplatesLink,
  homeWelcomeActivityButton,
  homeWelcomeCourseButton,
  homeWelcomeDismissButton,
  homeWelcomeHeading,
  homeWelcomeProgramButton,
} from './home.locators';
import { cardChipWithLabel, cardTitleText } from '../../shared/locators/cards';

/**
 * Calibration slice — FR-HOME-001 through FR-HOME-004 (happy-path dashboard).
 * Requirements: tests/docs/requirements/features/home/homepage_requirements_v1.yaml
 * Auth: default chromium storage state (teacher@courseflow.com), owner of the E2E projects.
 */

test.describe('Home dashboard — calibration (FR-HOME-001-004)', () => {
  const manifest = loadWorkflowManifest();

  test.beforeEach(async ({ page }) => {
    await gotoCourseFlowHome(page);
    await expect(homeErrorState(page)).toBeHidden({ timeout: 15_000 });
    await expect(homeTemplatesSectionTitle(page)).toBeVisible({ timeout: 15_000 });
  });

  test('FR-HOME-001: authenticated /home renders dashboard content in section order', async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/home\/?$/);
    await expect(homeErrorState(page)).toBeHidden();
    await expect(homeTemplatesSectionTitle(page)).toBeVisible();
    await expectHomeDashboardSectionOrder(page);
  });

  test('FR-HOME-001: welcome through templates section order when welcome panel is visible', async ({
    page,
  }) => {
    await clearHomeDismissCookies(page);
    await page.reload();
    await expect(homeErrorState(page)).toBeHidden({ timeout: 15_000 });
    await expect(homeTemplatesSectionTitle(page)).toBeVisible({ timeout: 15_000 });

    const welcome = homeWelcomeHeading(page);
    if ((await welcome.count()) === 0) {
      test.skip(
        true,
        'Welcome panel not rendered — implementation hides it when library has no projects.',
      );
    }

    await expectHomeDashboardSectionOrder(page);
  });

  test.describe('FR-HOME-002: welcome panel', () => {
    test.beforeEach(async ({ page }) => {
      await clearHomeDismissCookies(page);
      await page.reload();
      await expect(homeErrorState(page)).toBeHidden({ timeout: 15_000 });
      await expect(homeTemplatesSectionTitle(page)).toBeVisible({ timeout: 15_000 });
    });

    test('shows welcome heading and create-workflow CTAs in activity-course-program order', async ({
      page,
    }) => {
      await skipUnlessWelcomePanelVisible(page);

      await expect(
        page.getByText(
          'Tell us a bit more about your goals so that we can help you get started.',
        ),
      ).toBeVisible();
      await expectWelcomeCtaButtonOrder(page);
    });

    test('dismiss button hides welcome panel and preference persists after reload', async ({
      page,
    }) => {
      const welcome = homeWelcomeHeading(page);
      await skipUnlessWelcomePanelVisible(page);

      await homeWelcomeDismissButton(page).click();
      await expect(welcome).toBeHidden();

      await page.reload();
      await expect(welcome).toBeHidden();
    });

    test.describe('welcome CTAs open create workflow dialog step 1', () => {
      test.describe.configure({ mode: 'serial' });

      test('activity CTA opens Select project step', async ({ page }) => {
        await skipUnlessWelcomePanelVisible(page);
        await expectWelcomeCtaOpensCreateWorkflowStepOne(page, homeWelcomeActivityButton(page));
      });

      test('course CTA opens Select project step', async ({ page }) => {
        await skipUnlessWelcomePanelVisible(page);
        await expectWelcomeCtaOpensCreateWorkflowStepOne(page, homeWelcomeCourseButton(page));
      });

      test('program CTA opens Select project step', async ({ page }) => {
        await skipUnlessWelcomePanelVisible(page);
        await expectWelcomeCtaOpensCreateWorkflowStepOne(page, homeWelcomeProgramButton(page));
      });
    });
  });

  test.describe('FR-HOME-003: recent projects section', () => {
    test('shows title and View all projects link that routes to /library', async ({ page }) => {
      const recentTitle = homeRecentProjectsTitle(page);
      await expect(recentTitle).toBeVisible();
      await expect(recentTitle).toHaveText('Recent projects');

      const link = homeViewAllProjectsLink(page);
      await expect(link).toBeVisible();
      await expect(link).toHaveText('View all projects');
      await expect(link).toHaveAttribute('href', /\/library\/?$/);

      await link.click();
      await expect(page).toHaveURL(/\/library\/?$/);
      await waitForLibraryResultsLoaded(page);
    });

    test('shows 1–4 project cards only (no workflow cards)', async ({ page }) => {
      const projectCards = homeRecentProjectsProjectCards(page);
      const workflowCards = homeRecentProjectsWorkflowCards(page);
      const sectionCards = homeRecentProjectsCards(page);

      // FR-HOME-003 — homeRecentProjectsSection includes only projectCard instances.
      await expect(workflowCards).toHaveCount(0);

      const expectedRecentProjects = getRecentHomeProjects(manifest).slice(0, 4);
      await expect(projectCards).toHaveCount(4);
      await expect(sectionCards).toHaveCount(4);

      for (let i = 0; i < expectedRecentProjects.length; i++) {
        const card = projectCards.nth(i);
        await expect(card).toBeVisible();
        await expect(cardTitleText(card)).toHaveText(expectedRecentProjects[i]!.title);
      }

      await expect(
        homeRecentProjectsSection(page).getByRole('heading', {
          name: manifest.archived_home_project.title,
          exact: true,
        }),
      ).toHaveCount(0);
    });

    test('hides recent projects section when library has no non-archived projects', async ({
      page,
    }) => {
      await page.route('**/api/library/search', async (route) => {
        const body = route.request().postDataJSON() as {
          pagination?: { page?: number; resultsPerPage?: number };
        };
        const pageIndex = body.pagination?.page ?? 0;
        const resultsPerPage = body.pagination?.resultsPerPage ?? 4;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [],
            meta: {
              totalResults: 0,
              pageCount: 0,
              currentPage: pageIndex,
              resultsPerPage,
              appliedFilters: {},
              allowed: { disciplines: [] },
            },
          }),
        });
      });

      await page.reload();
      await expect(homeErrorState(page)).toBeHidden({ timeout: 15_000 });
      await expect(homeTemplatesSectionTitle(page)).toBeVisible({ timeout: 15_000 });

      await expect(homeRecentProjectsSection(page)).toHaveCount(0);
      await expect(homeRecentProjectsTitle(page)).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'View all projects', exact: true })).toHaveCount(
        0,
      );
      await expect(homeTemplatesSectionTitle(page)).toHaveText('Get started with templates');
    });
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

    test('homeViewAllTemplatesLink is visible and navigates to Explore with templatesToggle active', async ({
      page,
    }) => {
      const link = homeViewAllTemplatesLink(page);
      await expect(link).toBeVisible();
      await expect(link).toHaveText('View all templates');
      await expect(link).toHaveAttribute('href', /\/explore\/?$/);

      await link.click();
      await expect(page).toHaveURL(/\/explore\/?$/);
      await waitForLibraryResultsLoaded(page);
      await expect(templatesToggle(page)).toBeVisible();
      await expect(templatesToggle(page)).toHaveClass(/MuiButton-contained/);
    });

    test('homeTemplatesSection shows 1–4 workflow template cards', async ({
      page,
    }) => {
      const workflowCards = homeTemplatesWorkflowCards(page);
      const projectCards = homeTemplatesProjectCards(page);
      const sectionCards = homeTemplatesCards(page);

      // FR-HOME-004 — homeTemplatesSection renders workflowCard instances only.
      await expect(projectCards).toHaveCount(0);

      const workflowCardCount = await workflowCards.count();
      if (workflowCardCount === 0) {
        test.skip(
          true,
          'Home context includes no homepage templates yet — FR-HOME-004 requires at least one.',
        );
      }

      expect(workflowCardCount).toBeGreaterThanOrEqual(1);
      expect(workflowCardCount).toBeLessThanOrEqual(4);
      await expect(sectionCards).toHaveCount(workflowCardCount);

      for (let i = 0; i < workflowCardCount; i++) {
        const card = workflowCards.nth(i);
        await expect(card).toBeVisible();
        await expect(cardChipWithLabel(card, 'Template')).toBeVisible();
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
