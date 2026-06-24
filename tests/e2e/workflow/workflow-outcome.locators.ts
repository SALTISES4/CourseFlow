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
  return workflowRightSidebarContentPanel(page).getByRole('textbox', { name: 'Title' });
}

export function workflowEditOutcomeFormDescriptionField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('textbox', { name: 'Description' });
}

export function workflowEditOutcomeFormCodeField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('textbox', { name: 'Code' });
}

export function workflowEditOutcomeFormTagsField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Tags$/i);
}

export function workflowEditOutcomeFormDuplicateButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: 'Duplicate', exact: true });
}

export function workflowEditOutcomeFormDeleteButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: 'Delete', exact: true });
}

export function workflowOutcomeHoverDuplicateItem(page: Page, title: string): Locator {
  return page
    .locator('div')
    .filter({ has: workflowOutcomeHeader(page, title) })
    .getByRole('button', { name: 'Duplicate', exact: true });
}

export function workflowOutcomeHoverDeleteItem(page: Page, title: string): Locator {
  return page
    .locator('div')
    .filter({ has: workflowOutcomeHeader(page, title) })
    .getByRole('button', { name: 'Delete', exact: true });
}

export async function workflowOutcomeHasSelectedBorder(page: Page, title: string): Promise<boolean> {
  const header = page.locator('div').filter({ has: workflowOutcomeHeader(page, title) }).first();
  return header.evaluate((el) => {
    const shadow = getComputedStyle(el).boxShadow;
    return shadow !== 'none' && shadow !== '';
  });
}

export function workflowOutcomeViewEmptyStateAlert(page: Page): Locator {
  return page.getByText('How to use outcomes', { exact: true });
}
