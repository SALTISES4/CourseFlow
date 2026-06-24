import type { Locator, Page } from '@playwright/test';
import { COMMENTS_HOVER_NAME } from './workflow-graph.locators';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';

/** Outcome tree header row showing the auto-numbered outcome title on /outcomedit. */
export function workflowOutcomeHeader(page: Page, title: string): Locator {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.getByText(new RegExp(`^\\d+\\.\\s*${escaped}$`));
}

export function workflowOutcomeHoverCommentsItem(page: Page, title: string): Locator {
  return page
    .locator('div')
    .filter({ has: workflowOutcomeHeader(page, title) })
    .getByRole('button', { name: COMMENTS_HOVER_NAME });
}

/** canonical: workflowEditOutcomeForm heading */
export function workflowEditOutcomeForm(page: Page): Locator {
  return page.getByRole('heading', { name: 'Edit outcome', exact: true });
}

export function workflowEditOutcomeFormTitleField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Title$/i);
}
