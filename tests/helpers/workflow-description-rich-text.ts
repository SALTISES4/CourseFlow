import { expect, type Locator } from '@playwright/test';

/** canonical: workflowRichTextDescriptionEditor — contenteditable region within a hosting form/dialog. */
export function workflowRichTextDescriptionEditorIn(container: Locator): Locator {
  return container.getByRole('textbox', { name: /description/i });
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

/** COURSEFLOW-690 — preserve the intended glyphs while using React Quill's SVG toolbar. */
export async function expectRichTextItalicAndUnderlineGlyphs(
  italicButton: Locator,
  underlineButton: Locator,
): Promise<void> {
  const italicIcon = italicButton.locator('svg');
  await expect(italicIcon).toBeVisible();
  const italicLines = await italicIcon.locator('line').evaluateAll((lines) =>
    lines.map((line) => ({
      x1: Number(line.getAttribute('x1')),
      x2: Number(line.getAttribute('x2')),
      y1: Number(line.getAttribute('y1')),
      y2: Number(line.getAttribute('y2')),
    })),
  );
  expect(italicLines).toHaveLength(3);
  expect(italicLines.filter((line) => line.y1 === line.y2)).toHaveLength(2);
  expect(
    italicLines.some(
      (line) => line.x1 !== line.x2 && line.y1 !== line.y2,
    ),
  ).toBe(true);

  const underlineIcon = underlineButton.locator('svg');
  await expect(underlineIcon).toBeVisible();
  await expect(underlineIcon.locator('path.ql-stroke')).toHaveCount(1);
  const underline = underlineIcon.locator('rect.ql-fill');
  await expect(underline).toHaveCount(1);
  const underlineGeometry = await underline.evaluate((element) => ({
    y: Number(element.getAttribute('y')),
    width: Number(element.getAttribute('width')),
    height: Number(element.getAttribute('height')),
  }));
  expect(underlineGeometry.y).toBeGreaterThanOrEqual(14);
  expect(underlineGeometry.width).toBeGreaterThanOrEqual(10);
  expect(underlineGeometry.height).toBeGreaterThan(0);
}

function containsHtmlMarkup(value: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(value);
}

/**
 * Assert the persisted value rendered by workflowRichTextDescriptionEditor.
 * ReactQuill wraps legacy plain-text values in paragraph markup while preserving
 * persisted rich-text HTML, so compare at the matching representation boundary.
 */
export async function expectWorkflowDescriptionRichTextValue(
  editor: Locator,
  expectedValue: string,
): Promise<void> {
  if (containsHtmlMarkup(expectedValue)) {
    await expect.poll(() => editor.evaluate((element) => element.innerHTML)).toBe(expectedValue);
    return;
  }

  await expect(editor).toHaveText(expectedValue);
}

/**
 * FR-WF-EN-012 — workflowDescriptionField (and equivalent Description regions) host
 * workflowRichTextDescriptionEditor with the required toolbar; not plain text/multiline input.
 */
export async function expectEditableWorkflowDescriptionRichTextPerFrWfEn012(
  container: Locator,
): Promise<void> {
  const editor = workflowRichTextDescriptionEditorIn(container);
  await expect(editor).toHaveCount(1);
  await expect(editor).toBeVisible();
  await expect(editor).toHaveAttribute('contenteditable', 'true');
  const toolbar = workflowRichTextDescriptionEditorToolbarIn(container);
  await expect(toolbar).toBeVisible();
  await expect(toolbar.getByRole('button')).toHaveCount(8);
  await expect(workflowRichTextDescriptionEditorBoldButtonIn(container)).toBeVisible();
  const italicButton = workflowRichTextDescriptionEditorItalicButtonIn(container);
  const underlineButton = workflowRichTextDescriptionEditorUnderlineButtonIn(container);
  await expect(italicButton).toBeVisible();
  await expect(underlineButton).toBeVisible();
  await expectRichTextItalicAndUnderlineGlyphs(italicButton, underlineButton);
  await expect(workflowRichTextDescriptionEditorSuperscriptButtonIn(container)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorSubscriptButtonIn(container)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorBulletListButtonIn(container)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorNumberedListButtonIn(container)).toBeVisible();
  await expect(workflowRichTextDescriptionEditorLinkButtonIn(container)).toBeVisible();
}
