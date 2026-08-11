import { expect, type Locator, type Page } from '@playwright/test';

import { workflowChannelHeaderColorIndicatorBackgroundColor } from './node-visual.helpers';

/** FR-WF-ADD-003 / workflow_service.py default channel title + persisted colour pairs. */
export type WorkflowChannelColourSpec = { title: string; colour: string };

/** FR-CHAN-002 / FR-CHAN-004 — default when persisted channel colour is empty or cleared. */
export const INSERT_CHANNEL_DEFAULT_COLOUR = '#CFD8DC';
export const CHANNEL_DEFAULT_COLOUR = INSERT_CHANNEL_DEFAULT_COLOUR;

export const DEFAULT_WORKFLOW_CHANNEL_SPECS_BY_TYPE: Record<
  'activity' | 'course' | 'program',
  readonly WorkflowChannelColourSpec[]
> = {
  activity: [
    { title: 'Out of class (instructor)', colour: '#0B118A' },
    { title: 'Out of class (students)', colour: '#114BD4' },
    { title: 'In class (instructor)', colour: '#268AE5' },
    { title: 'In class (students)', colour: '#8BC8FF' },
  ],
  course: [
    { title: 'Preparation', colour: '#F7B92A' },
    { title: 'Lesson', colour: '#ED8934' },
    { title: 'Artifact', colour: '#ED4A28' },
    { title: 'Assessment', colour: '#AD1D35' },
  ],
  program: [
    { title: 'Custom node category', colour: '#468884' },
    { title: 'Custom node category', colour: '#6FA29F' },
    { title: 'Custom node category', colour: '#98BDBB' },
  ],
};

export function normalizeHexColour(hex: string): string {
  const trimmed = hex.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

export function hexToRgbCss(hex: string): string {
  const normalized = normalizeHexColour(hex).replace(/^#/, '');
  if (normalized.length !== 6) {
    throw new Error(`Expected 6-digit hex colour, got ${JSON.stringify(hex)}`);
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

export async function expectWorkflowChannelHeaderColour(
  page: Page,
  channelUuid: string,
  expectedHex: string,
): Promise<void> {
  const expectedRgb = hexToRgbCss(expectedHex);
  await expect
    .poll(async () => workflowChannelHeaderColorIndicatorBackgroundColor(page, channelUuid), {
      timeout: 10_000,
    })
    .toBe(expectedRgb);
}

/** Left-edge colour band on workflowAddTabNodeCategoryItem (border-left). */
export async function workflowAddTabNodeCategoryItemColorBandColor(
  page: Page,
  item: Locator,
): Promise<string> {
  return item.evaluate((el) => getComputedStyle(el).borderLeftColor);
}

export async function expectWorkflowAddTabNodeCategoryItemColour(
  page: Page,
  item: Locator,
  expectedHex: string,
): Promise<void> {
  const expectedRgb = hexToRgbCss(expectedHex);
  await expect
    .poll(async () => workflowAddTabNodeCategoryItemColorBandColor(page, item), {
      timeout: 10_000,
    })
    .toBe(expectedRgb);
}
