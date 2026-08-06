import { expect, type Page } from '@playwright/test';

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

/**
 * FR-WF-EO-015/016/017 — drag source OutcomeHeader onto destination header.
 * `before` / `after` map to the FR 50/50 insert zones; `combine` uses the center nest zone.
 */
export async function dragOutcomeOntoHeader(
  page: Page,
  sourceTitle: string,
  targetTitle: string,
  position: 'before' | 'after' | 'combine',
): Promise<void> {
  const source = workflowOutcomeHeaderDragHandle(page, sourceTitle);
  const target = workflowOutcomeHeaderDragHandle(page, targetTitle);

  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const targetBox = await target.boundingBox();
  if (!targetBox) {
    throw new Error(`Expected bounding box for destination outcome ${JSON.stringify(targetTitle)}`);
  }

  const yRatio = position === 'before' ? 0.25 : position === 'after' ? 0.75 : 0.5;

  await Promise.all([
    waitForOutcomeMoveResponse(page),
    source.dragTo(target, {
      force: true,
      targetPosition: {
        x: Math.max(targetBox.width / 2, 8),
        y: targetBox.height * yRatio,
      },
    }),
  ]);
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

export { DRAG_TITLE_PREFIX };
