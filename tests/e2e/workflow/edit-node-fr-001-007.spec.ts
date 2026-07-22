import { test, expect } from '../../fixtures';
import {
  firstWorkflowNodeUuid,
  secondWorkflowNodeUuid,
} from './comments-tab.helpers';
import {
  ACTIVITY_CONTEXT_OPTIONS,
  ACTIVITY_TASK_TYPE_OPTIONS,
  COURSE_CONTEXT_OPTIONS,
  ensureProgramNodeAndOpenEditForm,
  expectEditableWorkflowEditNodeFormRichTextDescription,
  expectSelectOptionsExactly,
  expectWorkflowEditNodeFormTimeField,
  linkNodeWorkflowViaApi,
  openFirstNodeEditForm,
} from './edit-node.helpers';
import {
  workflowEditNodeForm,
  workflowEditNodeFormContextField,
  workflowEditNodeFormCreditsField,
  workflowEditNodeFormDeleteButton,
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
  workflowNode,
  workflowNodeContent,
  workflowRichTextDescriptionEditor,
  workflowRichTextDescriptionEditorToolbar,
} from './workflow-graph.locators';
import {
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
} from '../../shared/locators/workflow';

/**
 * Edit node — FR-WF-EN-001 through FR-WF-EN-007 (Description rich text: FR-WF-EN-012).
 * Requirements: workflow_edit_node_requirements_v1.yaml
 */

test.describe('edit-node-fr-001-007', () => {
  // Course/program cases mutate shared seeded link state; keep workers ordered.
  test.describe.configure({ mode: 'serial' });

  test.describe('Open workflowEditNodeForm (FR-WF-EN-001)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
    });

    test('FR-WF-EN-001: click workflowNode expands sidebar on workflowRightSidebarEditTab', async ({
      page,
    }) => {
      const nodeUuid = await firstWorkflowNodeUuid(page);

      await expect(workflowRightSidebarContentPanel(page)).toBeHidden();

      await workflowNodeContent(page, nodeUuid).click();

      await expect(workflowRightSidebarContentPanel(page)).toBeVisible();
      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditNodeForm(page)).toBeVisible();
    });

    test('FR-WF-EN-001: click second workflowNode rebinds workflowEditNodeForm', async ({
      page,
    }) => {
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

    test('FR-WF-EN-002: activity workflowEditNodeForm renders core editable fields', async ({
      page,
    }) => {
      await expect(workflowEditNodeFormTitleField(page)).toBeVisible();
      await expect(
        workflowRightSidebarContentPanel(page).getByText('Description', { exact: true }),
      ).toBeVisible();
      await expectEditableWorkflowEditNodeFormRichTextDescription(page);
      await expect(workflowEditNodeFormContextField(page)).toBeVisible();
      await expect(workflowEditNodeFormTaskTypeField(page)).toBeVisible();
      await expectWorkflowEditNodeFormTimeField(page);
      await expect(workflowEditNodeFormTagsField(page)).toBeVisible();
    });

    test('FR-WF-EN-002: activity Context and Type of task offer exact FR option sets', async ({
      page,
    }) => {
      await expectSelectOptionsExactly(
        page,
        workflowEditNodeFormContextField(page),
        ACTIVITY_CONTEXT_OPTIONS,
      );
      await expectSelectOptionsExactly(
        page,
        workflowEditNodeFormTaskTypeField(page),
        ACTIVITY_TASK_TYPE_OPTIONS,
      );
    });

    test('FR-WF-EN-002: activity workflowEditNodeForm shows Duplicate and Delete and no link button', async ({
      page,
    }) => {
      await expect(workflowEditNodeFormDuplicateButton(page)).toBeVisible();
      await expect(workflowEditNodeFormDeleteButton(page)).toBeVisible();
      await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link an activity')).toHaveCount(0);
      await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link a course')).toHaveCount(0);
      await expect(workflowEditNodeFormLinkWorkflowButton(page, 'Link workflow')).toHaveCount(0);
    });

    test('FR-WF-EN-002: activity workflowEditNodeForm omits course/program-only controls', async ({
      page,
    }) => {
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
      const activityUuid =
        workflow.manifest.navigation_linked_workflows?.course.linked_child_workflow_uuid ??
        workflow.workflowByType('activity').workflow_uuid;

      await page.goto(course.workflow_path);
      const nodeUuid = await firstWorkflowNodeUuid(page);

      try {
        await linkNodeWorkflowViaApi(page, nodeUuid, null);
        await page.reload();
        await openFirstNodeEditForm(page);

        await expect(workflowEditNodeFormTitleField(page)).toBeVisible();
        await expect(
          workflowRightSidebarContentPanel(page).getByText('Description', { exact: true }),
        ).toBeVisible();
        await expectEditableWorkflowEditNodeFormRichTextDescription(page);
        await expect(workflowEditNodeFormContextField(page)).toBeVisible();
        await expectSelectOptionsExactly(
          page,
          workflowEditNodeFormContextField(page),
          COURSE_CONTEXT_OPTIONS,
        );
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
  });

  test.describe('Course linked field set (FR-WF-EN-004)', () => {
    test('FR-WF-EN-004: linked course node mirrors activity title/description/time and keeps context+tags editable', async ({
      page,
      workflow,
    }) => {
      const course = workflow.workflowByType('course');
      const linkedTitle =
        workflow.manifest.navigation_linked_workflows?.activity.workflow_title ??
        'E2E Activity Workflow';

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
      await expectSelectOptionsExactly(
        page,
        workflowEditNodeFormContextField(page),
        COURSE_CONTEXT_OPTIONS,
      );
      await expect(workflowEditNodeFormTagsField(page)).toBeVisible();
      await expect(workflowEditNodeFormTagsField(page)).toBeEnabled();
      await expect(workflowEditNodeFormTaskTypeField(page)).toHaveCount(0);

      await expect(
        workflowEditNodeFormLinkWorkflowButton(page, 'Remove linked activity'),
      ).toBeVisible();
      await expect(workflowEditNodeFormDuplicateButton(page)).toBeVisible();
      await expect(workflowEditNodeFormDeleteButton(page)).toBeVisible();
    });
  });

  test.describe('Program unlinked field set (FR-WF-EN-005)', () => {
    test('FR-WF-EN-005: program workflowEditNodeForm shows program fields and Link a course', async ({
      page,
      workflow,
    }) => {
      await ensureProgramNodeAndOpenEditForm(page, workflow);

      await expect(workflowEditNodeFormTitleField(page)).toBeVisible();
      await expect(
        workflowRightSidebarContentPanel(page).getByText('Description', { exact: true }),
      ).toBeVisible();
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
      const linkedTitle =
        workflow.manifest.navigation_linked_workflows?.course.workflow_title ??
        'E2E Course Workflow';

      const nodeUuid = await ensureProgramNodeAndOpenEditForm(page, workflow);
      await linkNodeWorkflowViaApi(page, nodeUuid, course.workflow_uuid);
      await page.reload();
      await expect(workflowNode(page, nodeUuid)).toBeVisible({ timeout: 15_000 });
      await workflowNodeContent(page, nodeUuid).click();
      await expect(workflowEditNodeForm(page)).toBeVisible();

      try {
        const titleField = workflowEditNodeFormTitleField(page);
        await expect(titleField).toBeVisible();
        await expect(titleField).toHaveValue(linkedTitle);
        await expect(titleField).toHaveAttribute('readonly', '');

        await expect(workflowRichTextDescriptionEditor(page)).toBeVisible();
        await expect(workflowRichTextDescriptionEditor(page)).toHaveAttribute(
          'contenteditable',
          'false',
        );
        await expect(workflowEditNodeFormTimeField(page)).toBeVisible();
        await expect(workflowEditNodeFormTimeField(page)).toHaveAttribute('readonly', '');
        await expect(workflowEditNodeFormCreditsField(page)).toBeVisible();
        await expect(workflowEditNodeFormCreditsField(page)).toHaveAttribute('readonly', '');
        await expect(workflowEditNodeFormPonderationTheoryField(page)).toHaveAttribute(
          'readonly',
          '',
        );
        await expect(workflowEditNodeFormPonderationPracticeField(page)).toHaveAttribute(
          'readonly',
          '',
        );
        await expect(workflowEditNodeFormPonderationIndividualField(page)).toHaveAttribute(
          'readonly',
          '',
        );

        await expect(workflowEditNodeFormTagsField(page)).toBeVisible();
        await expect(workflowEditNodeFormTagsField(page)).toBeEnabled();
        await expect(workflowEditNodeFormSpecificEducationSwitch(page)).toBeVisible();
        await expect(workflowEditNodeFormSpecificEducationSwitch(page)).toBeEnabled();

        await expect(
          workflowEditNodeFormLinkWorkflowButton(page, 'Remove linked course'),
        ).toBeVisible();
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
      await expect(workflowNode(page, nodeUuid)).toBeVisible({ timeout: 15_000 });
      await workflowNodeContent(page, nodeUuid).click();
      await expect(workflowEditNodeFormTitleField(page)).toHaveValue(uniqueTitle);
    });

    test('FR-WF-EN-007: workflowEditNodeForm does not show auto-save status indicator', async ({
      page,
    }) => {
      const nodeUuid = await firstWorkflowNodeUuid(page);

      await workflowNodeContent(page, nodeUuid).click();
      await workflowEditNodeFormTitleField(page).fill(`E2E autosave ${Date.now()}`);

      await expect(page.getByText(/^Saving/i)).toHaveCount(0);
      await expect(page.getByText(/^Saved/i)).toHaveCount(0);
    });
  });
});
