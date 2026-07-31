import { expect, type Locator, type Page } from '@playwright/test';

import { workflowOverviewPath } from '../../helpers/workflow-navigation';
import { workflowOverviewView } from './workflow-overview.locators';

/**
 * OverviewView passes `author` into UserPermissions, which expects `owner`.
 * When the project team query returns members, UserPermissions crashes on `owner.email`
 * and the Overview route never mounts `workflow-overview-view`.
 *
 * Stub an empty team so metadata tests can run without changing product code.
 * FR-WF-OV-007 contributor-row assertions remain blocked until that prop is fixed.
 */
export async function stubEmptyProjectTeamForWorkflowOverview(page: Page): Promise<void> {
  await page.route(/\/api\/project\/[^/]+\/team\/?$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    });
  });
}

/** Navigate to workflow Overview with the empty-team stub so the view can render. */
export async function openWorkflowOverview(page: Page, workflowGraphPath: string): Promise<void> {
  await stubEmptyProjectTeamForWorkflowOverview(page);
  await page.goto(workflowOverviewPath(workflowGraphPath));
  await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
}

export async function setWorkflowOverviewSwitch(
  page: Page,
  control: Locator,
  checked: boolean,
): Promise<void> {
  await expect(control).toBeVisible({ timeout: 15_000 });
  if ((await control.isChecked()) === checked) {
    return;
  }

  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' &&
      /\/api\/workflow\/[^/]+\/?$/.test(new URL(response.url()).pathname),
    { timeout: 15_000 },
  );

  if (checked) {
    await control.check();
  } else {
    await control.uncheck();
  }

  const response = await saved;
  if (!response.ok()) {
    throw new Error(`Workflow overview auto-save failed with HTTP ${response.status()}.`);
  }
}
