import { test, expect } from '../../fixtures';
import { loginAs, loginAsTestUser } from '../../helpers/auth';
import { getProjectPath } from '../../helpers/manifest';
import { cardChipWithLabel, workflowTypeChipLabel } from '../../shared/locators/cards';
import { workflowRightSidebarContentPanel, workflowRightSidebarEditTab } from '../../shared/locators/workflow';
import { addNewTagInput } from '../project/project.locators';
import { firstWorkflowNodeUuid, secondWorkflowNodeUuid } from './comments-tab.helpers';
import {
  ACTIVITY_CONTEXT_OPTIONS,
  ACTIVITY_TASK_TYPE_OPTIONS,
  COURSE_CONTEXT_OPTIONS,
  createProjectOverviewTag,
  ensureProgramNodeAndOpenEditForm,
  expectEditNodeTagSelected,
  expectEditNodeTagsAutocompleteOptions,
  expectEditableWorkflowEditNodeFormRichTextDescription,
  expectReadOnlyWorkflowEditNodeForm,
  expectSelectOptionsExactly,
  expectWorkflowEditNodeFormTimeField,
  linkNodeWorkflowViaApi,
  openCourseLinkWorkflowDialog,
  openFirstNodeEditForm,
  openProgramLinkWorkflowDialog,
  seededLinkedActivityUuid,
  selectEditNodeTag,
} from './edit-node.helpers';
import type { Page } from '@playwright/test';
import {
  WORKFLOW_LINK_DIALOG_SEARCH_NO_MATCHES,
  workflowEditNodeForm,
  workflowEditNodeFormContextField,
  workflowEditNodeFormCreditsField,
  workflowEditNodeFormDeleteButton,
  workflowEditNodeFormDescriptionLabel,
  workflowEditNodeFormDuplicateButton,
  workflowEditNodeFormLinkWorkflowButton,
  workflowEditNodeFormPonderationGroup,
  workflowEditNodeFormPonderationIndividualField,
  workflowEditNodeFormPonderationPracticeField,
  workflowEditNodeFormPonderationTheoryField,
  workflowEditNodeFormSpecificEducationSwitch,
  workflowEditNodeFormTagsField,
  workflowEditNodeFormTaskTypeField,
  workflowEditNodeFormTimeField,
  workflowEditNodeFormTitleField,
  workflowLinkWorkflowDialog,
  workflowLinkWorkflowDialogCancelButton,
  workflowLinkWorkflowDialogEmptyState,
  workflowLinkWorkflowDialogLinkButton,
  workflowLinkWorkflowDialogSearchField,
  workflowLinkWorkflowDialogSearchResults,
  workflowLinkWorkflowDialogTitle,
  workflowNode,
  workflowNodeContent,
  workflowNodeTitle,
  workflowRichTextDescriptionEditor,
  workflowRichTextDescriptionEditorToolbar,
} from './workflow-graph.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedAssets: ['workflow.navigation_course', 'workflow.navigation_program'],
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Edit node — FR-WF-EN-001 through FR-WF-EN-011 (Description rich text: FR-WF-EN-012).
 * Requirements: workflow_edit_node_requirements_v1.yaml
 */

test.describe('edit-node-fr-001-007', () => {
  test.describe('Open workflowEditNodeForm (FR-WF-EN-001)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
    });

    test('FR-WF-EN-001: click workflowNode expands sidebar on workflowRightSidebarEditTab', async ({ page }) => {
      const nodeUuid = await firstWorkflowNodeUuid(page);

      await expect(workflowRightSidebarContentPanel(page)).toBeHidden();

      await workflowNodeContent(page, nodeUuid).click();

      await expect(workflowRightSidebarContentPanel(page)).toBeVisible();
      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditNodeForm(page)).toBeVisible();
    });

    test('FR-WF-EN-001: click second workflowNode rebinds workflowEditNodeForm', async ({ page }) => {
      const firstUuid = await firstWorkflowNodeUuid(page);
      const secondUuid = await secondWorkflowNodeUuid(page);

      await workflowNodeContent(page, firstUuid).click();
      await expect(workflowEditNodeForm(page)).toBeVisible();

      await workflowNodeContent(page, secondUuid).click();

      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditNodeForm(page)).toBeVisible();
    });
  });

  test.describe('Activity field set (FR-WF-EN-002)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await openFirstNodeEditForm(page);
    });

    test('FR-WF-EN-002: activity workflowEditNodeForm shows activity fields, Duplicate, Delete, and no link button', async ({
      page,
    }) => {
      await expect(workflowEditNodeFormTitleField(page)).toBeVisible();
      await expect(workflowEditNodeFormDescriptionLabel(page)).toBeVisible();
      await expectEditableWorkflowEditNodeFormRichTextDescription(page);
      await expect(workflowEditNodeFormContextField(page)).toBeVisible();
      await expect(workflowEditNodeFormTaskTypeField(page)).toBeVisible();
      await expectWorkflowEditNodeFormTimeField(page);
      await expect(workflowEditNodeFormTagsField(page)).toBeVisible();

      await expect(workflowEditNodeFormDuplicateButton(page)).toBeVisible();
      await expect(workflowEditNodeFormDeleteButton(page)).toBeVisible();
      await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link an activity')).toHaveCount(0);
      await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link a course')).toHaveCount(0);
      await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link workflow')).toHaveCount(0);
    });

    test('FR-WF-EN-002: activity Context and Type of task offer exact FR option sets', async ({ page }) => {
      await expectSelectOptionsExactly(page, workflowEditNodeFormContextField(page), ACTIVITY_CONTEXT_OPTIONS);
      await expectSelectOptionsExactly(page, workflowEditNodeFormTaskTypeField(page), ACTIVITY_TASK_TYPE_OPTIONS);
    });

    test('FR-WF-EN-002: activity workflowEditNodeForm omits course/program-only controls', async ({ page }) => {
      await expect(workflowEditNodeFormCreditsField(page)).toHaveCount(0);
      await expect(workflowEditNodeFormPonderationGroup(page)).toHaveCount(0);
      await expect(workflowEditNodeFormSpecificEducationSwitch(page)).toHaveCount(0);
    });
  });

  test.describe('Course unlinked field set (FR-WF-EN-003)', () => {
    test('FR-WF-EN-003: course workflowEditNodeForm shows course fields and Link an activity', async ({
      page,
      workflow,
    }) => {
      const course = workflow.workflowByType('course');
      const activityUuid = seededLinkedActivityUuid(workflow);

      await page.goto(course.workflow_path);
      const nodeUuid = await firstWorkflowNodeUuid(page);

      try {
        await linkNodeWorkflowViaApi(page, nodeUuid, null);
        await page.reload();
        await openFirstNodeEditForm(page);

        await expect(workflowEditNodeFormTitleField(page)).toBeVisible();
        await expect(workflowEditNodeFormDescriptionLabel(page)).toBeVisible();
        await expectEditableWorkflowEditNodeFormRichTextDescription(page);
        await expect(workflowEditNodeFormContextField(page)).toBeVisible();
        await expectWorkflowEditNodeFormTimeField(page);
        await expect(workflowEditNodeFormTagsField(page)).toBeVisible();
        await expect(workflowEditNodeFormTaskTypeField(page)).toHaveCount(0);
        await expect(workflowEditNodeFormCreditsField(page)).toHaveCount(0);
        await expect(workflowEditNodeFormPonderationGroup(page)).toHaveCount(0);
        await expect(workflowEditNodeFormSpecificEducationSwitch(page)).toHaveCount(0);

        await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link an activity')).toBeVisible();
        await expect(workflowEditNodeFormDuplicateButton(page)).toBeVisible();
        await expect(workflowEditNodeFormDeleteButton(page)).toBeVisible();
      } finally {
        await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
      }
    });

    test('FR-WF-EN-003: course Context offers exact FR option sets', async ({ page, workflow }) => {
      const course = workflow.workflowByType('course');
      const activityUuid = seededLinkedActivityUuid(workflow);

      await page.goto(course.workflow_path);
      const nodeUuid = await firstWorkflowNodeUuid(page);

      try {
        await linkNodeWorkflowViaApi(page, nodeUuid, null);
        await page.reload();
        await openFirstNodeEditForm(page);

        await expectSelectOptionsExactly(page, workflowEditNodeFormContextField(page), COURSE_CONTEXT_OPTIONS);
      } finally {
        await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
      }
    });
  });

  test.describe('Course linked field set (FR-WF-EN-004)', () => {
    test('FR-WF-EN-004: linked course node mirrors activity title/description/time and keeps context+tags editable', async ({
      page,
      workflow,
    }) => {
      const course = workflow.workflowByType('course');
      const linkedTitle =
        workflow.manifest.navigation_linked_workflows?.activity.workflow_title ?? 'E2E Activity Workflow';

      await page.goto(course.workflow_path);
      await openFirstNodeEditForm(page);

      const titleField = workflowEditNodeFormTitleField(page);
      await expect(titleField).toBeVisible();
      await expect(titleField).toHaveValue(linkedTitle);
      await expect(titleField).toHaveAttribute('readonly', '');

      // FR-WF-EN-004 / FR-WF-EN-012 — mirrored description is read-only rich text (not plain editable).
      await expect(workflowRichTextDescriptionEditor(page)).toBeVisible();
      await expect(workflowRichTextDescriptionEditor(page)).toHaveAttribute('contenteditable', 'false');
      await expect(workflowRichTextDescriptionEditorToolbar(page)).toHaveCount(0);

      await expect(workflowEditNodeFormTimeField(page)).toBeVisible();
      await expect(workflowEditNodeFormTimeField(page)).toHaveAttribute('readonly', '');

      await expect(workflowEditNodeFormContextField(page)).toBeVisible();
      await expect(workflowEditNodeFormContextField(page)).toBeEnabled();
      await expect(workflowEditNodeFormTagsField(page)).toBeVisible();
      await expect(workflowEditNodeFormTagsField(page)).toBeEnabled();
      await expect(workflowEditNodeFormTaskTypeField(page)).toHaveCount(0);

      await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Remove linked activity')).toBeVisible();
      await expect(workflowEditNodeFormDuplicateButton(page)).toBeVisible();
      await expect(workflowEditNodeFormDeleteButton(page)).toBeVisible();
    });

    test('FR-WF-EN-004: linked course Context offers exact FR option sets', async ({ page, workflow }) => {
      const course = workflow.workflowByType('course');
      await page.goto(course.workflow_path);
      await openFirstNodeEditForm(page);

      await expect(workflowEditNodeFormContextField(page)).toBeEnabled();
      await expectSelectOptionsExactly(page, workflowEditNodeFormContextField(page), COURSE_CONTEXT_OPTIONS);
    });
  });

  test.describe('Program unlinked field set (FR-WF-EN-005)', () => {
    test('FR-WF-EN-005: program workflowEditNodeForm shows program fields and Link a course', async ({
      page,
      workflow,
    }) => {
      await ensureProgramNodeAndOpenEditForm(page, workflow);

      await expect(workflowEditNodeFormTitleField(page)).toBeVisible();
      await expect(workflowEditNodeFormDescriptionLabel(page)).toBeVisible();
      await expectEditableWorkflowEditNodeFormRichTextDescription(page);
      await expectWorkflowEditNodeFormTimeField(page);
      await expect(workflowEditNodeFormCreditsField(page)).toBeVisible();
      await expect(workflowEditNodeFormPonderationGroup(page)).toBeVisible();
      await expect(workflowEditNodeFormPonderationTheoryField(page)).toBeVisible();
      await expect(workflowEditNodeFormPonderationPracticeField(page)).toBeVisible();
      await expect(workflowEditNodeFormPonderationIndividualField(page)).toBeVisible();
      await expect(workflowEditNodeFormSpecificEducationSwitch(page)).toBeVisible();
      await expect(workflowEditNodeFormSpecificEducationSwitch(page)).not.toBeChecked();
      await expect(workflowEditNodeFormTagsField(page)).toBeVisible();

      await expect(workflowEditNodeFormContextField(page)).toHaveCount(0);
      await expect(workflowEditNodeFormTaskTypeField(page)).toHaveCount(0);

      await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link a course')).toBeVisible();
      await expect(workflowEditNodeFormDuplicateButton(page)).toBeVisible();
      await expect(workflowEditNodeFormDeleteButton(page)).toBeVisible();
    });
  });

  test.describe('Program linked field set (FR-WF-EN-006)', () => {
    test('FR-WF-EN-006: linked program node mirrors course metadata and keeps tags + specific education editable', async ({
      page,
      workflow,
    }) => {
      const course = workflow.workflowByType('course');
      const linkedTitle = workflow.manifest.navigation_linked_workflows?.course.workflow_title ?? 'E2E Course Workflow';

      const nodeUuid = await ensureProgramNodeAndOpenEditForm(page, workflow);
      await linkNodeWorkflowViaApi(page, nodeUuid, course.workflow_uuid);
      await page.reload();
      await expect(workflowNode(page, nodeUuid)).toBeVisible({
        timeout: 15_000,
      });
      await workflowNodeTitle(page, nodeUuid).click();
      await expect(workflowEditNodeForm(page)).toBeVisible();

      try {
        const titleField = workflowEditNodeFormTitleField(page);
        await expect(titleField).toBeVisible();
        await expect(titleField).toHaveValue(linkedTitle);
        await expect(titleField).toHaveAttribute('readonly', '');

        await expect(workflowRichTextDescriptionEditor(page)).toBeVisible();
        await expect(workflowRichTextDescriptionEditor(page)).toHaveAttribute('contenteditable', 'false');
        await expect(workflowEditNodeFormTimeField(page)).toBeVisible();
        await expect(workflowEditNodeFormTimeField(page)).toHaveAttribute('readonly', '');
        await expect(workflowEditNodeFormCreditsField(page)).toBeVisible();
        await expect(workflowEditNodeFormCreditsField(page)).toHaveAttribute('readonly', '');
        await expect(workflowEditNodeFormPonderationTheoryField(page)).toHaveAttribute('readonly', '');
        await expect(workflowEditNodeFormPonderationPracticeField(page)).toHaveAttribute('readonly', '');
        await expect(workflowEditNodeFormPonderationIndividualField(page)).toHaveAttribute('readonly', '');

        await expect(workflowEditNodeFormTagsField(page)).toBeVisible();
        await expect(workflowEditNodeFormTagsField(page)).toBeEnabled();
        await expect(workflowEditNodeFormSpecificEducationSwitch(page)).toBeVisible();
        await expect(workflowEditNodeFormSpecificEducationSwitch(page)).toBeEnabled();

        await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Remove linked course')).toBeVisible();
        await expect(workflowEditNodeFormDuplicateButton(page)).toBeVisible();
        await expect(workflowEditNodeFormDeleteButton(page)).toBeVisible();
      } finally {
        await linkNodeWorkflowViaApi(page, nodeUuid, null);
      }
    });
  });

  test.describe('Auto-save (FR-WF-EN-007)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
    });

    test('FR-WF-EN-007: title change persists without explicit save control', async ({ page }) => {
      const nodeUuid = await firstWorkflowNodeUuid(page);
      const uniqueTitle = `E2E Node ${Date.now()}`;

      await workflowNodeContent(page, nodeUuid).click();
      await expect(workflowEditNodeForm(page)).toBeVisible();

      await workflowEditNodeFormTitleField(page).fill(uniqueTitle);
      await page.waitForTimeout(500);

      await page.reload();
      await expect(workflowNode(page, nodeUuid)).toBeVisible({
        timeout: 15_000,
      });
      await workflowNodeContent(page, nodeUuid).click();
      await expect(workflowEditNodeFormTitleField(page)).toHaveValue(uniqueTitle);
    });

    test('FR-WF-EN-007: workflowEditNodeForm does not show auto-save status indicator', async ({ page }) => {
      const nodeUuid = await firstWorkflowNodeUuid(page);

      await workflowNodeContent(page, nodeUuid).click();
      await workflowEditNodeFormTitleField(page).fill(`E2E autosave ${Date.now()}`);

      await expect(page.getByText(/^Saving/i)).toHaveCount(0);
      await expect(page.getByText(/^Saved/i)).toHaveCount(0);
    });
  });

  test.describe('Tags autocomplete from project catalog (FR-WF-EN-002–006, FR-PROJ-OV-005)', () => {
    test.use({ seedAccess: 'disposable-project-copy' });

    /**
     * Create two project tags, open edit-node Tags, assert the option list is
     * exactly those catalog labels, select one, and verify it persists.
     */
    async function expectEditNodeTagsMatchProjectCatalog(page: Page, openEditForm: () => Promise<void>): Promise<void> {
      const stamp = Date.now();
      const tagA = `E2E Node Tag A ${stamp}`;
      const tagB = `E2E Node Tag B ${stamp}`;

      await createProjectOverviewTag(page, tagA);
      await createProjectOverviewTag(page, tagB);

      await openEditForm();
      await expectEditNodeTagsAutocompleteOptions(page, [tagA, tagB]);
      await selectEditNodeTag(page, tagA);
      await page.waitForTimeout(500);

      // openEditForm navigates to the workflow, which provides the reload
      // boundary without aborting auth bootstrap via a second navigation.
      await openEditForm();
      await expectEditNodeTagSelected(page, tagA);
      await expectEditNodeTagsAutocompleteOptions(page, [tagA, tagB]);
    }

    test('FR-WF-EN-002: activity Tags autocomplete offers project catalog tags and persists selection', async ({
      page,
      workflow,
    }) => {
      await page.goto(getProjectPath(workflow.manifest));
      await expect(addNewTagInput(page)).toBeVisible({ timeout: 15_000 });

      await expectEditNodeTagsMatchProjectCatalog(page, async () => {
        await page.goto(workflow.path);
        await openFirstNodeEditForm(page);
      });
    });

    test('FR-WF-EN-003: course Tags autocomplete offers project catalog tags and persists selection', async ({
      page,
      workflow,
    }) => {
      const course = workflow.workflowByType('course');
      const activityUuid = seededLinkedActivityUuid(workflow);
      let nodeUuid = '';

      await page.goto(getProjectPath(workflow.manifest));
      await expect(addNewTagInput(page)).toBeVisible({ timeout: 15_000 });

      try {
        await expectEditNodeTagsMatchProjectCatalog(page, async () => {
          await page.goto(course.workflow_path);
          nodeUuid = await firstWorkflowNodeUuid(page);
          await linkNodeWorkflowViaApi(page, nodeUuid, null);
          await page.reload();
          await openFirstNodeEditForm(page);
        });
      } finally {
        if (nodeUuid) {
          await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
        }
      }
    });

    test('FR-WF-EN-005: program Tags autocomplete offers project catalog tags and persists selection', async ({
      page,
      workflow,
    }) => {
      await page.goto(getProjectPath(workflow.manifest));
      await expect(addNewTagInput(page)).toBeVisible({ timeout: 15_000 });

      await expectEditNodeTagsMatchProjectCatalog(page, async () => {
        await ensureProgramNodeAndOpenEditForm(page, workflow);
      });
    });
  });

  test.describe('Link workflow dialog open (FR-WF-EN-008)', () => {
    test('FR-WF-EN-008: course Link an activity opens dialog titled Link an activity', async ({ page, workflow }) => {
      const activityUuid = seededLinkedActivityUuid(workflow);
      let nodeUuid = '';

      try {
        nodeUuid = await openCourseLinkWorkflowDialog(page, workflow);

        await expect(workflowLinkWorkflowDialogTitle(page, 'course')).toBeVisible();
        await expect(workflowLinkWorkflowDialogSearchField(page, 'course')).toBeVisible();
        await expect(workflowLinkWorkflowDialogCancelButton(page, 'course')).toBeVisible();
        await expect(workflowLinkWorkflowDialogLinkButton(page, 'course')).toBeVisible();
        await expect(workflowLinkWorkflowDialogSearchResults(page, 'course').first()).toBeVisible({
          timeout: 15_000,
        });
      } finally {
        if (nodeUuid) {
          await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
        }
      }
    });

    test('FR-WF-EN-008: program Link a course opens dialog titled Link a course', async ({ page, workflow }) => {
      await openProgramLinkWorkflowDialog(page, workflow);

      await expect(workflowLinkWorkflowDialogTitle(page, 'program')).toBeVisible();
      await expect(workflowLinkWorkflowDialogSearchField(page, 'program')).toBeVisible();
      await expect(workflowLinkWorkflowDialogCancelButton(page, 'program')).toBeVisible();
      await expect(workflowLinkWorkflowDialogLinkButton(page, 'program')).toBeVisible();
      await expect(workflowLinkWorkflowDialogSearchResults(page, 'program').first()).toBeVisible({
        timeout: 15_000,
      });
      await workflowLinkWorkflowDialogCancelButton(page, 'program').click();
      await expect(workflowLinkWorkflowDialog(page, 'program')).toBeHidden();
    });
  });

  test.describe('Link workflow dialog behavior (FR-WF-EN-009)', () => {
    test('FR-WF-EN-009: first workflowCard is selected and Link activity is enabled', async ({ page, workflow }) => {
      const activityUuid = seededLinkedActivityUuid(workflow);
      let nodeUuid = '';

      try {
        nodeUuid = await openCourseLinkWorkflowDialog(page, workflow);
        const cards = workflowLinkWorkflowDialogSearchResults(page, 'course');
        await expect(cards.first()).toBeVisible({ timeout: 15_000 });
        await expect(cards.first()).toHaveClass(/selected/);
        await expect(workflowLinkWorkflowDialogLinkButton(page, 'course')).toBeEnabled();
        await expect(workflowLinkWorkflowDialogLinkButton(page, 'course')).toHaveText('Link activity');
      } finally {
        if (nodeUuid) {
          await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
        }
      }
    });

    test('FR-WF-EN-009: search with zero matches shows There are no exact matches', async ({ page, workflow }) => {
      const activityUuid = seededLinkedActivityUuid(workflow);
      let nodeUuid = '';

      try {
        nodeUuid = await openCourseLinkWorkflowDialog(page, workflow);
        await expect(workflowLinkWorkflowDialogSearchResults(page, 'course').first()).toBeVisible({
          timeout: 15_000,
        });

        await workflowLinkWorkflowDialogSearchField(page, 'course').fill(`no-match-${Date.now()}-zzzz`);
        await expect(workflowLinkWorkflowDialogEmptyState(page, 'course')).toHaveText(
          WORKFLOW_LINK_DIALOG_SEARCH_NO_MATCHES,
        );
        await expect(workflowLinkWorkflowDialogSearchResults(page, 'course')).toHaveCount(0);
        await expect(workflowLinkWorkflowDialogLinkButton(page, 'course')).toBeDisabled();
      } finally {
        if (nodeUuid) {
          await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
        }
      }
    });

    test('FR-WF-EN-009: Cancel closes dialog without linking', async ({ page, workflow }) => {
      const activityUuid = seededLinkedActivityUuid(workflow);
      let nodeUuid = '';

      try {
        nodeUuid = await openCourseLinkWorkflowDialog(page, workflow);
        await expect(workflowLinkWorkflowDialogSearchResults(page, 'course').first()).toBeVisible({
          timeout: 15_000,
        });
        await workflowLinkWorkflowDialogCancelButton(page, 'course').click();
        await expect(workflowLinkWorkflowDialog(page, 'course')).toBeHidden();
        await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link an activity')).toBeVisible();
      } finally {
        if (nodeUuid) {
          await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
        }
      }
    });

    test('FR-WF-EN-009: Escape closes dialog without linking', async ({ page, workflow }) => {
      const activityUuid = seededLinkedActivityUuid(workflow);
      let nodeUuid = '';

      try {
        nodeUuid = await openCourseLinkWorkflowDialog(page, workflow);
        await expect(workflowLinkWorkflowDialog(page, 'course')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(workflowLinkWorkflowDialog(page, 'course')).toBeHidden();
        await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link an activity')).toBeVisible();
      } finally {
        if (nodeUuid) {
          await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
        }
      }
    });

    test('FR-WF-EN-009: Link activity links selected workflow and enters linked form state', async ({
      page,
      workflow,
    }) => {
      const activityUuid = seededLinkedActivityUuid(workflow);
      const linkedTitle =
        workflow.manifest.navigation_linked_workflows?.activity.workflow_title ?? 'E2E Activity Workflow';
      let nodeUuid = '';

      try {
        nodeUuid = await openCourseLinkWorkflowDialog(page, workflow);
        const cards = workflowLinkWorkflowDialogSearchResults(page, 'course');
        await expect(cards.first()).toBeVisible({ timeout: 15_000 });

        const activityCard = cards.filter({ hasText: linkedTitle }).first();
        await expect(activityCard).toBeVisible();
        await activityCard.click();
        await workflowLinkWorkflowDialogLinkButton(page, 'course').click();

        await expect(workflowLinkWorkflowDialog(page, 'course')).toBeHidden();
        await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Remove linked activity')).toBeVisible();
        await expect(workflowEditNodeFormTitleField(page)).toHaveValue(linkedTitle);
        await expect(workflowEditNodeFormTitleField(page)).toHaveAttribute('readonly', '');
      } finally {
        if (nodeUuid) {
          await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
        }
      }
    });
  });

  test.describe('Link eligibility (FR-WF-EN-010)', () => {
    test('FR-WF-EN-010: course dialog lists only Activity workflowCards from the parent project', async ({
      page,
      workflow,
    }) => {
      const activityUuid = seededLinkedActivityUuid(workflow);
      const activityTitle =
        workflow.manifest.navigation_linked_workflows?.activity.workflow_title ?? 'E2E Activity Workflow';
      let nodeUuid = '';

      try {
        nodeUuid = await openCourseLinkWorkflowDialog(page, workflow);
        const cards = workflowLinkWorkflowDialogSearchResults(page, 'course');
        await expect(cards.first()).toBeVisible({ timeout: 15_000 });

        const count = await cards.count();
        expect(count).toBeGreaterThan(0);
        for (let index = 0; index < count; index += 1) {
          const card = cards.nth(index);
          await expect(cardChipWithLabel(card, workflowTypeChipLabel('activity'))).toBeVisible();
          await expect(cardChipWithLabel(card, workflowTypeChipLabel('course'))).toHaveCount(0);
          await expect(cardChipWithLabel(card, workflowTypeChipLabel('program'))).toHaveCount(0);
        }
        await expect(cards.filter({ hasText: activityTitle }).first()).toBeVisible();
      } finally {
        if (nodeUuid) {
          await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
        }
      }
    });

    test('FR-WF-EN-010: program dialog lists only Course workflowCards from the parent project', async ({
      page,
      workflow,
    }) => {
      const courseTitle = workflow.manifest.navigation_linked_workflows?.course.workflow_title ?? 'E2E Course Workflow';

      await openProgramLinkWorkflowDialog(page, workflow);
      const cards = workflowLinkWorkflowDialogSearchResults(page, 'program');
      await expect(cards.first()).toBeVisible({ timeout: 15_000 });

      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
      for (let index = 0; index < count; index += 1) {
        const card = cards.nth(index);
        await expect(cardChipWithLabel(card, workflowTypeChipLabel('course'))).toBeVisible();
        await expect(cardChipWithLabel(card, workflowTypeChipLabel('activity'))).toHaveCount(0);
        await expect(cardChipWithLabel(card, workflowTypeChipLabel('program'))).toHaveCount(0);
      }
      await expect(cards.filter({ hasText: courseTitle }).first()).toBeVisible();
      await workflowLinkWorkflowDialogCancelButton(page, 'program').click();
    });
  });

  test.describe('Unlink linked workflow (FR-WF-EN-011)', () => {
    test('FR-WF-EN-011: Remove linked activity clears link and restores editable fields', async ({
      page,
      workflow,
    }) => {
      const course = workflow.workflowByType('course');
      const activityUuid = seededLinkedActivityUuid(workflow);
      const linkedTitle =
        workflow.manifest.navigation_linked_workflows?.activity.workflow_title ?? 'E2E Activity Workflow';

      await page.goto(course.workflow_path);
      const nodeUuid = await firstWorkflowNodeUuid(page);
      await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
      await page.reload();
      await openFirstNodeEditForm(page);

      await expect(workflowEditNodeFormTitleField(page)).toHaveValue(linkedTitle);
      await expect(workflowEditNodeFormTitleField(page)).toHaveAttribute('readonly', '');

      await workflowEditNodeFormLinkWorkflowButton(page, 'Remove linked activity').click();

      await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link an activity')).toBeVisible();
      await expect(workflowEditNodeFormTitleField(page)).toBeEditable();
      await expectEditableWorkflowEditNodeFormRichTextDescription(page);
      await expect(workflowEditNodeFormTimeField(page)).toBeEditable();

      await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
    });

    test('FR-WF-EN-011: Remove linked course clears link and restores editable fields', async ({ page, workflow }) => {
      const course = workflow.workflowByType('course');
      const linkedTitle = workflow.manifest.navigation_linked_workflows?.course.workflow_title ?? 'E2E Course Workflow';

      const nodeUuid = await ensureProgramNodeAndOpenEditForm(page, workflow);
      await linkNodeWorkflowViaApi(page, nodeUuid, course.workflow_uuid);
      await page.reload();
      await expect(workflowNode(page, nodeUuid)).toBeVisible({
        timeout: 15_000,
      });
      await workflowNodeTitle(page, nodeUuid).click();
      await expect(workflowEditNodeForm(page)).toBeVisible();

      try {
        await expect(workflowEditNodeFormTitleField(page)).toHaveValue(linkedTitle);
        await workflowEditNodeFormLinkWorkflowButton(page, 'Remove linked course').click();

        await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link a course')).toBeVisible();
        await expect(workflowEditNodeFormTitleField(page)).toBeEditable();
        await expectEditableWorkflowEditNodeFormRichTextDescription(page);
        await expect(workflowEditNodeFormTimeField(page)).toBeEditable();
        await expect(workflowEditNodeFormCreditsField(page)).toBeEditable();
        await expect(workflowEditNodeFormPonderationTheoryField(page)).toBeEditable();
      } finally {
        await linkNodeWorkflowViaApi(page, nodeUuid, null);
      }
    });
  });

  test.describe('Commenter and viewer permissions (FR-WF-EN-001, 010, 012)', () => {
    async function loginAsRole(
      page: Page,
      workflow: {
        contributorByRole: (role: string) => {
          email: string;
          password: string;
        };
      },
      role: 'commenter' | 'viewer',
    ): Promise<void> {
      const account = workflow.contributorByRole(role);
      await loginAs(page, { email: account.email, password: account.password });
    }

    async function expectDisabledCourseLinkButton(page: Page): Promise<void> {
      const linkButton = workflowEditNodeFormLinkWorkflowButton(page, 'Link an activity').or(
        workflowEditNodeFormLinkWorkflowButton(page, 'Remove linked activity'),
      );
      await expect(linkButton).toBeVisible();
      await expect(linkButton).toBeDisabled();
      await linkButton.click({ force: true });
      await expect(workflowLinkWorkflowDialog(page, 'course')).toHaveCount(0);
    }

    async function expectDisabledProgramLinkButton(page: Page): Promise<void> {
      const linkButton = workflowEditNodeFormLinkWorkflowButton(page, 'Link a course').or(
        workflowEditNodeFormLinkWorkflowButton(page, 'Remove linked course'),
      );
      await expect(linkButton).toBeVisible();
      await expect(linkButton).toBeDisabled();
      await linkButton.click({ force: true });
      await expect(workflowLinkWorkflowDialog(page, 'program')).toHaveCount(0);
    }

    async function ensureProgramNodeAsOwner(
      page: Page,
      workflow: Parameters<typeof ensureProgramNodeAndOpenEditForm>[1],
    ): Promise<void> {
      await loginAsTestUser(page);
      await ensureProgramNodeAndOpenEditForm(page, workflow);
    }

    test.describe('commenter role', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('FR-WF-EN-001/012: commenter sees read-only activity workflowEditNodeForm with no link button', async ({
        page,
        workflow,
      }) => {
        await loginAsRole(page, workflow, 'commenter');
        await page.goto(workflow.path);
        await openFirstNodeEditForm(page);

        await expectReadOnlyWorkflowEditNodeForm(page, 'activity');
        await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link an activity')).toHaveCount(0);
        await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link a course')).toHaveCount(0);
        await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link workflow')).toHaveCount(0);
      });

      test('FR-WF-EN-001/010/012: commenter sees read-only course form and disabled Link an activity', async ({
        page,
        workflow,
      }) => {
        const course = workflow.workflowByType('course');
        await loginAsRole(page, workflow, 'commenter');
        await page.goto(course.workflow_path);
        await openFirstNodeEditForm(page);

        await expectReadOnlyWorkflowEditNodeForm(page, 'course');
        await expectDisabledCourseLinkButton(page);
      });

      test('FR-WF-EN-001/010/012: commenter sees read-only program form and disabled Link a course', async ({
        page,
        workflow,
      }) => {
        const program = workflow.workflowByType('program');
        await ensureProgramNodeAsOwner(page, workflow);
        await loginAsRole(page, workflow, 'commenter');
        await page.goto(program.workflow_path);
        await openFirstNodeEditForm(page);

        await expectReadOnlyWorkflowEditNodeForm(page, 'program');
        await expectDisabledProgramLinkButton(page);
      });
    });

    test.describe('viewer role', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('FR-WF-EN-001/012: viewer sees read-only activity workflowEditNodeForm with no link button', async ({
        page,
        workflow,
      }) => {
        await loginAsRole(page, workflow, 'viewer');
        await page.goto(workflow.path);
        await openFirstNodeEditForm(page);

        await expectReadOnlyWorkflowEditNodeForm(page, 'activity');
        await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link an activity')).toHaveCount(0);
        await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link a course')).toHaveCount(0);
        await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link workflow')).toHaveCount(0);
      });

      test('FR-WF-EN-001/010/012: viewer sees read-only course form and disabled Link an activity', async ({
        page,
        workflow,
      }) => {
        const course = workflow.workflowByType('course');
        await loginAsRole(page, workflow, 'viewer');
        await page.goto(course.workflow_path);
        await openFirstNodeEditForm(page);

        await expectReadOnlyWorkflowEditNodeForm(page, 'course');
        await expectDisabledCourseLinkButton(page);
      });

      test('FR-WF-EN-001/010/012: viewer sees read-only program form and disabled Link a course', async ({
        page,
        workflow,
      }) => {
        const program = workflow.workflowByType('program');
        await ensureProgramNodeAsOwner(page, workflow);
        await loginAsRole(page, workflow, 'viewer');
        await page.goto(program.workflow_path);
        await openFirstNodeEditForm(page);

        await expectReadOnlyWorkflowEditNodeForm(page, 'program');
        await expectDisabledProgramLinkButton(page);
      });
    });
  });
});
