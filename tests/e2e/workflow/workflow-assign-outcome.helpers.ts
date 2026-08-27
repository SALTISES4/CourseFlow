import { expect, type Page } from '@playwright/test';
import { authenticatedApiRequest } from '../../helpers/api';
import { workflowOutcomesPath } from '../../helpers/workflow-navigation';
import {
  workflowRightSidebarOutcomesTab,
  workflowRightSidebarOutcomesTabContent,
} from '../../shared/locators/workflow';
import { gotoOutcomesView } from './comments-tab.helpers';
import { fetchGraphView, nodeByUuid } from './workflow-graph.helpers';
import { workflowNode } from './workflow-graph.locators';
import {
  workflowNodeLinkedOutcomeRow,
  workflowNodeLinkedOutcomeRowUnlinkOutcomeMenuItem,
  workflowNodeLinkedOutcomesBadge,
  workflowNodeLinkedOutcomesPopover,
  workflowOutcomesAssignTabOutcomeRow,
  workflowOutcomesAssignTabOutcomeRowToggle,
  workflowOutcomesAssignTabPanel,
} from './workflow-assign-outcome.locators';

export const E2E_SEED_OUTCOME_HEADER = /^1\.\s+E2E Outcome 1$/;

const OUTCOME_HEADER_TEXT = /^\d+(\.\d+)*\.\s+.+/;

export function escapeOutcomeTitleForRegex(title: string): string {
  return title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function level1OutcomeHeaderPattern(title: string): RegExp {
  return new RegExp(`^\\d+\\.\\s+${escapeOutcomeTitleForRegex(title)}$`);
}

export function nestedOutcomeHeaderPattern(ordinalPath: string, title: string): RegExp {
  const ordinalEscaped = ordinalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${ordinalEscaped}\\.\\s+${escapeOutcomeTitleForRegex(title)}$`);
}

export async function createProjectTagViaApi(
  page: Page,
  projectUuid: string,
  label: string,
): Promise<{ id: number; label: string }> {
  const response = await authenticatedApiRequest(page, 'POST', `/api/project/${projectUuid}/tags`, {
    data: { label },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()) as { id: number; label: string };
}

export async function patchOutcomeViaApi(
  page: Page,
  outcomeUuid: string,
  patch: { title?: string; tagIds?: number[] },
): Promise<void> {
  const response = await authenticatedApiRequest(page, 'PATCH', `/api/outcome/${outcomeUuid}`, {
    data: patch,
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function moveOutcomeViaApi(
  page: Page,
  outcomeUuid: string,
  options: {
    beforeUuid?: string;
    afterUuid?: string;
    insertIndex?: number;
    parentUuid?: string | null;
  },
): Promise<void> {
  const response = await authenticatedApiRequest(page, 'POST', `/api/outcome/${outcomeUuid}/move`, {
    data: options,
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function expandAllAssignTabOutcomeRows(page: Page): Promise<void> {
  const panel = workflowOutcomesAssignTabPanel(page);
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const collapsedToggles = panel.locator('button').filter({
      has: page.locator('[data-testid="AddIcon"]'),
    });
    if ((await collapsedToggles.count()) === 0) {
      return;
    }
    await collapsedToggles.first().click();
    await page.waitForTimeout(150);
  }
}

export async function expandAllOutcomesViewTreeRows(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const toggles = page.locator('button').filter({
      has: page.locator('[data-testid="AddIcon"]'),
    });
    const count = await toggles.count();
    let expanded = false;
    for (let index = 0; index < count; index += 1) {
      const toggle = toggles.nth(index);
      const inSidebar = await toggle.evaluate((element) => {
        const sidebar = document.querySelector('[data-test-id="workflow-right-sidebar"]');
        return sidebar?.contains(element) ?? false;
      });
      if (inSidebar) {
        continue;
      }
      await toggle.click();
      expanded = true;
      await page.waitForTimeout(150);
      break;
    }
    if (!expanded) {
      return;
    }
  }
}

export async function expandAssignTabOutcomeRow(
  page: Page,
  rowTitle: string | RegExp,
): Promise<void> {
  const toggle = workflowOutcomesAssignTabOutcomeRowToggle(page, rowTitle);
  if ((await toggle.count()) === 0) {
    return;
  }
  const collapsed = toggle.filter({ has: page.locator('[data-testid="AddIcon"]') });
  if ((await collapsed.count()) > 0) {
    await collapsed.first().click();
    await page.waitForTimeout(150);
  }
}

export async function collectAssignTabOutcomeHeaderTexts(page: Page): Promise<string[]> {
  await expandAllAssignTabOutcomeRows(page);
  const panel = workflowOutcomesAssignTabPanel(page);
  return panel.evaluate(() => {
    const root = document.querySelector('[data-test-id="workflow-right-sidebar"] .MuiPaper-root');
    if (!root) {
      return [];
    }
    return Array.from(root.querySelectorAll('p'))
      .map((node) => node.textContent?.trim() ?? '')
      .filter((text) => /^\d+(\.\d+)*\.\s+/.test(text));
  });
}

export async function collectOutcomesViewOutcomeHeaderTexts(page: Page): Promise<string[]> {
  await expandAllOutcomesViewTreeRows(page);
  const headers = page.locator('p').filter({ hasText: OUTCOME_HEADER_TEXT });
  const count = await headers.count();
  const results: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const header = headers.nth(index);
    const inSidebar = await header.evaluate((element) => {
      const sidebar = document.querySelector('[data-test-id="workflow-right-sidebar"]');
      return sidebar?.contains(element) ?? false;
    });
    if (!inSidebar) {
      const text = (await header.textContent())?.trim();
      if (text) {
        results.push(text);
      }
    }
  }
  return results;
}

function sortOutcomeHeaderTexts(headers: string[]): string[] {
  return [...headers].sort((left, right) => left.localeCompare(right));
}

export async function expectAssignTabMatchesOutcomesViewTree(
  page: Page,
  workflowPath: string,
): Promise<void> {
  await expect(workflowOutcomesAssignTabOutcomeRow(page, /^\d+\.\s+/)).toBeVisible({
    timeout: 15_000,
  });

  let assignTabHeaders: string[] = [];
  await expect
    .poll(async () => {
      assignTabHeaders = sortOutcomeHeaderTexts(await collectAssignTabOutcomeHeaderTexts(page));
      return assignTabHeaders;
    }, { timeout: 15_000 })
    .not.toEqual([]);

  await gotoOutcomesView(page, workflowPath);
  let treeHeaders: string[] = [];
  await expect
    .poll(async () => {
      treeHeaders = sortOutcomeHeaderTexts(await collectOutcomesViewOutcomeHeaderTexts(page));
      return treeHeaders;
    }, { timeout: 15_000 })
    .not.toEqual([]);
  expect(assignTabHeaders).toEqual(treeHeaders);
}

export async function collectAssignTabGroupTitles(page: Page): Promise<(string | null)[]> {
  const panel = workflowOutcomesAssignTabPanel(page);
  return panel.evaluate(() => {
    const content =
      document.querySelector('[data-test-id="workflow-right-sidebar"] .MuiPaper-root h3')
        ?.parentElement ?? null;
    if (!content) {
      return [];
    }

    const isLevel1OutcomeHeaderText = (text: string): boolean =>
      /^\d+\.\s+/.test(text) && !/^\d+\.\d+/.test(text);

    const collectLevel1HeadersFromAssignTabGroup = (groupEl: Element): string[] => {
      const headers: string[] = [];
      for (const child of Array.from(groupEl.children)) {
        if (child.tagName === 'H6') {
          continue;
        }
        if (child.tagName !== 'UL') {
          continue;
        }
        for (const li of Array.from(child.children)) {
          if (li.tagName !== 'LI') {
            continue;
          }
          const text = li.querySelector(':scope p')?.textContent?.trim() ?? '';
          if (isLevel1OutcomeHeaderText(text)) {
            headers.push(text);
          }
        }
      }
      return headers;
    };

    const groups: (string | null)[] = [];
    for (const child of Array.from(content.children)) {
      if (child.tagName === 'H3') {
        continue;
      }
      if (collectLevel1HeadersFromAssignTabGroup(child).length === 0) {
        continue;
      }
      const title = child.querySelector(':scope > h6')?.textContent?.trim() ?? null;
      groups.push(title);
    }
    return groups;
  });
}

export async function collectAssignTabLevel1HeadersForGroup(
  page: Page,
  groupTitle: string | null,
): Promise<string[]> {
  const panel = workflowOutcomesAssignTabPanel(page);
  return panel.evaluate(
    (_panel, { expectedTitle }) => {
      const content =
        document.querySelector('[data-test-id="workflow-right-sidebar"] .MuiPaper-root h3')
          ?.parentElement ?? null;
      if (!content) {
        return [];
      }

      const isLevel1OutcomeHeaderText = (text: string): boolean =>
        /^\d+\.\s+/.test(text) && !/^\d+\.\d+/.test(text);

      const collectLevel1HeadersFromAssignTabGroup = (groupEl: Element): string[] => {
        const headers: string[] = [];
        for (const child of Array.from(groupEl.children)) {
          if (child.tagName === 'H6') {
            continue;
          }
          if (child.tagName !== 'UL') {
            continue;
          }
          for (const li of Array.from(child.children)) {
            if (li.tagName !== 'LI') {
              continue;
            }
            const text = li.querySelector(':scope p')?.textContent?.trim() ?? '';
            if (isLevel1OutcomeHeaderText(text)) {
              headers.push(text);
            }
          }
        }
        return headers;
      };

      for (const child of Array.from(content.children)) {
        if (child.tagName === 'H3') {
          continue;
        }
        if (collectLevel1HeadersFromAssignTabGroup(child).length === 0) {
          continue;
        }
        const title = child.querySelector(':scope > h6')?.textContent?.trim() ?? null;
        if (title !== expectedTitle) {
          continue;
        }
        return collectLevel1HeadersFromAssignTabGroup(child);
      }
      return [];
    },
    { expectedTitle: groupTitle },
  );
}

export async function collectAllAssignTabLevel1HeaderGroups(page: Page): Promise<string[][]> {
  const panel = workflowOutcomesAssignTabPanel(page);
  return panel.evaluate(() => {
    const content =
      document.querySelector('[data-test-id="workflow-right-sidebar"] .MuiPaper-root h3')
        ?.parentElement ?? null;
    if (!content) {
      return [];
    }

    const isLevel1OutcomeHeaderText = (text: string): boolean =>
      /^\d+\.\s+/.test(text) && !/^\d+\.\d+/.test(text);

    const collectLevel1HeadersFromAssignTabGroup = (groupEl: Element): string[] => {
      const headers: string[] = [];
      for (const child of Array.from(groupEl.children)) {
        if (child.tagName === 'H6') {
          continue;
        }
        if (child.tagName !== 'UL') {
          continue;
        }
        for (const li of Array.from(child.children)) {
          if (li.tagName !== 'LI') {
            continue;
          }
          const text = li.querySelector(':scope p')?.textContent?.trim() ?? '';
          if (isLevel1OutcomeHeaderText(text)) {
            headers.push(text);
          }
        }
      }
      return headers;
    };

    const groups: string[][] = [];
    for (const child of Array.from(content.children)) {
      if (child.tagName === 'H3') {
        continue;
      }
      const headers = collectLevel1HeadersFromAssignTabGroup(child);
      if (headers.length > 0) {
        groups.push(headers);
      }
    }
    return groups;
  });
}

export function assignTabGroupsContainingOutcomeTitle(
  groups: string[][],
  outcomeTitle: string,
): string[][] {
  const titleSuffix = new RegExp(`\\.\\s+${escapeOutcomeTitleForRegex(outcomeTitle)}$`);
  return groups.filter((headers) => headers.some((header) => titleSuffix.test(header)));
}

export async function collectAssignTabNestedHeadersUnderParent(
  page: Page,
  parentHeader: RegExp,
): Promise<string[]> {
  await expandAssignTabOutcomeRow(page, parentHeader);
  const parent = workflowOutcomesAssignTabOutcomeRow(page, parentHeader);
  return parent.evaluate((element) => {
    const wrapper =
      element.closest('[class*="OutcomeWrapper"]') ??
      element.parentElement?.parentElement?.parentElement;
    const childList = wrapper?.querySelector(':scope > ul');
    if (!childList) {
      return [];
    }

    return Array.from(childList.querySelectorAll(':scope > li'))
      .map((li) => li.querySelector(':scope p')?.textContent?.trim() ?? '')
      .filter((text) => /^\d+\.\d+(\.\d+)?\.\s+/.test(text));
  });
}

export function expectLevel1HeaderOrder(headers: string[], ...titles: string[]): void {
  expect(headers).toHaveLength(titles.length);
  titles.forEach((title, index) => {
    expect(headers[index]).toMatch(level1OutcomeHeaderPattern(title));
  });
}

export function expectNestedHeaderOrder(headers: string[], ...patterns: RegExp[]): void {
  expect(headers).toHaveLength(patterns.length);
  patterns.forEach((pattern, index) => {
    expect(headers[index]).toMatch(pattern);
  });
}

export async function openWorkflowOutcomesTab(page: Page): Promise<void> {
  await workflowRightSidebarOutcomesTab(page).click();
  await expect(workflowRightSidebarOutcomesTab(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(workflowRightSidebarOutcomesTabContent(page)).toBeVisible();
}

type DragAssignTabOutcomeOptions = {
  /** When false, leaves the pointer held down after moving over the target node. */
  release?: boolean;
};

export async function dragAssignTabOutcomeOverNode(
  page: Page,
  rowTitle: string | RegExp,
  targetNodeUuid: string,
  options: DragAssignTabOutcomeOptions = {},
): Promise<void> {
  const { release = true } = options;
  const row = workflowOutcomesAssignTabOutcomeRow(page, rowTitle);
  const target = workflowNode(page, targetNodeUuid);

  await row.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const rowBox = await row.boundingBox();
  const targetBox = await target.boundingBox();
  if (!rowBox || !targetBox) {
    throw new Error('Assign-tab outcome row or target workflowNode not visible.');
  }

  await page.mouse.move(rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 25 },
  );
  if (release) {
    await page.mouse.up();
  }
}

export async function dragAssignTabOutcomeOntoNode(
  page: Page,
  rowTitle: string | RegExp,
  targetNodeUuid: string,
): Promise<void> {
  await dragAssignTabOutcomeOverNode(page, rowTitle, targetNodeUuid, { release: true });
}

export async function clickAssignTabOutcomeRow(page: Page, rowTitle: string | RegExp): Promise<void> {
  await workflowOutcomesAssignTabOutcomeRow(page, rowTitle).click();
}

export async function openLinkedOutcomesPopover(
  page: Page,
  nodeUuid: string,
  badgeCount = 1,
): Promise<void> {
  const badge = workflowNodeLinkedOutcomesBadge(page, nodeUuid, badgeCount);
  await expect(badge).toBeVisible({ timeout: 10_000 });
  await badge.click({ force: true });
  await expect(workflowNodeLinkedOutcomesPopover(page)).toBeVisible({ timeout: 5_000 });
}

/** Open linked-outcomes popover without assuming badge count (FR-WF-AO-006 multi-level assignments). */
export async function openLinkedOutcomesPopoverForNode(
  page: Page,
  nodeUuid: string,
): Promise<void> {
  const node = workflowNode(page, nodeUuid);
  await expect(node).toBeVisible({ timeout: 10_000 });
  await node.scrollIntoViewIfNeeded();
  await node.locator('.MuiBadge-root').click({ force: true });
  await expect(workflowNodeLinkedOutcomesPopover(page)).toBeVisible({ timeout: 5_000 });
}

export async function linkOutcomesToNodeViaApi(
  page: Page,
  nodeUuid: string,
  outcomeUuids: string[],
): Promise<void> {
  for (const outcomeUuid of outcomeUuids) {
    const response = await authenticatedApiRequest(
      page,
      'POST',
      `/api/node/${nodeUuid}/link-outcome`,
      { data: { outcomeUuid } },
    );
    expect(response.ok(), await response.text()).toBeTruthy();
  }
}

export async function expandLinkedPopoverOutcomeRow(
  page: Page,
  rowTitle: string | RegExp,
): Promise<void> {
  const popover = workflowNodeLinkedOutcomesPopover(page);
  const row =
    typeof rowTitle === 'string'
      ? popover.getByText(rowTitle, { exact: true })
      : popover.getByText(rowTitle);
  await expect(row).toBeVisible({ timeout: 5_000 });
  const toggle = row.locator('xpath=../following-sibling::button');
  const collapsed = toggle.filter({ has: page.locator('[data-testid="AddIcon"]') });
  if ((await collapsed.count()) > 0) {
    await collapsed.first().click();
    await page.waitForTimeout(150);
  }
}

export async function revealLinkedPopoverOutcomeRows(
  page: Page,
  ...rowTitles: Array<string | RegExp>
): Promise<void> {
  for (const rowTitle of rowTitles) {
    await expandLinkedPopoverOutcomeRow(page, rowTitle);
  }
}

type NodeOutcomeUuidExpectation = {
  includes?: string[];
  excludes?: string[];
  exact?: string[];
};

export async function expectNodeOutcomeUuids(
  page: Page,
  workflowUuid: string,
  nodeUuid: string,
  expected: NodeOutcomeUuidExpectation,
): Promise<void> {
  await expect
    .poll(async () => {
      const node = nodeByUuid(await fetchGraphView(page, workflowUuid), nodeUuid);
      if (!node) {
        return 'missing-node';
      }
      const assigned = [...node.outcomeUuids].sort();
      if (expected.exact !== undefined) {
        const exact = [...expected.exact].sort();
        return JSON.stringify(assigned) === JSON.stringify(exact) ? 'ok' : assigned.join(',');
      }
      for (const uuid of expected.includes ?? []) {
        if (!node.outcomeUuids.includes(uuid)) {
          return `missing:${uuid}`;
        }
      }
      for (const uuid of expected.excludes ?? []) {
        if (node.outcomeUuids.includes(uuid)) {
          return `still-has:${uuid}`;
        }
      }
      return 'ok';
    }, { timeout: 15_000 })
    .toBe('ok');
}

export async function workflowNodeHasOutcomeHighlightBorder(
  page: Page,
  nodeUuid: string,
): Promise<boolean> {
  return workflowNode(page, nodeUuid).evaluate((el) => {
    const shadow = getComputedStyle(el).boxShadow;
    return shadow !== 'none' && shadow !== '';
  });
}

/** FR-WF-AO-004 drop-target presentation — green overlay via ::before on CellInner. */
export async function workflowNodeHasOutcomeDropTargetBorder(
  page: Page,
  nodeUuid: string,
): Promise<boolean> {
  return workflowNode(page, nodeUuid).evaluate((el) => {
    const before = getComputedStyle(el, '::before');
    return before.content !== 'none' && before.content !== 'normal' && before.width !== '0px';
  });
}

export async function countWorkflowNodesWithOutcomeDropTargetBorder(page: Page): Promise<number> {
  return page.locator('[data-test-id="workflow-node"]').evaluateAll((nodes) =>
    nodes.filter((el) => {
      const before = getComputedStyle(el, '::before');
      return before.content !== 'none' && before.content !== 'normal' && before.width !== '0px';
    }).length,
  );
}

export async function unlinkLinkedOutcomeFromPopover(
  page: Page,
  outcomeTitle: string | RegExp,
): Promise<void> {
  const row = workflowNodeLinkedOutcomeRow(page, outcomeTitle);
  await row.hover();
  await workflowNodeLinkedOutcomeRowUnlinkOutcomeMenuItem(page).click();
}

export async function assignTabOutcomeRowHasHighlightBorder(
  page: Page,
  rowTitle: string | RegExp,
): Promise<boolean> {
  const row = workflowOutcomesAssignTabOutcomeRow(page, rowTitle);
  return row.evaluate((el) => {
    let current: HTMLElement | null = el as HTMLElement;
    while (current) {
      const shadow = getComputedStyle(current).boxShadow;
      if (shadow !== 'none' && shadow.includes('2px')) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  });
}

export async function expectNavigatedToOutcomesView(page: Page, workflowPath: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`${workflowOutcomesPath(workflowPath)}/?$`));
}
