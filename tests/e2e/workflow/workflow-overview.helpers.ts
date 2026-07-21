import type { Locator, Page } from '@playwright/test';

export async function setWorkflowOverviewSwitch(
  page: Page,
  control: Locator,
  checked: boolean,
): Promise<void> {
  if ((await control.isChecked()) === checked) {
    return;
  }

  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' &&
      /\/api\/workflow\/[^/]+$/.test(new URL(response.url()).pathname),
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
