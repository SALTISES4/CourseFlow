import { expect, type Locator, type Page } from '@playwright/test';

import { authenticatedApiRequest } from '../../helpers/api';
import { gotoOutcomesView } from './comments-tab.helpers';
import {
  waitForOutcomeMoveResponse,
  workflowOutcomeExpandToggle,
  workflowOutcomeHeader,
  workflowOutcomeHeaderDragHandle,
  workflowOutcomeHeaderTitleText,
} from './workflow-outcome.locators';

const DRAG_TITLE_PREFIX = 'E2E Drag';

type CreateOutcomeOptions = {
  title: string;
  parentUuid?: string | null;
  insertIndex?: number | null;
  tagIds?: number[];
};

type GraphViewOutcomesPayload = {
  outcomes: Array<{
    uuid: string;
    title: string;
    parentUuid: string | null;
    order: number;
  }>;
};

export function workflowUuidFromPath(path: string): string {
  const match = path.match(/\/workflow\/([^/]+)/);
  if (!match?.[1]) {
    throw new Error(`Could not parse workflow uuid from path ${JSON.stringify(path)}`);
  }
  return match[1];
}

export async function createOutcomeViaApi(
  page: Page,
  graphUuid: string,
  options: CreateOutcomeOptions,
): Promise<string> {
  const data: Record<string, unknown> = {
    title: options.title,
  };
  if (options.parentUuid !== undefined) {
    data.parentUuid = options.parentUuid;
  }
  if (options.insertIndex !== undefined && options.insertIndex !== null) {
    data.insertIndex = options.insertIndex;
  }
  if (options.tagIds !== undefined) {
    data.tagIds = options.tagIds;
  }

  const response = await authenticatedApiRequest(page, 'POST', `/api/graph/${graphUuid}/outcomes`, {
    data,
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as {
    changes: { outcomes: { created: Array<{ uuid: string; title: string }> } };
  };
  const created = body.changes.outcomes.created[0];
  if (!created?.uuid) {
    throw new Error(`createGraphOutcome did not return a created outcome for ${options.title}`);
  }
  expect(created.title).toBe(options.title);
  return created.uuid;
}

export async function deleteOutcomeViaApi(page: Page, outcomeUuid: string): Promise<void> {
  const response = await authenticatedApiRequest(page, 'DELETE', `/api/outcome/${outcomeUuid}`);
  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function fetchGraphOutcomes(
  page: Page,
  workflowUuid: string,
): Promise<GraphViewOutcomesPayload['outcomes']> {
  const response = await authenticatedApiRequest(page, 'GET', `/api/graph/${workflowUuid}/view`);
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as GraphViewOutcomesPayload;
  return body.outcomes ?? [];
}

export async function outcomeUuidByTitle(
  page: Page,
  workflowPath: string,
  title: string,
): Promise<string> {
  const outcomes = await fetchGraphOutcomes(page, workflowUuidFromPath(workflowPath));
  const match = outcomes.find((o) => o.title === title);
  if (!match) {
    throw new Error(
      `No outcome titled ${JSON.stringify(title)}. Found: ${outcomes.map((o) => o.title).join(', ')}`,
    );
  }
  return match.uuid;
}

/**
 * Leave only the seeded root outcome so ordinals are stable across specs that share the fixture.
 * Prefer `seedUuid` when known so title/ordinal churn cannot drop the seed from the keep set.
 */
export async function resetOutcomeTreeToSeedOnly(
  page: Page,
  workflowPath: string,
  seedTitle: string,
  seedUuid?: string,
): Promise<string> {
  const workflowUuid = workflowUuidFromPath(workflowPath);
  let outcomes = await fetchGraphOutcomes(page, workflowUuid);

  let seed =
    (seedUuid ? outcomes.find((o) => o.uuid === seedUuid) : undefined) ??
    outcomes.find((o) => o.title === seedTitle && o.parentUuid == null) ??
    outcomes.find((o) => o.parentUuid == null);

  if (!seed) {
    throw new Error(
      `Cannot reset outcome tree: no seed outcome found (title=${JSON.stringify(seedTitle)}).`,
    );
  }

  const otherRoots = outcomes.filter((o) => o.parentUuid == null && o.uuid !== seed.uuid);
  for (const outcome of otherRoots) {
    await deleteOutcomeViaApi(page, outcome.uuid);
  }

  outcomes = await fetchGraphOutcomes(page, workflowUuid);
  const seedChildren = outcomes.filter((o) => o.parentUuid === seed.uuid);
  for (const outcome of seedChildren) {
    await deleteOutcomeViaApi(page, outcome.uuid);
  }

  if (seed.title !== seedTitle) {
    const response = await authenticatedApiRequest(page, 'PATCH', `/api/outcome/${seed.uuid}`, {
      data: { title: seedTitle },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
  }

  return seed.uuid;
}

export async function reloadOutcomesView(page: Page, workflowPath: string): Promise<void> {
  await gotoOutcomesView(page, workflowPath);
}

export async function rootOutcomeTitlesInOrder(
  page: Page,
  workflowPath: string,
): Promise<string[]> {
  const outcomes = await fetchGraphOutcomes(page, workflowUuidFromPath(workflowPath));
  return outcomes
    .filter((outcome) => outcome.parentUuid == null)
    .sort((left, right) => left.order - right.order)
    .map((outcome) => outcome.title);
}

export type OutcomeTreeSnapshot = Array<{
  title: string;
  parentUuid: string | null;
  order: number;
}>;

/** Stable graph snapshot for asserting drag gestures did not persist a move. */
export async function outcomeTreeSnapshot(
  page: Page,
  workflowPath: string,
): Promise<OutcomeTreeSnapshot> {
  const outcomes = await fetchGraphOutcomes(page, workflowUuidFromPath(workflowPath));
  return outcomes
    .map((outcome) => ({
      title: outcome.title,
      parentUuid: outcome.parentUuid,
      order: outcome.order,
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export async function expectOutcomeHeaderFrDepth(
  page: Page,
  title: string,
  depth: 1 | 2 | 3,
): Promise<void> {
  const headerText = await workflowOutcomeHeader(page, title).first().textContent();
  expect(headerText, `Expected header text for outcome ${JSON.stringify(title)}`).toBeTruthy();

  const ordinalMatch = headerText!.match(/^([\d.]+)\.\s/);
  expect(ordinalMatch, `Expected ordinal prefix in header ${JSON.stringify(headerText)}`).toBeTruthy();

  const segmentCount = ordinalMatch![1]!.split('.').filter(Boolean).length;
  expect(segmentCount).toBe(depth);
}

type ActiveOutcomeDrag = {
  x: number;
  y: number;
};

const activeOutcomeDrags = new WeakMap<Page, ActiveOutcomeDrag>();

async function outcomeHeaderDragPoint(
  page: Page,
  title: string,
  position: 'before' | 'after' | 'combine',
): Promise<{ x: number; y: number }> {
  const header = workflowOutcomeHeaderDragHandle(page, title);
  await header.scrollIntoViewIfNeeded();
  const box = await header.boundingBox();
  if (!box) {
    throw new Error(`Expected bounding box for outcome header ${JSON.stringify(title)}`);
  }

  const yRatio = position === 'before' ? 0.25 : position === 'after' ? 0.75 : 0.5;
  return {
    x: box.x + Math.max(box.width / 2, 8),
    y: box.y + box.height * yRatio,
  };
}

/**
 * FR-WF-EO-016 workflowOutcomeTreeRowDropIndicator — line shown during an in-flight same-level reorder.
 * Excludes expanded child lists (`ul`) that sit after the header when a row is open.
 */
export function workflowOutcomeRowDropIndicator(page: Page, title: string): Locator {
  return workflowOutcomeHeaderDragHandle(page, title).locator(
    'xpath=../following-sibling::*[1][not(local-name()="ul")]',
  );
}

/** Hold pointer over a destination header during an outcome drag (does not release). */
export async function beginOutcomeDragOntoHeader(
  page: Page,
  sourceTitle: string,
  targetTitle: string,
  position: 'before' | 'after' | 'combine',
): Promise<void> {
  const source = await outcomeHeaderDragPoint(page, sourceTitle, 'combine');
  await page.mouse.move(source.x, source.y);
  await page.mouse.down();
  await page.mouse.move(source.x + 12, source.y, { steps: 4 });

  const target = await outcomeHeaderDragPoint(page, targetTitle, position);
  await page.mouse.move(target.x, target.y, { steps: 20 });
  activeOutcomeDrags.set(page, target);
}

export async function abortOutcomeDragWithEscape(page: Page): Promise<void> {
  const target = activeOutcomeDrags.get(page);
  if (!target) {
    throw new Error('Expected an active outcome drag before abort.');
  }
  await page.keyboard.press('Escape');
  await page.mouse.up();
  activeOutcomeDrags.delete(page);
}

export async function whileDraggingOutcomeOntoHeader(
  page: Page,
  sourceTitle: string,
  targetTitle: string,
  position: 'before' | 'after' | 'combine',
  assertWhileDragging: () => Promise<void>,
): Promise<void> {
  await beginOutcomeDragOntoHeader(page, sourceTitle, targetTitle, position);
  try {
    await assertWhileDragging();
  } finally {
    await abortOutcomeDragWithEscape(page);
  }
}

export async function expectNoOutcomeReorderDropZoneOnHeader(
  page: Page,
  targetTitle: string,
): Promise<void> {
  await expect
    .poll(async () => workflowOutcomeRowDropIndicator(page, targetTitle).count(), {
      timeout: 5_000,
    })
    .toBe(0);
}

/**
 * FR-WF-EO-015/016/017 — drag source OutcomeHeader onto destination header.
 * `before` / `after` map to the FR 50/50 reorder zones on the header strip; `combine` nests as last child.
 */
export async function dragOutcomeOntoHeader(
  page: Page,
  sourceTitle: string,
  targetTitle: string,
  position: 'before' | 'after' | 'combine',
): Promise<void> {
  await attemptDragOutcomeOntoHeader(page, sourceTitle, targetTitle, position, {
    waitForMoveResponse: true,
  });
}

/** Same gesture as dragOutcomeOntoHeader without expecting a persisted move (role-gating tests). */
export async function attemptDragOutcomeOntoHeader(
  page: Page,
  sourceTitle: string,
  targetTitle: string,
  position: 'before' | 'after' | 'combine',
  options: { waitForMoveResponse?: boolean } = {},
): Promise<void> {
  const { waitForMoveResponse = false } = options;
  const source = workflowOutcomeHeaderDragHandle(page, sourceTitle);
  const target = workflowOutcomeHeaderDragHandle(page, targetTitle);

  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const targetBox = await target.boundingBox();
  if (!targetBox) {
    throw new Error(`Expected bounding box for destination outcome ${JSON.stringify(targetTitle)}`);
  }

  const yRatio = position === 'before' ? 0.25 : position === 'after' ? 0.75 : 0.5;

  const dragPromise = source.dragTo(target, {
    force: true,
    targetPosition: {
      x: Math.max(targetBox.width / 2, 8),
      y: targetBox.height * yRatio,
    },
  });

  if (waitForMoveResponse) {
    await Promise.all([waitForOutcomeMoveResponse(page), dragPromise]);
    return;
  }

  await dragPromise;
}

export async function expectOutcomeHeaderAtOrdinal(
  page: Page,
  ordinalPath: string,
  title: string,
): Promise<void> {
  await expect(workflowOutcomeHeaderTitleText(page, ordinalPath, title)).toBeVisible({
    timeout: 15_000,
  });
}

export async function ensureExpandedShowingChild(
  page: Page,
  parentTitle: string,
  childTitle: string,
): Promise<void> {
  const child = workflowOutcomeHeader(page, childTitle);
  if ((await child.count()) > 0 && (await child.first().isVisible())) {
    return;
  }

  const toggle = workflowOutcomeExpandToggle(page, parentTitle);
  await expect(toggle).toBeVisible({ timeout: 10_000 });
  await toggle.click();
  await expect(child.first()).toBeVisible({ timeout: 10_000 });
}

/** Collapse a parent row so a known direct child is not visible (FR-WF-EO-016/017 collapsed-target flows). */
export async function ensureCollapsedHidingChild(
  page: Page,
  parentTitle: string,
  childTitle: string,
): Promise<void> {
  const child = workflowOutcomeHeader(page, childTitle);
  if ((await child.count()) > 0 && !(await child.first().isVisible())) {
    return;
  }

  if ((await child.count()) === 0 || !(await child.first().isVisible())) {
    await ensureExpandedShowingChild(page, parentTitle, childTitle);
  }

  const toggle = workflowOutcomeExpandToggle(page, parentTitle);
  await expect(toggle).toBeVisible({ timeout: 10_000 });
  await toggle.click();
  await expect(child.first()).toBeHidden({ timeout: 10_000 });
}

export { DRAG_TITLE_PREFIX };
