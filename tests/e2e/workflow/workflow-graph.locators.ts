import type { Locator, Page } from '@playwright/test';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';

/**
 * Workflow graph uiObjects — canonical_locators.yaml (workflowNode*, workflowChannel*).
 */

export const COMMENTS_HOVER_NAME = 'Comments';
export const INSERT_NODE_BELOW_NAME = 'Insert node below';
export const DUPLICATE_NODE_BELOW_NAME = 'Duplicate node below';
export const DELETE_NODE_HOVER_NAME = 'Delete node';
export const INSERT_CHANNEL_RIGHT_NAME = 'Insert right';
export const DUPLICATE_CHANNEL_HOVER_NAME = 'Duplicate';
export const DELETE_CHANNEL_HOVER_NAME = 'Delete';

export function workflowNodes(page: Page): Locator {
  return page.locator('[data-test-id="workflow-node"]');
}

/** canonical: workflowNode — DOM id `node-{workflowNodeId}` */
export function workflowNode(page: Page, nodeUuid: string): Locator {
  return page.locator(`#node-${nodeUuid}`);
}

/**
 * canonical: workflowNodeTitle — primary title at the top of workflowNodeContent.
 * Product maps MUI Typography body2 to a paragraph.
 */
export function workflowNodeTitle(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).getByRole('paragraph').first();
}

/**
 * canonical: workflowNodeContent — body region below workflowNodeBorder (title + meta).
 * Click target for FR-WF-EN-001 selection. Last-resort structure until a content test id exists.
 */
export function workflowNodeContent(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid)
    .locator('div')
    .filter({ has: workflowNodeTitle(page, nodeUuid) })
    .first();
}

/**
 * canonical: workflowNodeBorder — channel-colored top stripe.
 * Product sets inline backgroundColor on the stripe.
 */
export function workflowNodeBorder(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).locator('[style*="background"]').first();
}

/**
 * canonical: workflowNodeLinkedWorkflowIndicator —
 * 'Linked activity' (course parent) / 'Linked course' (program parent).
 */
export function workflowNodeLinkedWorkflowIndicator(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).getByRole('link', {
    name: /^(Linked activity|Linked course|Linked workflow)$/,
  });
}

/**
 * canonical: workflowNodeMeta — footer tag region when any context/task/time tag is present.
 * Located as the non-link svg tag row under content (absent when no tags would render).
 */
export function workflowNodeMeta(page: Page, nodeUuid: string): Locator {
  // Prefer the outermost tag footer (parent before IconWrap child in tree order).
  return workflowNodeContent(page, nodeUuid)
    .locator('div')
    .filter({ has: page.locator('span svg') })
    .filter({ hasNot: page.getByRole('link') })
    .first();
}

/** canonical: workflowNodeMetaContextTag / workflowNodeMetaTaskTag — icon-only tags (no nested text span). */
export function workflowNodeMetaIconTags(page: Page, nodeUuid: string): Locator {
  return workflowNodeMeta(page, nodeUuid)
    .locator('span')
    .filter({ has: page.locator('svg') })
    .filter({ hasNot: page.locator('span') });
}

export function workflowNodeMetaContextTag(page: Page, nodeUuid: string): Locator {
  return workflowNodeMetaIconTags(page, nodeUuid).nth(0);
}

export function workflowNodeMetaTaskTag(page: Page, nodeUuid: string): Locator {
  return workflowNodeMetaIconTags(page, nodeUuid).nth(1);
}

/**
 * canonical: workflowNodeMetaTimeTag — duration tag (timer icon; may include duration text).
 */
export function workflowNodeMetaTimeTag(page: Page, nodeUuid: string): Locator {
  return workflowNodeMeta(page, nodeUuid)
    .locator('span')
    .filter({ has: page.locator('svg') })
    .filter({ has: page.locator('span') });
}

/** canonical: workflowChannelHeaderColorIndicator — top color stripe on the channel header. */
export function workflowChannelHeaderColorIndicator(page: Page, channelUuid: string): Locator {
  return workflowChannelHeader(page, channelUuid).locator('div').nth(1);
}

export function workflowNodeHoverCommentsItem(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).getByRole('button', { name: COMMENTS_HOVER_NAME });
}

export function workflowNodeHoverInsertBelowItem(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).getByRole('button', { name: INSERT_NODE_BELOW_NAME });
}

export function workflowNodeHoverDuplicateItem(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).getByRole('button', { name: DUPLICATE_NODE_BELOW_NAME });
}

export function workflowNodeHoverDeleteItem(page: Page, nodeUuid: string): Locator {
  return workflowNode(page, nodeUuid).getByRole('button', { name: DELETE_NODE_HOVER_NAME });
}

export async function workflowNodeHasSelectedBorder(page: Page, nodeUuid: string): Promise<boolean> {
  return workflowNode(page, nodeUuid).evaluate((el) => {
    const shadow = getComputedStyle(el).boxShadow;
    return shadow !== 'none' && shadow !== '';
  });
}

export function workflowChannelHeaders(page: Page): Locator {
  return page.locator('[data-column-id]');
}

/** canonical: workflowChannel — column shell with data-column-id */
export function workflowChannelHeader(page: Page, channelUuid: string): Locator {
  return page.locator(`[data-column-id="${channelUuid}"]`);
}

export function workflowChannelHeaderByTitle(page: Page, title: string): Locator {
  return workflowChannelHeaders(page).filter({
    has: page.getByText(title, { exact: true }),
  });
}

export function workflowChannelHoverCommentsItem(page: Page, channelUuid: string): Locator {
  return workflowChannelHeader(page, channelUuid).getByRole('button', {
    name: COMMENTS_HOVER_NAME,
  });
}

export function workflowChannelHeaderTitle(page: Page, channelUuid: string): Locator {
  return workflowChannelHeader(page, channelUuid).locator('[class*="Title"], .MuiTypography-body2').first();
}

export function workflowChannelHoverInsertRightItem(page: Page, channelUuid: string): Locator {
  return workflowChannelHeader(page, channelUuid).getByRole('button', {
    name: INSERT_CHANNEL_RIGHT_NAME,
  });
}

export function workflowChannelHoverDuplicateItem(page: Page, channelUuid: string): Locator {
  return workflowChannelHeader(page, channelUuid).getByRole('button', {
    name: DUPLICATE_CHANNEL_HOVER_NAME,
  });
}

export function workflowChannelHoverDeleteItem(page: Page, channelUuid: string): Locator {
  return workflowChannelHeader(page, channelUuid).getByRole('button', {
    name: DELETE_CHANNEL_HOVER_NAME,
  });
}

export function workflowEditChannelFormColorField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Color$/i);
}

export function workflowEditChannelFormDuplicateButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: 'Duplicate', exact: true });
}

export function workflowEditChannelFormDeleteButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: 'Delete', exact: true });
}

/** canonical: workflowChannelDeleteDialog */
export function workflowChannelDeleteDialog(page: Page): Locator {
  return page.getByRole('dialog').filter({ hasText: 'You are about to delete a node category' });
}

export function workflowChannelDeleteDialogCancelButton(page: Page): Locator {
  return workflowChannelDeleteDialog(page).getByRole('button', { name: 'Cancel', exact: true });
}

export function workflowChannelDeleteDialogConfirmButton(page: Page): Locator {
  return workflowChannelDeleteDialog(page).getByRole('button', { name: 'Delete node category', exact: true });
}

/** canonical: workflowEditNodeForm heading */
export function workflowEditNodeForm(page: Page): Locator {
  return page.getByRole('heading', { name: 'Edit node', exact: true });
}

/** canonical: workflowEditChannelForm heading */
export function workflowEditChannelForm(page: Page): Locator {
  return page.getByRole('heading', { name: 'Edit node category', exact: true });
}

/** canonical: workflowEditNodeFormTitleField */
export function workflowEditNodeFormTitleField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Title$/i);
}

/** canonical: workflowEditNodeFormActivityContextSelect | workflowEditNodeFormCourseContextSelect */
export function workflowEditNodeFormContextField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Context$/i);
}

/** canonical: workflowEditNodeFormDescriptionField — labeled 'Description' region */
export function workflowEditNodeFormDescriptionField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Description$/i);
}

/**
 * Plain textarea Description control (forbidden by FR-WF-EN-012 when
 * workflowRichTextDescriptionEditor is required). Matches MUI multiline fields
 * labeled via <label for> as well as aria-label.
 */
export function workflowEditNodeFormDescriptionPlainTextarea(page: Page): Locator {
  const panel = workflowRightSidebarContentPanel(page);
  return panel
    .getByRole('textbox', { name: /^Description$/i })
    .or(panel.locator('textarea[aria-label="Description"]'));
}

/** canonical: workflowRichTextDescriptionEditor — contenteditable region */
export function workflowRichTextDescriptionEditor(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).locator('[contenteditable="true"]');
}

/** canonical: workflowRichTextDescriptionEditorToolbar */
export function workflowRichTextDescriptionEditorToolbar(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('toolbar');
}

export function workflowRichTextDescriptionEditorBoldButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: /^Bold$/i });
}

export function workflowRichTextDescriptionEditorItalicButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: /^Italic$/i });
}

export function workflowRichTextDescriptionEditorUnderlineButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: /^Underline$/i });
}

export function workflowRichTextDescriptionEditorSuperscriptButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: /^Superscript$/i });
}

export function workflowRichTextDescriptionEditorSubscriptButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: /^Subscript$/i });
}

export function workflowRichTextDescriptionEditorBulletListButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', {
    name: /^(Bulleted list|Bullet list)$/i,
  });
}

export function workflowRichTextDescriptionEditorNumberedListButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', {
    name: /^(Numbered list|Ordered list)$/i,
  });
}

export function workflowRichTextDescriptionEditorLinkButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: /^Link$/i });
}

/** canonical: workflowEditNodeFormTaskTypeSelect */
export function workflowEditNodeFormTaskTypeField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Type of task$/i);
}

/** Non-FR split controls (legacy product); assert absent for FR-WF-EN-002 Time field. */
export function workflowEditNodeFormTimeAmountField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Amount$/i);
}

export function workflowEditNodeFormTimeUnitField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Unit type$/i);
}

/** canonical: workflowEditNodeFormTimeField — single duration field labeled 'Time' */
export function workflowEditNodeFormTimeField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Time$/i);
}

/** canonical: workflowEditNodeFormTagsAutocomplete */
export function workflowEditNodeFormTagsField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Tags$/i);
}

/** canonical: workflowEditNodeFormCreditsField */
export function workflowEditNodeFormCreditsField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Credits$/i);
}

/** canonical: workflowEditNodeFormPonderationGroup */
export function workflowEditNodeFormPonderationGroup(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByText('Ponderation', { exact: true });
}

/** canonical: workflowEditNodeFormPonderationTheoryField */
export function workflowEditNodeFormPonderationTheoryField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Hrs\. theory$/i);
}

/** canonical: workflowEditNodeFormPonderationPracticeField */
export function workflowEditNodeFormPonderationPracticeField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Hrs\. practice$/i);
}

/** canonical: workflowEditNodeFormPonderationIndividualField */
export function workflowEditNodeFormPonderationIndividualField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Hrs\. individual$/i);
}

/** canonical: workflowEditNodeFormSpecificEducationSwitch */
export function workflowEditNodeFormSpecificEducationSwitch(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Specific education$/i);
}

/** canonical: workflowEditNodeFormLinkWorkflowButton — label varies by parent type + link state */
export function workflowEditNodeFormLinkWorkflowButton(
  page: Page,
  name:
    | 'Link an activity'
    | 'Link a course'
    | 'Remove linked activity'
    | 'Remove linked course'
    | 'Link workflow',
): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name, exact: true });
}

export function workflowEditNodeFormDuplicateButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: 'Duplicate', exact: true });
}

export function workflowEditNodeFormDeleteButton(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByRole('button', { name: 'Delete', exact: true });
}

/** FR-WF-EN-008/009 — dialog title copy by parent workflow type */
export const WORKFLOW_LINK_DIALOG_TITLE = {
  course: 'Link an activity',
  program: 'Link a course',
} as const;

/** FR-WF-EN-009 — confirm button copy by parent workflow type */
export const WORKFLOW_LINK_DIALOG_LINK_BUTTON = {
  course: 'Link activity',
  program: 'Link course',
} as const;

/** FR-WF-EN-009 — empty eligible-set copy */
export const WORKFLOW_LINK_DIALOG_NO_ELIGIBLE = {
  course: {
    title: 'No activity found',
    subtitle:
      'There are currently no activities in this project. Before you can link an activity to a node here, you must first add or create the activity within the project.',
  },
  program: {
    title: 'No course found',
    subtitle:
      'There are currently no courses in this project. Before you can link a course to a node here, you must first add or create the course within the project.',
  },
} as const;

export const WORKFLOW_LINK_DIALOG_SEARCH_NO_MATCHES = 'There are no exact matches.';

/**
 * canonical: workflowLinkWorkflowDialog — scoped by FR title
 * ('Link an activity' | 'Link a course').
 */
export function workflowLinkWorkflowDialog(
  page: Page,
  parentType: 'course' | 'program',
): Locator {
  const title = WORKFLOW_LINK_DIALOG_TITLE[parentType];
  return page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: title, exact: true }),
  });
}

/** canonical: workflowLinkWorkflowDialogTitle */
export function workflowLinkWorkflowDialogTitle(
  page: Page,
  parentType: 'course' | 'program',
): Locator {
  return workflowLinkWorkflowDialog(page, parentType).getByRole('heading', {
    name: WORKFLOW_LINK_DIALOG_TITLE[parentType],
    exact: true,
  });
}

/** canonical: workflowLinkWorkflowDialogSearchField */
export function workflowLinkWorkflowDialogSearchField(
  page: Page,
  parentType: 'course' | 'program',
): Locator {
  return workflowLinkWorkflowDialog(page, parentType).getByLabel(/^Search$/i);
}

/** canonical: workflowLinkWorkflowDialogSearchResults — workflowCard rows in the dialog */
export function workflowLinkWorkflowDialogSearchResults(
  page: Page,
  parentType: 'course' | 'program',
): Locator {
  return workflowLinkWorkflowDialog(page, parentType).locator('[data-test-id="workflow-card"]');
}

/** canonical: workflowLinkWorkflowDialogCancelButton */
export function workflowLinkWorkflowDialogCancelButton(
  page: Page,
  parentType: 'course' | 'program',
): Locator {
  return workflowLinkWorkflowDialog(page, parentType).getByRole('button', {
    name: 'Cancel',
    exact: true,
  });
}

/** canonical: workflowLinkWorkflowDialogLinkButton */
export function workflowLinkWorkflowDialogLinkButton(
  page: Page,
  parentType: 'course' | 'program',
): Locator {
  return workflowLinkWorkflowDialog(page, parentType).getByRole('button', {
    name: WORKFLOW_LINK_DIALOG_LINK_BUTTON[parentType],
    exact: true,
  });
}

/** canonical: workflowLinkWorkflowDialogEmptyState — search-no-match or no-eligible copy */
export function workflowLinkWorkflowDialogEmptyState(
  page: Page,
  parentType: 'course' | 'program',
): Locator {
  const dialog = workflowLinkWorkflowDialog(page, parentType);
  const noEligible = WORKFLOW_LINK_DIALOG_NO_ELIGIBLE[parentType];
  return dialog
    .getByText(WORKFLOW_LINK_DIALOG_SEARCH_NO_MATCHES, { exact: true })
    .or(dialog.getByText(noEligible.title, { exact: true }));
}

/** canonical: workflowEditChannelFormTitleField */
export function workflowEditChannelFormTitleField(page: Page): Locator {
  return workflowRightSidebarContentPanel(page).getByLabel(/^Title$/i);
}

export function workflowChannelHeaderBackground(page: Page, channelUuid: string): Locator {
  return workflowChannelHeader(page, channelUuid).locator('> div > div').first();
}

export async function workflowChannelHasSelectedBorder(
  page: Page,
  channelUuid: string,
): Promise<boolean> {
  const shadow = await workflowChannelHeaderBackground(page, channelUuid).evaluate((el) =>
    getComputedStyle(el).boxShadow,
  );
  return /2px/.test(shadow);
}

export async function workflowChannelSelectedBorderCount(page: Page): Promise<number> {
  const headers = workflowChannelHeaders(page);
  const count = await headers.count();
  let selected = 0;
  for (let i = 0; i < count; i++) {
    const uuid = await headers.nth(i).getAttribute('data-column-id');
    if (uuid && (await workflowChannelHasSelectedBorder(page, uuid))) {
      selected += 1;
    }
  }
  return selected;
}
