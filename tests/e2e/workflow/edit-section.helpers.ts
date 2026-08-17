import { expect, type JSHandle, type Locator, type Page } from '@playwright/test';
import {
  editSectionForm,
  sectionContainer,
  sectionContainers,
  sectionCollapseButton,
  sectionHeader,
  sectionNodes,
  sectionNumberLabel,
  titleFieldInEditSectionForm,
} from './edit-section.locators';
import {
  edgesReferencingNodeUuids,
  fetchGraphView,
  nodesInSection,
  type GraphViewPayload,
} from './workflow-graph.helpers';
import { workflowNode } from './workflow-graph.locators';

type ActiveSectionDrag = {
  dataTransfer: JSHandle<DataTransfer>;
  source: Locator;
  target: Locator;
  clientX: number;
  clientY: number;
};

const activeSectionDrags = new WeakMap<Page, ActiveSectionDrag>();

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

type SectionFixture = {
  sectionByTitle: (title: string) => {
    uuid: string;
    title: string;
    position: number;
  };
};

/** FR-SEC-003 — editable section title auto-saves and survives reload. */
export async function expectSectionTitleChangePersistsAfterReload(
  page: Page,
  workflow: SectionFixture,
  sectionTitle = 'E2E Section 3',
): Promise<void> {
  const section = workflow.sectionByTitle(sectionTitle);
  const uniqueTitle = `E2E ${Date.now()}`;

  await sectionHeader(page, section.uuid).click();
  await expect(editSectionForm(page)).toBeVisible();
  await expect(editSectionForm(page).getByRole('button', { name: /^save$/i })).toHaveCount(0);

  await titleFieldInEditSectionForm(page).fill(uniqueTitle);
  await titleFieldInEditSectionForm(page).blur();

  await expect(sectionHeader(page, section.uuid)).toContainText(uniqueTitle, {
    timeout: 15_000,
  });

  await page.reload();
  await expect(sectionContainers(page).first()).toBeVisible();
  await sectionHeader(page, section.uuid).click();
  await expect(titleFieldInEditSectionForm(page)).toHaveValue(uniqueTitle, {
    timeout: 15_000,
  });
}

/** FR-SEC-003 — clearing title leaves workflowSectionNumberLabel only; restores seed title after. */
export async function expectClearingSectionTitleShowsNumberLabelOnly(
  page: Page,
  workflow: SectionFixture,
  sectionTitle = 'E2E Section 3',
): Promise<void> {
  const section = workflow.sectionByTitle(sectionTitle);
  const displayIndex = String(section.position + 1);

  await sectionHeader(page, section.uuid).click();
  await expect(editSectionForm(page)).toBeVisible();

  const titleBeforeClear = await titleFieldInEditSectionForm(page).inputValue();

  try {
    await titleFieldInEditSectionForm(page).fill('');
    await titleFieldInEditSectionForm(page).blur();

    await expect(titleFieldInEditSectionForm(page)).toHaveValue('', { timeout: 15_000 });
    await expect(sectionNumberLabel(page, section.uuid)).toHaveText(displayIndex);
    if (titleBeforeClear) {
      await expect(sectionHeader(page, section.uuid)).not.toContainText(titleBeforeClear);
    }
  } finally {
    await titleFieldInEditSectionForm(page).fill(section.title);
    await titleFieldInEditSectionForm(page).blur();
    await expect(sectionHeader(page, section.uuid)).toContainText(section.title, {
      timeout: 15_000,
    });
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
  await beginSectionDragTowardEdge(page, sourceUuid, targetUuid, edge);
  const activeDrag = activeSectionDrags.get(page);
  if (!activeDrag) {
    throw new Error('Expected an active section drag before drop.');
  }

  await activeDrag.target.dispatchEvent('drop', {
    dataTransfer: activeDrag.dataTransfer,
    clientX: activeDrag.clientX,
    clientY: activeDrag.clientY,
  });
  await activeDrag.source.dispatchEvent('dragend', {
    dataTransfer: activeDrag.dataTransfer,
    clientX: activeDrag.clientX,
    clientY: activeDrag.clientY,
  });
  await activeDrag.dataTransfer.dispose();
  activeSectionDrags.delete(page);
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
  await beginSectionDragTowardEdge(page, sourceUuid, targetUuid, 'bottom');
}

async function beginSectionDragTowardEdge(
  page: Page,
  sourceUuid: string,
  targetUuid: string,
  edge: 'top' | 'bottom',
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

  await expect(source).toHaveAttribute('draggable', 'true');

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await source.dispatchEvent('dragstart', {
    dataTransfer,
    clientX: startX,
    clientY: startY,
  });

  await expect(sectionCollapseButton(page, sourceUuid)).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  await target.scrollIntoViewIfNeeded();
  const collapsedTargetBox = await target.boundingBox();
  if (!collapsedTargetBox) {
    throw new Error(`Expected collapsed section ${targetUuid} bounding box for drop.`);
  }

  const clientX = collapsedTargetBox.x + collapsedTargetBox.width / 2;
  const clientY =
    collapsedTargetBox.y +
    (edge === 'top' ? collapsedTargetBox.height / 4 : (collapsedTargetBox.height * 3) / 4);

  await target.dispatchEvent('dragenter', { dataTransfer, clientX, clientY });
  await target.dispatchEvent('dragover', { dataTransfer, clientX, clientY });
  activeSectionDrags.set(page, { dataTransfer, source, target, clientX, clientY });
}

export async function endSectionDrag(page: Page): Promise<void> {
  const activeDrag = activeSectionDrags.get(page);
  if (!activeDrag) {
    throw new Error('Expected an active section drag before abort.');
  }
  await activeDrag.source.dispatchEvent('dragend', {
    dataTransfer: activeDrag.dataTransfer,
    clientX: activeDrag.clientX,
    clientY: activeDrag.clientY,
  });
  await activeDrag.dataTransfer.dispose();
  activeSectionDrags.delete(page);
}

/** FR-SEC-006 — deleted section's workflowNodes and incident workflowEdges are removed from the graph. */
export async function expectSectionDeleteRemovedGraphContent(
  page: Page,
  workflowUuid: string,
  deletedSectionUuid: string,
  graphBefore: GraphViewPayload,
): Promise<void> {
  const nodesBefore = nodesInSection(graphBefore, deletedSectionUuid);
  const nodeUuids = nodesBefore.map((node) => node.uuid);
  expect(
    nodeUuids.length,
    'Deleted section must contain workflowNodes for FR-SEC-006 graph cleanup.',
  ).toBeGreaterThan(0);

  const edgesBefore = edgesReferencingNodeUuids(graphBefore, nodeUuids);

  for (const nodeUuid of nodeUuids) {
    await expect(workflowNode(page, nodeUuid)).toHaveCount(0, { timeout: 10_000 });
  }

  await expect
    .poll(
      async () => {
        const graph = await fetchGraphView(page, workflowUuid);
        return {
          nodesInDeletedSection: nodesInSection(graph, deletedSectionUuid).length,
          edgesTouchingRemovedNodes: edgesReferencingNodeUuids(graph, nodeUuids).length,
        };
      },
      { timeout: 15_000 },
    )
    .toEqual({ nodesInDeletedSection: 0, edgesTouchingRemovedNodes: 0 });

  if (edgesBefore.length > 0) {
    const edgeIdsBefore = new Set(edgesBefore.map((edge) => edge.id));
    const graphAfter = await fetchGraphView(page, workflowUuid);
    expect(graphAfter.edges.filter((edge) => edgeIdsBefore.has(edge.id))).toEqual([]);
  }
}
