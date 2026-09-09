import { expect, type Page } from '@playwright/test';

import {
  appearsInSection,
  containsSection,
  relatedWorkflowLinksInWorkflowContextSection,
  type WorkflowContextSectionLabel,
} from '../shared/locators/navigation';
import { loadWorkflowManifest } from './manifest';

export type NavigationLinkedWorkflowEntry = {
  workflow_uuid: string;
  workflow_title: string;
  workflow_type: string;
  workflow_path: string;
  linked_child_workflow_uuid?: string;
};

export type NavigationLinkedWorkflowsManifest = {
  activity: NavigationLinkedWorkflowEntry;
  course: NavigationLinkedWorkflowEntry;
  program: NavigationLinkedWorkflowEntry;
};

export function getNavigationLinkedWorkflows(
  manifest = loadWorkflowManifest(),
): NavigationLinkedWorkflowsManifest {
  const linked = (manifest as { navigation_linked_workflows?: NavigationLinkedWorkflowsManifest })
    .navigation_linked_workflows;
  if (!linked?.activity || !linked.course || !linked.program) {
    throw new Error(
      'E2E workflow manifest is missing navigation_linked_workflows fixture data. Re-run e2e seed.',
    );
  }
  return linked;
}

export async function expectWorkflowContextSectionHidden(
  page: Page,
  section: 'contains' | 'appearsIn',
): Promise<void> {
  const locator = section === 'contains' ? containsSection(page) : appearsInSection(page);
  await expect(locator).toHaveCount(0);
}

export async function expectWorkflowContextSectionVisible(
  page: Page,
  sectionLabel: WorkflowContextSectionLabel,
): Promise<void> {
  const locator =
    sectionLabel === 'Contains' ? containsSection(page) : appearsInSection(page);
  await expect(locator).toBeVisible();
}

export async function expectRelatedWorkflowLinksSortedAz(
  page: Page,
  sectionLabel: WorkflowContextSectionLabel,
  expectedTitles: string[],
): Promise<void> {
  await expectWorkflowContextSectionVisible(page, sectionLabel);

  const links = relatedWorkflowLinksInWorkflowContextSection(page, sectionLabel);
  const linkCount = await links.count();
  expect(linkCount).toBeGreaterThanOrEqual(expectedTitles.length);

  const titles: string[] = [];
  const hrefs: string[] = [];
  for (let i = 0; i < linkCount; i++) {
    titles.push((await links.nth(i).innerText()).trim());
    hrefs.push((await links.nth(i).getAttribute('href')) ?? '');
  }

  const sorted = [...titles].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
  expect(titles).toEqual(sorted);
  expect(new Set(hrefs).size).toBe(hrefs.length);

  for (const expectedTitle of expectedTitles) {
    expect(titles).toContain(expectedTitle);
  }
}

export async function expectRelatedWorkflowLinkOpensInNewTab(
  page: Page,
  sectionLabel: WorkflowContextSectionLabel,
  workflowTitle: string,
  workflowUuid: string,
): Promise<void> {
  const workflowPath = `/workflow/${workflowUuid}`;
  const link = relatedWorkflowLinksInWorkflowContextSection(page, sectionLabel).and(
    page.locator(`a[href="${workflowPath}"]`),
  );
  await expect(link).toHaveCount(1);
  await expect(link).toHaveText(workflowTitle);

  const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()]);
  await expect(popup).toHaveURL(new RegExp(`${workflowPath}/?$`));
}
