import { expect, test } from '../../fixtures';
import {
  getProjectPath,
  getRecentHomeProjects,
  loadWorkflowManifest,
} from '../../helpers/manifest';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import {
  projectLoadingIndicator,
  projectOverviewTab,
  projectOverviewView,
  projectTitle,
  projectViewTabSelector,
  waitForProjectOverviewLoaded,
} from './project.locators';

test.use({
  seedDependencies: ['actor.teacher', 'project.primary', 'project.recent_collection'],
});

/**
 * Project route identity reload — FR-PROJ-HEADER-003.
 * Requirements: project_header_requirements_v1.yaml
 */

test.describe('Project route identity reload (FR-PROJ-HEADER-003)', () => {
  const manifest = loadWorkflowManifest();
  const sourcePath = getProjectPath(manifest);
  const destinationProject = getRecentHomeProjects(manifest)[0];
  const destinationPath = `/project/${destinationProject.uuid}`;

  test('FR-PROJ-HEADER-003: changing project URL reloads the complete project view', async ({
    page,
  }) => {
    await gotoAuthenticatedShell(page, sourcePath);
    await waitForProjectOverviewLoaded(page);
    await expect(projectTitle(page)).toHaveText(manifest.project_title);

    const sourceOverviewView = await projectOverviewView(page).elementHandle();
    expect(sourceOverviewView).not.toBeNull();

    let destinationRequestStarted!: () => void;
    const destinationRequest = new Promise<void>((resolve) => {
      destinationRequestStarted = resolve;
    });
    let releaseDestinationResponse!: () => void;
    const destinationResponseRelease = new Promise<void>((resolve) => {
      releaseDestinationResponse = resolve;
    });

    await page.route('**/api/project/**', async (route) => {
      const request = route.request();
      const requestUrl = new URL(request.url());
      const isDestinationProjectRequest =
        request.method() === 'GET' &&
        requestUrl.pathname === `/api/project/${destinationProject.uuid}`;

      if (isDestinationProjectRequest) {
        destinationRequestStarted();
        await destinationResponseRelease;
      }

      await route.continue();
    });

    await page.evaluate((nextPath) => {
      const currentState = window.history.state as Record<string, unknown> | null;
      const currentIndex = typeof currentState?.idx === 'number' ? currentState.idx : 0;
      const nextState = {
        ...currentState,
        idx: currentIndex + 1,
        key: 'e2e-project-route-change',
        usr: null,
      };

      window.history.pushState(nextState, '', nextPath);
      window.dispatchEvent(new PopStateEvent('popstate', { state: nextState }));
    }, destinationPath);

    await destinationRequest;
    await expect(page).toHaveURL(new RegExp(`/project/${destinationProject.uuid}/?$`));
    await expect(projectLoadingIndicator(page)).toBeVisible();
    await expect(projectTitle(page)).toHaveCount(0);
    await expect(projectViewTabSelector(page)).toHaveCount(0);
    await expect(projectOverviewView(page)).toHaveCount(0);
    expect(await sourceOverviewView!.evaluate((element) => element.isConnected)).toBe(false);

    releaseDestinationResponse();

    await expect(projectTitle(page)).toHaveText(destinationProject.title, { timeout: 15_000 });
    await expect(projectOverviewView(page)).toBeVisible();
    await expect(projectOverviewTab(page)).toHaveAttribute('aria-selected', 'true');
    await expect(projectLoadingIndicator(page)).toHaveCount(0);
    await expect(
      page.getByRole('heading', { level: 1, name: manifest.project_title, exact: true }),
    ).toHaveCount(0);
  });
});
