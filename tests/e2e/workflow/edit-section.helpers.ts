import { expect, type Page } from '@playwright/test';
import {
  sectionContainer,
  sectionContainers,
  sectionHeader,
  sectionNodes,
  sectionNumberLabel,
} from './edit-section.locators';

/** Top-to-bottom workflowSectionContainer uuids currently on the canvas. */
export async function sectionOrderUuids(page: Page): Promise<string[]> {
  return sectionContainers(page).evaluateAll((els) =>
    els
      .map((el) => el.getAttribute('data-section-id'))
      .filter((uuid): uuid is string => Boolean(uuid)),
  );
}

/** Node uuids rendered inside a section (`#node-{uuid}`). */
export async function sectionNodeUuids(page: Page, sectionUuid: string): Promise<string[]> {
  return sectionNodes(page, sectionUuid).evaluateAll((nodes) =>
    nodes
      .map((node) => {
        const id = node.getAttribute('id') ?? '';
        return id.startsWith('node-') ? id.slice('node-'.length) : '';
      })
      .filter(Boolean),
  );
}

export async function expectSectionNumberLabelsMatchOrder(
  page: Page,
  orderedUuids: string[],
): Promise<void> {
  for (let i = 0; i < orderedUuids.length; i++) {
    await expect(sectionNumberLabel(page, orderedUuids[i]!)).toHaveText(String(i + 1));
  }
}

/**
 * Drag workflowSectionHeader for `sourceUuid` onto `targetUuid` container
 * (bottom edge → place after target).
 */
export async function dragSectionBelow(
  page: Page,
  sourceUuid: string,
  targetUuid: string,
): Promise<void> {
  await dragSectionToEdge(page, sourceUuid, targetUuid, 'bottom');
}

/**
 * Drag workflowSectionHeader for `sourceUuid` onto `targetUuid` container
 * (top edge → place before target).
 */
export async function dragSectionAbove(
  page: Page,
  sourceUuid: string,
  targetUuid: string,
): Promise<void> {
  await dragSectionToEdge(page, sourceUuid, targetUuid, 'top');
}

async function dragSectionToEdge(
  page: Page,
  sourceUuid: string,
  targetUuid: string,
  edge: 'top' | 'bottom',
): Promise<void> {
  const source = sectionHeader(page, sourceUuid);
  const target = sectionContainer(page, targetUuid);

  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const targetBox = await target.boundingBox();
  if (!targetBox) {
    throw new Error(`Expected section ${targetUuid} bounding box for drop.`);
  }

  await source.dragTo(target, {
    force: true,
    targetPosition: {
      x: targetBox.width / 2,
      y: edge === 'top' ? targetBox.height / 4 : (targetBox.height * 3) / 4,
    },
  });
}

/** Reorder canvas sections to match `desiredOrder` (top → bottom uuids). */
export async function restoreSectionOrder(page: Page, desiredOrder: string[]): Promise<void> {
  for (let i = 0; i < desiredOrder.length; i++) {
    const desiredUuid = desiredOrder[i]!;
    const current = await sectionOrderUuids(page);
    if (current[i] === desiredUuid) {
      continue;
    }

    if (i === 0) {
      const first = current[0]!;
      await dragSectionAbove(page, desiredUuid, first);
    } else {
      await dragSectionBelow(page, desiredUuid, desiredOrder[i - 1]!);
    }

    await expect
      .poll(async () => (await sectionOrderUuids(page))[i], { timeout: 15_000 })
      .toBe(desiredUuid);
  }

  await expect.poll(async () => sectionOrderUuids(page)).toEqual(desiredOrder);
}

/** Start a section-header drag toward another section without releasing. */
export async function beginSectionDragToward(
  page: Page,
  sourceUuid: string,
  targetUuid: string,
): Promise<void> {
  const source = sectionHeader(page, sourceUuid);
  const target = sectionContainer(page, targetUuid);

  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error('Expected source header and target section bounding boxes.');
  }

  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 25 },
  );
}

export async function endSectionDrag(page: Page): Promise<void> {
  await page.mouse.up();
}
