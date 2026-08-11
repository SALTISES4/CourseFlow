import { expect, type Page } from '@playwright/test';
import { loginAs } from '../../helpers/auth';
import {
  workflowEditOutcomeForm,
  workflowEditOutcomeFormCodeField,
  workflowEditOutcomeFormDeleteButton,
  workflowEditOutcomeFormDuplicateButton,
  workflowEditOutcomeFormTagsField,
  workflowEditOutcomeFormTitleField,
} from './workflow-outcome.locators';
import {
  deleteButtonInSidebar,
  duplicateButtonInSidebar,
  editSectionForm,
  titleFieldInEditSectionForm,
} from './edit-section.locators';
import {
  workflowEditChannelForm,
  workflowEditChannelFormColorField,
  workflowEditChannelFormDeleteButton,
  workflowEditChannelFormDuplicateButton,
  workflowEditChannelFormTitleField,
  workflowRichTextDescriptionEditor,
  workflowRichTextDescriptionEditorBoldButton,
  workflowRichTextDescriptionEditorToolbar,
} from './workflow-graph.locators';

export type WorkflowContributorRole = 'commenter' | 'viewer' | 'editor';

type WorkflowWithContributors = {
  contributorByRole: (role: string) => { email: string; password: string };
};

/** Clear storage state and log in as a project contributor (commenter, viewer, or editor). */
export async function loginAsWorkflowContributor(
  page: Page,
  workflow: WorkflowWithContributors,
  role: WorkflowContributorRole,
): Promise<void> {
  const account = workflow.contributorByRole(role);
  await loginAs(page, { email: account.email, password: account.password });
}

/** FR-WF-EO-004/005/006 — commenter, viewer, and user see read-only workflowEditOutcomeForm. */
export async function expectReadOnlyWorkflowEditOutcomeForm(page: Page): Promise<void> {
  await expect(workflowEditOutcomeForm(page)).toBeVisible();
  await expect(workflowEditOutcomeFormTitleField(page)).not.toBeEditable();
  await expect(workflowRichTextDescriptionEditor(page)).toHaveAttribute('contenteditable', 'false');
  const toolbar = workflowRichTextDescriptionEditorToolbar(page);
  if ((await toolbar.count()) > 0) {
    await expect(workflowRichTextDescriptionEditorBoldButton(page)).toBeDisabled();
  }
  await expect(workflowEditOutcomeFormCodeField(page)).not.toBeEditable();
  await expect(workflowEditOutcomeFormTagsField(page)).toBeDisabled();
  await expect(workflowEditOutcomeFormDuplicateButton(page)).toBeVisible();
  await expect(workflowEditOutcomeFormDuplicateButton(page)).toBeDisabled();
  await expect(workflowEditOutcomeFormDeleteButton(page)).toBeVisible();
  await expect(workflowEditOutcomeFormDeleteButton(page)).toBeDisabled();
}

/** FR-CHAN-001/003 — commenter and viewer see read-only workflowEditChannelForm (FR-CHAN-005/006 sidebar buttons disabled). */
export async function expectReadOnlyWorkflowEditChannelForm(page: Page): Promise<void> {
  await expect(workflowEditChannelForm(page)).toBeVisible();
  await expect(workflowEditChannelFormTitleField(page)).not.toBeEditable();
  await expect(workflowEditChannelFormColorField(page)).not.toBeEditable();
  await expect(workflowEditChannelFormDuplicateButton(page)).toBeVisible();
  await expect(workflowEditChannelFormDuplicateButton(page)).toBeDisabled();
  await expect(workflowEditChannelFormDeleteButton(page)).toBeVisible();
  await expect(workflowEditChannelFormDeleteButton(page)).toBeDisabled();
}

/** FR-SEC-001/003 — commenter and viewer see read-only workflowEditSectionForm (FR-SEC-005/006 sidebar buttons disabled). */
export async function expectReadOnlyWorkflowEditSectionForm(page: Page): Promise<void> {
  await expect(editSectionForm(page)).toBeVisible();
  await expect(titleFieldInEditSectionForm(page)).not.toBeEditable();
  await expect(duplicateButtonInSidebar(page)).toBeVisible();
  await expect(duplicateButtonInSidebar(page)).toBeDisabled();
  await expect(deleteButtonInSidebar(page)).toBeVisible();
  await expect(deleteButtonInSidebar(page)).toBeDisabled();
}
