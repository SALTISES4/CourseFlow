import { expect, type Page } from '@playwright/test';
import { getProjectPath } from '../../helpers/manifest';
import { hoverWorkflowOutcomeHeader } from './comments-tab.helpers';
import { createProjectOverviewTag } from './edit-node.helpers';
import {
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
import {
  ensureOutcomeTitleByOrdinalPrefix,
  revealOutcomeByOrdinalPath,
  waitForOutcomeCreateResponse,
  workflowEditOutcomeForm,
  workflowEditOutcomeFormTagsAutocomplete,
  workflowEditOutcomeFormTagsField,
  workflowEditOutcomeFormTitleField,
  workflowOutcomeHeader,
  workflowOutcomeHeaderTagChip,
  workflowOutcomeHoverInsertChildForHeader,
} from './workflow-outcome.locators';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';

/** FR-WF-EO-005 / FR-WF-EN-012 — outcome Description uses rich-text editor in sidebar. */
export async function expectEditableWorkflowEditOutcomeFormRichTextDescription(
  page: Page,
): Promise<void> {
  await expect(workflowRichTextDescriptionEditor(page)).toBeVisible();
  await expect(workflowRichTextDescriptionEditor(page)).toHaveAttribute('contenteditable', 'true');
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

export async function expectEditOutcomeTagsIncludeOption(page: Page, label: string): Promise<void> {
  const field = workflowEditOutcomeFormTagsField(page);
  await expect(field).toBeVisible();
  await field.click();
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole('option', { name: label, exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(listbox).toBeHidden();
}

export async function selectEditOutcomeTag(page: Page, label: string): Promise<void> {
  const autocomplete = workflowEditOutcomeFormTagsAutocomplete(page);
  const combobox = workflowEditOutcomeFormTagsField(page);
  await combobox.click();
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await listbox.getByRole('option', { name: label, exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(listbox).toBeHidden();
  await expect(autocomplete.getByRole('button', { name: label, exact: true })).toBeVisible({
    timeout: 15_000,
  });
}

export async function createProjectTagForOutcomeTests(
  page: Page,
  workflow: { manifest: Parameters<typeof getProjectPath>[0] },
  label: string,
): Promise<void> {
  await page.goto(getProjectPath(workflow.manifest));
  await createProjectOverviewTag(page, label);
}

export async function createChildOutcomeUnderParent(
  page: Page,
  parentTitle: string,
  childOrdinal: string,
  childTitle: string,
): Promise<void> {
  const parentHeader = workflowOutcomeHeader(page, parentTitle);
  await hoverWorkflowOutcomeHeader(page, parentTitle);
  await Promise.all([
    waitForOutcomeCreateResponse(page),
    workflowOutcomeHoverInsertChildForHeader(page, parentHeader).click(),
  ]);
  await revealOutcomeByOrdinalPath(page, childOrdinal);
  await ensureOutcomeTitleByOrdinalPrefix(page, childOrdinal, childTitle);
  await expect(workflowOutcomeHeader(page, childTitle)).toBeVisible();
}

export async function openEditOutcomeFormForTitle(page: Page, title: string): Promise<void> {
  const form = workflowEditOutcomeForm(page);
  const titleField = workflowEditOutcomeFormTitleField(page);
  if (await form.isVisible()) {
    const currentTitle = await titleField.inputValue();
    if (currentTitle === title) {
      return;
    }
  }

  await workflowOutcomeHeader(page, title).click();
  await expect(workflowRightSidebarContentPanel(page)).toBeVisible({ timeout: 15_000 });
  await expect(form).toBeVisible();
}

export async function expectOutcomeHeaderTagChipVisible(
  page: Page,
  outcomeTitle: string,
  tagLabel: string,
): Promise<void> {
  await expect(workflowOutcomeHeaderTagChip(page, outcomeTitle, tagLabel)).toBeVisible({
    timeout: 15_000,
  });
}

export async function clearOutcomeTitleField(page: Page): Promise<void> {
  await workflowEditOutcomeFormTitleField(page).fill('');
  await workflowEditOutcomeFormTitleField(page).press('Tab');
}
