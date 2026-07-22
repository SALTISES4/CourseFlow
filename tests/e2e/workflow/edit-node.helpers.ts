import { expect, type Locator, type Page } from '@playwright/test';

import { authenticatedApiRequest } from '../../helpers/api';
import type { WorkflowHandle } from '../../fixtures';
import {
  workflowRightSidebarAddTab,
  workflowSectionContainers,
} from '../../shared/locators/workflow';
import {
  dragNodeCategoryOntoSection,
  workflowNodeCount,
} from './add-tab.helpers';
import { firstWorkflowNodeUuid } from './comments-tab.helpers';
import { workflowAddTabInsertModeRowButton } from './workflow-add-tab.locators';
import {
  workflowEditNodeForm,
  workflowEditNodeFormDescriptionPlainTextarea,
  workflowEditNodeFormTimeAmountField,
  workflowEditNodeFormTimeField,
  workflowEditNodeFormTimeUnitField,
  workflowNodeContent,
  workflowRichTextDescriptionEditor,
  workflowRichTextDescriptionEditorBoldButton,
  workflowRichTextDescriptionEditorBulletListButton,
  workflowRichTextDescriptionEditorItalicButton,
  workflowRichTextDescriptionEditorLinkButton,
  workflowRichTextDescriptionEditorNumberedListButton,
  workflowRichTextDescriptionEditorSubscriptButton,
  workflowRichTextDescriptionEditorSuperscriptButton,
  workflowRichTextDescriptionEditorToolbar,
  workflowRichTextDescriptionEditorUnderlineButton,
} from './workflow-graph.locators';

export async function firstWorkflowSectionUuid(page: Page): Promise<string> {
  const section = workflowSectionContainers(page).first();
  await expect(section).toBeVisible({ timeout: 15_000 });
  const uuid = await section.getAttribute('data-section-id');
  if (!uuid) {
    throw new Error('Expected first workflowSectionContainer to have data-section-id.');
  }
  return uuid;
}

/** Open edit form for the first node on an already-loaded workflow graph. */
export async function openFirstNodeEditForm(page: Page): Promise<string> {
  const nodeUuid = await firstWorkflowNodeUuid(page);
  await workflowNodeContent(page, nodeUuid).click();
  await expect(workflowEditNodeForm(page)).toBeVisible();
  return nodeUuid;
}

/** Link (or clear) a node's linked workflow via API. */
export async function linkNodeWorkflowViaApi(
  page: Page,
  nodeUuid: string,
  workflowUuid: string | null,
): Promise<void> {
  const response = await authenticatedApiRequest(
    page,
    'POST',
    `/api/node/${nodeUuid}/link-workflow`,
    { data: { workflowUuid } },
  );
  expect(response.ok()).toBeTruthy();
}

/**
 * Drop a node onto the first empty section row using the given Add-tab category label,
 * then leave workflowEditNodeForm open. Returns the created node uuid.
 */
export async function dropNodeCategoryAndOpenEditForm(
  page: Page,
  categoryLabel: string,
): Promise<string> {
  const sectionUuid = await firstWorkflowSectionUuid(page);
  const beforeCount = await workflowNodeCount(page);
  const beforeNodeUuids = await page.locator('[id^="node-"]').evaluateAll((nodes) =>
    nodes.map((node) => node.id.slice('node-'.length)),
  );

  await workflowRightSidebarAddTab(page).click();
  await workflowAddTabInsertModeRowButton(page).click();
  await dragNodeCategoryOntoSection(page, categoryLabel, sectionUuid, 'empty');

  await expect
    .poll(async () => workflowNodeCount(page), { timeout: 15_000 })
    .toBe(beforeCount + 1);
  await expect(workflowEditNodeForm(page)).toBeVisible({ timeout: 15_000 });

  const afterNodeUuids = await page.locator('[id^="node-"]').evaluateAll((nodes) =>
    nodes.map((node) => node.id.slice('node-'.length)),
  );
  const created = afterNodeUuids.find((uuid) => !beforeNodeUuids.includes(uuid));
  if (!created) {
    throw new Error('Expected a newly created workflowNode after Add-tab drop.');
  }
  return created;
}

/** Seeded program nav fixture channel title (see e2e_seed orchestrator). */
export const E2E_NAV_PROGRAM_CHANNEL_TITLE = 'E2E Nav Program Channel';

/** FR-WF-EN-002 uiObjectDefinitions — workflowEditNodeFormActivityContextSelect */
export const ACTIVITY_CONTEXT_OPTIONS = [
  'None',
  'Individual Work',
  'Work in Groups',
  'Whole Class',
] as const;

/** FR-WF-EN-003 uiObjectDefinitions — workflowEditNodeFormCourseContextSelect */
export const COURSE_CONTEXT_OPTIONS = [
  'None',
  'Formative',
  'Summative',
  'Comprehensive',
] as const;

/** FR-WF-EN-002 uiObjectDefinitions — workflowEditNodeFormTaskTypeSelect */
export const ACTIVITY_TASK_TYPE_OPTIONS = [
  'None',
  'Gather Information',
  'Discuss',
  'Problem Solve',
  'Analyze',
  'Assess/Review Peers',
  'Debate',
  'Game/Roleplay',
  'Create/Design',
  'Revise/Improve',
  'Read',
  'Write',
  'Present',
  'Experiment/Inquiry',
  'Quiz/Test',
  'Instructor Resource Curation',
  'Instructor Orchestration',
  'Instructor Evaluation',
  'Other',
] as const;

/** Open a MUI Select and assert listbox options match exactly (order + labels). */
export async function expectSelectOptionsExactly(
  page: Page,
  select: Locator,
  expectedOptions: readonly string[],
): Promise<void> {
  await select.click();
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  const options = listbox.getByRole('option');
  await expect(options).toHaveCount(expectedOptions.length);
  for (let index = 0; index < expectedOptions.length; index += 1) {
    await expect(options.nth(index)).toHaveText(expectedOptions[index]!);
  }
  await page.keyboard.press('Escape');
  await expect(listbox).toBeHidden();
}

export async function ensureProgramNodeAndOpenEditForm(
  page: Page,
  workflow: WorkflowHandle,
): Promise<string> {
  const program = workflow.workflowByType('program');
  await page.goto(program.workflow_path);

  if ((await workflowNodeCount(page)) === 0) {
    return dropNodeCategoryAndOpenEditForm(page, E2E_NAV_PROGRAM_CHANNEL_TITLE);
  }
  return openFirstNodeEditForm(page);
}

/** FR-WF-EN-002…005 — single duration field labeled Time (not Amount + Unit type). */
export async function expectWorkflowEditNodeFormTimeField(page: Page): Promise<void> {
  await expect(workflowEditNodeFormTimeField(page)).toBeVisible();
  await expect(workflowEditNodeFormTimeAmountField(page)).toHaveCount(0);
  await expect(workflowEditNodeFormTimeUnitField(page)).toHaveCount(0);
}

/**
 * FR-WF-EN-012 — Description hosts workflowRichTextDescriptionEditor with the
 * required formatting toolbar (not a plain textarea/input).
 */
export async function expectEditableWorkflowEditNodeFormRichTextDescription(
  page: Page,
): Promise<void> {
  await expect(workflowEditNodeFormDescriptionPlainTextarea(page)).toHaveCount(0);
  await expect(workflowRichTextDescriptionEditor(page)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorToolbar(page)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorBoldButton(page)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorItalicButton(page)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorUnderlineButton(page)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorSuperscriptButton(page)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorSubscriptButton(page)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorBulletListButton(page)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorNumberedListButton(page)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorLinkButton(page)).toBeVisible();
}
