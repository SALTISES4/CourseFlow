import { expect, type Locator, type Page } from '@playwright/test';
import { COMMENTS_HOVER_NAME } from './workflow-graph.locators';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';

/** Outcome tree header row showing the auto-numbered outcome title on /outcomedit. */
export function workflowOutcomeHeader(page: Page, title: string): Locator {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.getByText(new RegExp(`^\\d+(\\.\\d+)*\\.\\s*${escaped}$`));
}

export function workflowOutcomeHoverCommentsItem(page: Page, title: string): Locator {
  return workflowOutcomeRowForHeader(page, workflowOutcomeHeader(page, title))
    .getByRole('button', { name: COMMENTS_HOVER_NAME, exact: true })
    .first();
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
  return workflowOutcomeRowForHeader(page, workflowOutcomeHeader(page, title)).getByRole('button', {
    name: 'Duplicate',
    exact: true,
  });
}

export function workflowOutcomeHoverDeleteItem(page: Page, title: string): Locator {
  return workflowOutcomeHoverDeleteForHeader(page, workflowOutcomeHeader(page, title));
}

export function workflowOutcomeHoverInsertSiblingItem(page: Page, title: string): Locator {
  return workflowOutcomeHoverInsertSiblingForHeader(page, workflowOutcomeHeader(page, title));
}

export function workflowOutcomeHoverInsertChildItem(page: Page, title: string): Locator {
  return workflowOutcomeHoverInsertChildForHeader(page, workflowOutcomeHeader(page, title));
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

export function workflowOutcomeViewAddOutcomeButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Add outcome', exact: true });
}

/** Header with ordinal prefix only (empty persisted title). */
export function workflowOutcomeHeaderOrdinalOnly(page: Page, ordinalPath: string): Locator {
  const escaped = ordinalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.getByText(new RegExp(`^${escaped}\\.\\s*$`));
}

export function workflowOutcomeHeaderWithOrdinalPrefix(page: Page, ordinalPath: string): Locator {
  const escaped = ordinalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.getByText(new RegExp(`^${escaped}\\.\\s`));
}

function workflowOutcomeExpandToggleForHeader(header: Locator): Locator {
  return header
    .locator('xpath=ancestor::*[@role="listitem"][1]')
    .getByRole('button')
    .last();
}

/** Expand/collapse toggle on a workflowOutcomeHeader that has children. */
export function workflowOutcomeExpandToggle(page: Page, title: string): Locator {
  return workflowOutcomeExpandToggleForHeader(workflowOutcomeHeader(page, title).first());
}

export function workflowOutcomeExpandToggleByOrdinal(page: Page, ordinalPath: string): Locator {
  return workflowOutcomeExpandToggleForHeader(
    workflowOutcomeHeaderWithOrdinalPrefix(page, ordinalPath).first(),
  );
}

export async function expandWorkflowOutcomeByOrdinalPrefix(
  page: Page,
  ordinalPath: string,
  targetChildPrefix?: string,
): Promise<void> {
  if (targetChildPrefix) {
    const childHeader = workflowOutcomeHeaderWithOrdinalPrefix(page, targetChildPrefix);
    if ((await childHeader.count()) > 0 && (await childHeader.first().isVisible())) {
      return;
    }
  }

  const toggle = workflowOutcomeExpandToggleByOrdinal(page, ordinalPath);
  if ((await toggle.count()) > 0) {
    await toggle.click();
    await page.waitForTimeout(300);
  }
}

/** Expand ancestors so the outcome at `ordinalPath` is visible (e.g. `1.1.1`). */
export async function revealOutcomeByOrdinalPath(page: Page, ordinalPath: string): Promise<void> {
  const segments = ordinalPath.split('.');
  for (let depth = 1; depth < segments.length; depth++) {
    const childPrefix = segments.slice(0, depth + 1).join('.');
    const childHeader = workflowOutcomeHeaderWithOrdinalPrefix(page, childPrefix);
    if ((await childHeader.count()) > 0 && (await childHeader.first().isVisible())) {
      continue;
    }

    const parentPrefix = segments.slice(0, depth).join('.');
    await expandWorkflowOutcomeByOrdinalPrefix(page, parentPrefix, childPrefix);
  }
}

export async function ensureOutcomeTitleByOrdinalPrefix(
  page: Page,
  ordinalPath: string,
  title: string,
): Promise<void> {
  await revealOutcomeByOrdinalPath(page, ordinalPath);
  if ((await workflowOutcomeHeader(page, title).count()) > 0) {
    const titled = workflowOutcomeHeader(page, title).first();
    if (await titled.isVisible()) {
      return;
    }
  }

  const header = workflowOutcomeHeaderWithOrdinalPrefix(page, ordinalPath);
  if ((await header.count()) === 0) {
    return;
  }

  await header.first().click();
  await expect(workflowEditOutcomeForm(page)).toBeVisible();
  const updatePromise = waitForOutcomeUpdateResponse(page);
  await workflowEditOutcomeFormTitleField(page).fill(title);
  await workflowEditOutcomeFormTitleField(page).press('Tab');
  await updatePromise;
}

export async function expandWorkflowOutcomeChildren(
  page: Page,
  title: string,
  childOrdinalPrefix?: string,
): Promise<void> {
  if (childOrdinalPrefix) {
    const child = workflowOutcomeHeaderWithOrdinalPrefix(page, childOrdinalPrefix);
    if ((await child.count()) > 0 && (await child.first().isVisible())) {
      return;
    }
    await revealOutcomeByOrdinalPath(page, childOrdinalPrefix);
    return;
  }

  const toggle = workflowOutcomeExpandToggle(page, title);
  if ((await toggle.count()) > 0) {
    await toggle.click();
    await page.waitForTimeout(300);
  }
}

export function workflowOutcomeRowForHeader(page: Page, header: Locator): Locator {
  return page.locator('div').filter({ has: header });
}

export function workflowOutcomeHoverDeleteForHeader(page: Page, header: Locator): Locator {
  return workflowOutcomeRowForHeader(page, header)
    .getByRole('button', { name: 'Delete', exact: true })
    .first();
}

export function workflowOutcomeHoverInsertSiblingForHeader(page: Page, header: Locator): Locator {
  return workflowOutcomeRowForHeader(page, header).getByRole('button', {
    name: 'Insert sibling',
    exact: true,
  });
}

export function workflowOutcomeHoverInsertChildForHeader(page: Page, header: Locator): Locator {
  return workflowOutcomeRowForHeader(page, header).getByRole('button', {
    name: 'Insert child',
    exact: true,
  });
}

/** Outcome headers at FR depth N (1=root, 2=child, 3=grandchild). */
export function workflowOutcomeHeadersAtFrDepth(page: Page, depth: number): Locator {
  if (depth < 1) {
    throw new Error(`FR outcome depth must be >= 1; got ${depth}`);
  }
  const segmentPattern = depth === 1 ? '\\d+' : `\\d+(\\.\\d+){${depth - 1}}`;
  return page.getByText(new RegExp(`^${segmentPattern}\\.\\s`));
}

export async function waitForOutcomeCreateResponse(page: Page): Promise<void> {
  await page.waitForResponse(
    (resp) =>
      resp.request().method() === 'POST' &&
      resp.url().includes('/api/graph/') &&
      resp.url().includes('/outcomes') &&
      resp.ok(),
  );
}

export async function waitForOutcomeUpdateResponse(page: Page): Promise<void> {
  await page.waitForResponse(
    (resp) =>
      resp.request().method() === 'PATCH' &&
      resp.url().includes('/api/outcome/') &&
      resp.ok(),
  );
}
