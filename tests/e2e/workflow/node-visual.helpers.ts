import { expect, type Page } from '@playwright/test';

import { authenticatedApiRequest } from '../../helpers/api';
import {
  workflowChannelHeader,
  workflowNodeBorder,
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
