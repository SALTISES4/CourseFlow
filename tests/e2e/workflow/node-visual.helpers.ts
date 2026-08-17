import { expect, type Page } from '@playwright/test';

import { authenticatedApiRequest } from '../../helpers/api';
import {
  workflowChannelHeader,
  workflowEditNodeForm,
  workflowEditNodeFormContextField,
  workflowEditNodeFormTaskTypeField,
  workflowEditNodeFormTimeField,
  workflowEditNodeFormTitleField,
  workflowNodeBorder,
  workflowNodeContent,
  workflowNodeMeta,
  workflowNodeMetaContextTag,
  workflowNodeMetaTaskTag,
  workflowNodeMetaTimeTag,
  workflowNodeTitle,
} from './workflow-graph.locators';

export type NodeMetaPatch = {
  title?: string | null;
  contextClassification?: number | null;
  taskClassification?: number | null;
  timeRequired?: number | null;
  timeUnits?: number | null;
};

type NodeResource = {
  uuid: string;
  title?: string;
  channelUuid?: string;
  linkedWorkflowUuid?: string | null;
  contextClassification?: number | null;
  taskClassification?: number | null;
  timeRequired?: number | null;
  timeUnits?: number | null;
};

type GraphViewForNodeSetup = {
  graph: { uuid: string };
  nodes: Array<{ uuid: string }>;
  sections: Array<{ uuid: string }>;
  channels: Array<{ uuid: string }>;
};

type GraphNodeCreateResponse = {
  changes: {
    nodes: {
      created: Array<{ uuid: string }>;
    };
  };
};

/** PATCH /api/node/{uuid}/meta — canvas chrome depends on these persisted values. */
export async function patchNodeMetaViaApi(
  page: Page,
  nodeUuid: string,
  patch: NodeMetaPatch,
): Promise<void> {
  const response = await authenticatedApiRequest(page, 'PATCH', `/api/node/${nodeUuid}/meta`, {
    data: patch,
  });
  expect(response.ok()).toBeTruthy();
}

export async function fetchNodeViaApi(page: Page, nodeUuid: string): Promise<NodeResource> {
  const response = await authenticatedApiRequest(page, 'GET', `/api/node/${nodeUuid}`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as NodeResource;
}

/** Ensure a minimal copied workflow has a real node without mutating its canonical seed asset. */
export async function ensureFirstWorkflowNodeViaApi(
  page: Page,
  workflowUuid: string,
): Promise<string> {
  const graphResponse = await authenticatedApiRequest(
    page,
    'GET',
    `/api/graph/${workflowUuid}/view`,
  );
  expect(graphResponse.ok()).toBeTruthy();
  const graphView = (await graphResponse.json()) as GraphViewForNodeSetup;
  const existingNode = graphView.nodes[0];
  if (existingNode) {
    return existingNode.uuid;
  }

  const section = graphView.sections[0];
  const channel = graphView.channels[0];
  if (!section || !channel) {
    throw new Error(
      `Workflow ${workflowUuid} must have a section and node category before creating a node.`,
    );
  }

  const createResponse = await authenticatedApiRequest(
    page,
    'POST',
    `/api/graph/${graphView.graph.uuid}/nodes`,
    {
      data: {
        sectionUuid: section.uuid,
        channelUuid: channel.uuid,
        sectionRow: 0,
      },
    },
  );
  expect(createResponse.ok()).toBeTruthy();
  const created = (await createResponse.json()) as GraphNodeCreateResponse;
  const node = created.changes.nodes.created[0];
  if (!node) {
    throw new Error(`Create node returned no node for workflow ${workflowUuid}.`);
  }
  return node.uuid;
}

export async function workflowNodeBorderBackgroundColor(
  page: Page,
  nodeUuid: string,
): Promise<string> {
  return workflowNodeBorder(page, nodeUuid).evaluate((el) => getComputedStyle(el).backgroundColor);
}

/** Channel header colour stripe (~10px) — same colour as workflowNodeBorder per FR-CHAN-003. */
export async function workflowChannelHeaderColorIndicatorBackgroundColor(
  page: Page,
  channelUuid: string,
): Promise<string> {
  return workflowChannelHeader(page, channelUuid).evaluate((root) => {
    const stripe = Array.from(root.querySelectorAll('div')).find((el) => {
      const height = el.getBoundingClientRect().height;
      return height >= 8 && height <= 12;
    });
    if (!stripe) {
      throw new Error(`Expected colour stripe on channel ${channelUuid}`);
    }
    return getComputedStyle(stripe).backgroundColor;
  });
}

export async function openWorkflowEditNodeFormFromCanvas(
  page: Page,
  nodeUuid: string,
): Promise<void> {
  await workflowNodeContent(page, nodeUuid).click();
  await expect(workflowEditNodeForm(page)).toBeVisible();
}

export async function waitForNodeMetaPatch(page: Page): Promise<void> {
  const response = await page.waitForResponse(
    (candidate) =>
      candidate.request().method() === 'PATCH' &&
      /\/api\/node\/[^/]+\/meta\/?$/.test(new URL(candidate.url()).pathname),
    { timeout: 15_000 },
  );
  expect(response.ok()).toBeTruthy();
}

/** FR-WF-NODE-001 — canvas chrome matches workflowEditNodeForm for activity nodes. */
export async function expectActivityNodeCanvasMatchesEditNodeForm(
  page: Page,
  nodeUuid: string,
  expected: {
    title: string;
    contextLabel: string;
    taskLabel: string;
    timeDisplay: string;
  },
): Promise<void> {
  await expect(workflowNodeTitle(page, nodeUuid)).toHaveText(expected.title);
  await expect(workflowNodeMeta(page, nodeUuid)).toBeVisible();
  await expect(workflowNodeMetaContextTag(page, nodeUuid)).toBeVisible();
  await expect(workflowNodeMetaTaskTag(page, nodeUuid)).toBeVisible();
  await expect(workflowNodeMetaTimeTag(page, nodeUuid)).toContainText(expected.timeDisplay);

  await openWorkflowEditNodeFormFromCanvas(page, nodeUuid);
  await expect(workflowEditNodeFormTitleField(page)).toHaveValue(expected.title);
  await expect(workflowEditNodeFormContextField(page)).toContainText(expected.contextLabel);
  await expect(workflowEditNodeFormTaskTypeField(page)).toContainText(expected.taskLabel);
  await expect(workflowEditNodeFormTimeField(page)).toHaveValue(expected.timeDisplay);
}
