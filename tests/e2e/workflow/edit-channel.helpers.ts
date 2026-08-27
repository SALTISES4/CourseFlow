import { expect, type Page } from '@playwright/test';

import { authenticatedApiRequest } from '../../helpers/api';
import { workflowChannelsHeaderRow } from '../../shared/locators/workflow';
import { workflowChannelHeader, workflowChannelHeaders } from './workflow-graph.locators';

type ActiveChannelDrag = {
  x: number;
  y: number;
};

const activeChannelDrags = new WeakMap<Page, ActiveChannelDrag>();

async function channelHeaderPoint(
  page: Page,
  channelUuid: string,
  edge: 'left' | 'center' | 'right',
): Promise<{ x: number; y: number }> {
  const header = workflowChannelHeader(page, channelUuid);
  await header.scrollIntoViewIfNeeded();
  const box = await header.boundingBox();
  if (!box) {
    throw new Error(`Expected bounding box for channel header ${channelUuid}.`);
  }

  const y = box.y + box.height / 2;
  const x =
    edge === 'left'
      ? box.x + 8
      : edge === 'right'
        ? box.x + box.width - 8
        : box.x + box.width / 2;
  return { x, y };
}

export async function channelHeaderCenterPoint(
  page: Page,
  channelUuid: string,
): Promise<{ x: number; y: number }> {
  return channelHeaderPoint(page, channelUuid, 'center');
}

/** Left-to-right workflowChannel uuids in workflowChannelsHeaderRow. */
export async function channelOrderUuids(page: Page): Promise<string[]> {
  return workflowChannelHeaders(page).evaluateAll((headers) =>
    headers
      .map((header) => header.getAttribute('data-column-id'))
      .filter((uuid): uuid is string => Boolean(uuid)),
  );
}

/** Atlaskit DropIndicator sibling rendered on destination header cells during drag. */
export function workflowChannelReorderDropIndicators(page: Page) {
  return workflowChannelsHeaderRow(page).locator('[data-column-id] > div:nth-child(2)');
}

export async function workflowChannelHeaderWrapOpacity(
  page: Page,
  channelUuid: string,
): Promise<string> {
  return workflowChannelHeader(page, channelUuid)
    .locator(':scope > div')
    .first()
    .evaluate((element) => getComputedStyle(element).opacity);
}

export async function beginChannelDragToward(
  page: Page,
  sourceUuid: string,
  targetUuid: string,
  edge: 'left' | 'right',
): Promise<void> {
  const source = await channelHeaderPoint(page, sourceUuid, 'center');
  await page.mouse.move(source.x, source.y);
  await page.mouse.down();
  await page.mouse.move(source.x + 12, source.y, { steps: 4 });

  const target = await channelHeaderPoint(page, targetUuid, edge);
  await page.mouse.move(target.x, target.y, { steps: 20 });
  activeChannelDrags.set(page, target);
}

export async function completeChannelDrag(page: Page): Promise<void> {
  const target = activeChannelDrags.get(page);
  if (!target) {
    throw new Error('Expected an active channel drag before drop.');
  }
  await page.mouse.up();
  activeChannelDrags.delete(page);
}

export async function abortChannelDragWithEscape(page: Page): Promise<void> {
  const target = activeChannelDrags.get(page);
  if (!target) {
    throw new Error('Expected an active channel drag before abort.');
  }
  await page.keyboard.press('Escape');
  await page.mouse.up();
  activeChannelDrags.delete(page);
}

export async function abortChannelDragByReleaseOutside(page: Page): Promise<void> {
  const target = activeChannelDrags.get(page);
  if (!target) {
    throw new Error('Expected an active channel drag before abort.');
  }
  await page.mouse.move(8, 8, { steps: 8 });
  await page.mouse.up();
  activeChannelDrags.delete(page);
}

export async function dragChannelBefore(
  page: Page,
  sourceUuid: string,
  targetUuid: string,
): Promise<void> {
  await beginChannelDragToward(page, sourceUuid, targetUuid, 'left');
  await completeChannelDrag(page);
}

export async function dragChannelAfter(
  page: Page,
  sourceUuid: string,
  targetUuid: string,
): Promise<void> {
  await beginChannelDragToward(page, sourceUuid, targetUuid, 'right');
  await completeChannelDrag(page);
}

export async function restoreChannelOrderViaApi(
  page: Page,
  graphUuid: string,
  desiredOrder: string[],
): Promise<void> {
  const response = await authenticatedApiRequest(
    page,
    'PUT',
    `/api/graph/${graphUuid}/channels/order`,
    { data: { channelUuids: desiredOrder } },
  );
  expect(response.ok(), `restore channel order HTTP ${response.status()}`).toBeTruthy();
  await page.reload();
  await expect
    .poll(async () => channelOrderUuids(page), { timeout: 15_000 })
    .toEqual(desiredOrder);
}
