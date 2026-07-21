import { test, expect } from '@playwright/test';
import {
  expectRelatedWorkflowLinkOpensInNewTab,
  expectRelatedWorkflowLinksSortedAz,
  expectWorkflowContextSectionHidden,
  expectWorkflowContextSectionVisible,
  getNavigationLinkedWorkflows,
} from '../../helpers/main-navigation-workflow-context';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import {
  appearsInSection,
  brandLockup,
  containsSection,
  collapseToggle,
  exploreNavItem,
  favouritedItemLinks,
  favouritesSectionLabel,
  helpAndSupportLink,
  HELP_SUPPORT_URL,
  homeNavItem,
  mainNavigation,
  mainNavigationPanel,
  myLibraryNavItem,
  viewAllLink,
  waitForMainNavigationReady,
} from './navigation.locators';

/**
 * Calibration slice — FR-NAV-001 through FR-NAV-013.
 * Requirements: tests/docs/requirements/features/navigation/main_navigation_requirements_v1.yaml
 * Auth: chromium project storage state (teacher@courseflow.com).
 */

test.describe('Main navigation — calibration (FR-NAV-001-013)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, '/home');
    await waitForMainNavigationReady(page);
  });

  test('FR-NAV-001: sidebar shows brand, primary destinations, and help link', async ({ page }) => {
    await expect(mainNavigation(page)).toBeVisible();
    await expect(mainNavigationPanel(page)).toBeVisible();
    await expect(brandLockup(page)).toBeVisible();
    await expect(homeNavItem(page)).toBeVisible();
    await expect(myLibraryNavItem(page)).toBeVisible();
    await expect(exploreNavItem(page)).toBeVisible();
    await expect(helpAndSupportLink(page)).toBeVisible();

    const favouriteCount = await favouritedItemLinks(page).count();
    if (favouriteCount > 0) {
      await expect(favouritesSectionLabel(page)).toBeVisible();
      return;
    }

    await expect(favouritesSectionLabel(page)).toHaveCount(0);
    await expect(viewAllLink(page)).toHaveCount(0);
  });

  test('FR-NAV-002: Home nav item navigates to /home with selected styling', async ({ page }) => {
    await myLibraryNavItem(page).click();
    await expect(page).toHaveURL(/\/library\/?$/);

    await homeNavItem(page).click();
    await expect(page).toHaveURL(/\/home\/?$/);
    await expect(homeNavItem(page)).toHaveClass(/Mui-selected/);
  });

  test('FR-NAV-003: My library nav item navigates to /library with selected styling', async ({
    page,
  }) => {
    await myLibraryNavItem(page).click();
    await expect(page).toHaveURL(/\/library\/?$/);
    await expect(myLibraryNavItem(page)).toHaveClass(/Mui-selected/);
  });

  test('FR-NAV-004: Explore nav item navigates to /explore with selected styling', async ({
    page,
  }) => {
    await exploreNavItem(page).click();
    await expect(page).toHaveURL(/\/explore\/?$/);
    await expect(exploreNavItem(page)).toHaveClass(/Mui-selected/);
  });

  test.describe('Favourites sidebar (FR-NAV-005-008)', () => {
    test('FR-NAV-005/006: favourites section lists up to five favourited projects', async ({
      page,
    }) => {
      const favouriteCount = await favouritedItemLinks(page).count();
      if (favouriteCount === 0) {
        test.skip(true, 'No favourited projects in admin library for sidebar favourites tests.');
      }

      await expect(favouritesSectionLabel(page)).toBeVisible();
      expect(favouriteCount).toBeGreaterThanOrEqual(1);
      expect(favouriteCount).toBeLessThanOrEqual(5);

      if (favouriteCount >= 5) {
        await expect(viewAllLink(page)).toBeVisible();
      }
    });

    test('FR-NAV-007: View all navigates to /favourites when shown', async ({ page }) => {
      const viewAll = viewAllLink(page);
      if ((await viewAll.count()) === 0) {
        test.skip(
          true,
          'viewAllLink not shown — needs 5+ favourited projects (implementation threshold; FR-NAV-006 specifies 6+).',
        );
      }

      await viewAll.click();
      await expect(page).toHaveURL(/\/favourites\/?$/);
    });

    test('FR-NAV-008: favourited item navigates to parent project route', async ({ page }) => {
      const favourite = favouritedItemLinks(page).first();
      if ((await favourite.count()) === 0) {
        test.skip(true, 'No favourited projects available.');
      }

      await favourite.click();
      await expect(page).toHaveURL(/\/project\/[0-9a-f-]+\/?$/);
    });
  });

  test('FR-NAV-009: collapse toggle hides expanded panel content', async ({ page }) => {
    await mainNavigation(page).hover();
    await expect(collapseToggle(page)).toBeVisible();

    await page.mouse.move(800, 400);
    await expect(collapseToggle(page)).toBeHidden();

    await mainNavigation(page).hover();
    await collapseToggle(page).click();

    await expect(mainNavigationPanel(page)).toBeHidden();
    await expect(homeNavItem(page)).toBeHidden();
    await expect(collapseToggle(page)).toBeVisible();
  });

  test('FR-NAV-010: expand control restores expanded panel', async ({ page }) => {
    await mainNavigation(page).hover();
    await collapseToggle(page).click();
    await expect(mainNavigationPanel(page)).toBeHidden();

    await collapseToggle(page).click();
    await expect(mainNavigationPanel(page)).toBeVisible();

    await mainNavigation(page).hover();
    await expect(collapseToggle(page)).toBeVisible();
  });

  test('FR-NAV-011: Help and support opens Freshdesk in a new tab', async ({ page }) => {
    await expect(helpAndSupportLink(page)).toHaveAttribute('href', HELP_SUPPORT_URL);

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      helpAndSupportLink(page).click(),
    ]);

    await expect(popup).toHaveURL(/courseflow\.freshdesk\.com\/support\//);
  });
});

test.describe('Main navigation — workflow context (FR-NAV-012–013)', () => {
  test.describe('when workflow has no related links', () => {
    test('FR-NAV-012: activity workflow hides Contains', async ({ page }) => {
      const linked = getNavigationLinkedWorkflows();
      await gotoAuthenticatedShell(page, linked.activity.workflow_path);
      await waitForMainNavigationReady(page);

      await expectWorkflowContextSectionHidden(page, 'contains');
    });

    test('FR-NAV-012/013: program workflow without linked course hides Contains and Appears in', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await gotoAuthenticatedShell(page, linked.program.workflow_path);
      await waitForMainNavigationReady(page);

      await expectWorkflowContextSectionHidden(page, 'contains');
      await expectWorkflowContextSectionHidden(page, 'appearsIn');
    });
  });

  test.describe('FR-NAV-012: Contains section', () => {
    test('course with linked activity shows Contains with child workflow links sorted A-Z', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await gotoAuthenticatedShell(page, linked.course.workflow_path);
      await waitForMainNavigationReady(page);

      await expectWorkflowContextSectionVisible(page, 'Contains');
      await expect(appearsInSection(page)).toHaveCount(0);
      await expectRelatedWorkflowLinksSortedAz(page, 'Contains', [linked.activity.workflow_title]);
    });

    test('relatedWorkflowLink in Contains opens workflow route in a new browser tab', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await gotoAuthenticatedShell(page, linked.course.workflow_path);
      await waitForMainNavigationReady(page);

      await expectRelatedWorkflowLinkOpensInNewTab(
        page,
        'Contains',
        linked.activity.workflow_title,
      );
    });
  });

  test.describe('FR-NAV-013: Appears in section', () => {
    test('linked activity shows Appears in with parent course workflow link sorted A-Z', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await gotoAuthenticatedShell(page, linked.activity.workflow_path);
      await waitForMainNavigationReady(page);

      await expectWorkflowContextSectionVisible(page, 'Appears in');
      await expect(containsSection(page)).toHaveCount(0);
      await expectRelatedWorkflowLinksSortedAz(page, 'Appears in', [linked.course.workflow_title]);
    });

    test('relatedWorkflowLink in Appears in opens workflow route in a new browser tab', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await gotoAuthenticatedShell(page, linked.activity.workflow_path);
      await waitForMainNavigationReady(page);

      await expectRelatedWorkflowLinkOpensInNewTab(
        page,
        'Appears in',
        linked.course.workflow_title,
      );
    });

    test('program workflow hides Appears in', async ({ page }) => {
      const linked = getNavigationLinkedWorkflows();
      await gotoAuthenticatedShell(page, linked.program.workflow_path);
      await waitForMainNavigationReady(page);

      await expectWorkflowContextSectionHidden(page, 'appearsIn');
    });
  });
});
