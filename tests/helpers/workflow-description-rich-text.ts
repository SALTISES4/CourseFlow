import { expect, type Locator } from '@playwright/test';

/** Plain input/textarea Description control — forbidden when FR-WF-EN-012 applies. */
export function workflowDescriptionPlainTextControlIn(container: Locator): Locator {
  return container.getByRole('textbox').and(container.locator('input, textarea'));
}

/** canonical: workflowRichTextDescriptionEditor — contenteditable region within a hosting form/dialog. */
export function workflowRichTextDescriptionEditorIn(container: Locator): Locator {
  return container.locator('[contenteditable="true"], [contenteditable=""]').first();
}

/** canonical: workflowRichTextDescriptionEditorToolbar */
export function workflowRichTextDescriptionEditorToolbarIn(container: Locator): Locator {
  return container.getByRole('toolbar');
}

export function workflowRichTextDescriptionEditorBoldButtonIn(container: Locator): Locator {
  return container.getByRole('button', { name: /^Bold$/i });
}

export function workflowRichTextDescriptionEditorItalicButtonIn(container: Locator): Locator {
  return container.getByRole('button', { name: /^Italic$/i });
}

export function workflowRichTextDescriptionEditorUnderlineButtonIn(container: Locator): Locator {
  return container.getByRole('button', { name: /^Underline$/i });
}

export function workflowRichTextDescriptionEditorSuperscriptButtonIn(container: Locator): Locator {
  return container.getByRole('button', { name: /^Superscript$/i });
}

export function workflowRichTextDescriptionEditorSubscriptButtonIn(container: Locator): Locator {
  return container.getByRole('button', { name: /^Subscript$/i });
}

export function workflowRichTextDescriptionEditorBulletListButtonIn(container: Locator): Locator {
  return container.getByRole('button', { name: /^(Bulleted list|Bullet list)$/i });
}

export function workflowRichTextDescriptionEditorNumberedListButtonIn(container: Locator): Locator {
  return container.getByRole('button', { name: /^(Numbered list|Ordered list)$/i });
}

export function workflowRichTextDescriptionEditorLinkButtonIn(container: Locator): Locator {
  return container.getByRole('button', { name: /^Link$/i });
}

/**
 * FR-WF-EN-012 — workflowDescriptionField (and equivalent Description regions) host
 * workflowRichTextDescriptionEditor with the required toolbar; not plain text/multiline input.
 */
export async function expectEditableWorkflowDescriptionRichTextPerFrWfEn012(
  container: Locator,
): Promise<void> {
  await expect(workflowDescriptionPlainTextControlIn(container)).toHaveCount(0);

  const editor = workflowRichTextDescriptionEditorIn(container);
  await expect(editor).toBeVisible();
  await expect(editor).toHaveAttribute('contenteditable', 'true');
  await expect(workflowRichTextDescriptionEditorToolbarIn(container)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorBoldButtonIn(container)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorItalicButtonIn(container)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorUnderlineButtonIn(container)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorSuperscriptButtonIn(container)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorSubscriptButtonIn(container)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorBulletListButtonIn(container)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorNumberedListButtonIn(container)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorLinkButtonIn(container)).toBeVisible();
}
