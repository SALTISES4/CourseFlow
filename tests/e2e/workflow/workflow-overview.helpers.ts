import { expect, type Locator, type Page } from '@playwright/test';

import { workflowOverviewPath } from '../../helpers/workflow-navigation';
import { workflowOverviewView } from './workflow-overview.locators';

/** Navigate to workflow Overview using the real workflow and parent-project APIs. */
export async function openWorkflowOverview(page: Page, workflowGraphPath: string): Promise<void> {
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
