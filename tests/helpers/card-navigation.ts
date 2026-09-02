import { expect, type Locator, type Page } from '@playwright/test';

import { cardTitleText } from '../shared/locators/cards';

/** FR-CARD-003 / FR-NAV-008 — project card or sidebar favourite lands on Workflows tab. */
export function projectWorkflowsUrlPattern(projectUuid: string): RegExp {
  return new RegExp(`/project/${projectUuid}/workflows/?$`);
}

/** FR-CARD-003 — card-body click (title) navigates to /project/{uuid}/workflows. */
export async function expectProjectCardClickNavigatesToWorkflowsView(
  page: Page,
  card: Locator,
  projectUuid: string,
): Promise<void> {
  await cardTitleText(card).click();
  await expect(page).toHaveURL(projectWorkflowsUrlPattern(projectUuid));
}
