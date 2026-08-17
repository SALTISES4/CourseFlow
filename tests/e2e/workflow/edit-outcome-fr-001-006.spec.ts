import { test, expect } from '../../fixtures';
import { loginAsTestUser } from '../../helpers/auth';
import { workflowOutcomeHeaderCount } from './add-tab.helpers';
import { gotoOutcomesView, hoverWorkflowOutcomeHeader } from './comments-tab.helpers';
import { deleteOutcomeViaApi } from './outcome-drag.helpers';
import {
  clearOutcomeTitleField,
  createChildOutcomeUnderParent,
  expectEditableWorkflowEditOutcomeFormRichTextDescription,
  expectEditOutcomeTagsIncludeOption,
  expectOutcomeHeaderTagChipVisible,
  openEditOutcomeFormForTitle,
  selectEditOutcomeTag,
} from './edit-outcome.helpers';
import {
  expectReadOnlyWorkflowEditOutcomeForm,
  loginAsWorkflowContributor,
  type WorkflowContributorRole,
} from './role.helpers';
import {
  workflowEditOutcomeForm,
  workflowEditOutcomeFormCodeField,
  workflowEditOutcomeFormDeleteButton,
  workflowEditOutcomeFormDescriptionField,
  workflowEditOutcomeFormDuplicateButton,
  workflowEditOutcomeFormTagsField,
  workflowEditOutcomeFormTitleField,
  workflowOutcomeHeader,
  workflowOutcomeHeaderTitleText,
  workflowOutcomeHoverDeleteItem,
  workflowOutcomeViewAddOutcomeButton,
  workflowOutcomeViewEmptyStateAlert,
} from './workflow-outcome.locators';
import {
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
} from '../../shared/locators/workflow';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Edit outcome — FR-WF-EO-001 through FR-WF-EO-006.
 * Requirements: tests/docs/requirements/features/workflow/workflow_edit_outcome_requirements_v1.yaml
 */

const E2E_OUTCOME_TITLE = 'E2E Outcome 1';
const E2E_CHILD_OUTCOME_TITLE = 'E2E Outcome Child';
const E2E_GRANDCHILD_OUTCOME_TITLE = 'E2E Outcome Grandchild';

async function removeSeededOutcome(page: import('@playwright/test').Page, title: string): Promise<void> {
  const seededHeader = workflowOutcomeHeader(page, title);
  await expect(seededHeader).toBeVisible();
  await hoverWorkflowOutcomeHeader(page, title);
  await workflowOutcomeHoverDeleteItem(page, title).click();
  await expect(seededHeader).toHaveCount(0);
}

/** Owner clears outcomes via API, then contributor lands on empty Outcomes view. */
async function gotoEmptyOutcomesViewAsContributor(
  page: import('@playwright/test').Page,
  workflow: { path: string; firstOutcome: () => { uuid: string } },
  role: WorkflowContributorRole,
): Promise<void> {
  await loginAsTestUser(page);
  await deleteOutcomeViaApi(page, workflow.firstOutcome().uuid);
  await loginAsWorkflowContributor(page, workflow, role);
  await gotoOutcomesView(page, workflow.path);
}

test.describe('edit-outcome-fr-001-006', () => {
  test.describe('Empty state and first create (FR-WF-EO-001, FR-WF-EO-002)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await gotoOutcomesView(page, workflow.path);
    });

    test('FR-WF-EO-001: empty state alert and Add outcome button after removing seeded outcome', async ({
      page,
      workflow,
    }) => {
      await removeSeededOutcome(page, workflow.firstOutcome().title);

      await expect(workflowOutcomeViewEmptyStateAlert(page)).toBeVisible();
      await expect(
        page.getByText(/In this view you can add and edit outcomes for this workflow\./),
      ).toBeVisible();
      await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeVisible();
      await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeEnabled();
      await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
      expect(await workflowOutcomeHeaderCount(page)).toBe(0);
    });

    test('FR-WF-EO-002: Add outcome creates root-level untitled workflowOutcome', async ({
      page,
      workflow,
    }) => {
      test.fail(
        true,
        'New outcome header shows "1." without Untitled outcome display fallback per FR-WF-EO-006',
      );

      await removeSeededOutcome(page, workflow.firstOutcome().title);
      await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeVisible();

      await workflowOutcomeViewAddOutcomeButton(page).click();

      await expect(workflowOutcomeViewEmptyStateAlert(page)).toHaveCount(0);
      await expect(workflowOutcomeHeaderTitleText(page, '1', 'Untitled outcome')).toBeVisible();
      expect(await workflowOutcomeHeaderCount(page)).toBe(1);
      await expect(workflowEditOutcomeForm(page)).toHaveCount(0);
      await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
    });
  });

  test.describe('Role behavior — Add outcome button (FR-WF-EO-001)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-EO-001: commenter sees disabled Add outcome button', async ({ page, workflow }) => {
      test.fail(
        true,
        'Empty-state Add outcome button is hidden for commenter/viewer instead of rendered disabled per FR-WF-EO-001',
      );

      await gotoEmptyOutcomesViewAsContributor(page, workflow, 'commenter');

      await expect(workflowOutcomeViewEmptyStateAlert(page)).toBeVisible();
      await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeDisabled();
      await workflowOutcomeViewAddOutcomeButton(page).click({ force: true });
      expect(await workflowOutcomeHeaderCount(page)).toBe(0);
    });

    test('FR-WF-EO-001: viewer sees disabled Add outcome button', async ({ page, workflow }) => {
      test.fail(
        true,
        'Empty-state Add outcome button is hidden for commenter/viewer instead of rendered disabled per FR-WF-EO-001',
      );

      await gotoEmptyOutcomesViewAsContributor(page, workflow, 'viewer');

      await expect(workflowOutcomeViewEmptyStateAlert(page)).toBeVisible();
      await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeDisabled();
      await workflowOutcomeViewAddOutcomeButton(page).click({ force: true });
      expect(await workflowOutcomeHeaderCount(page)).toBe(0);
    });
  });

  test.describe('Open workflowEditOutcomeForm (FR-WF-EO-004)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      expect(workflow.outcomes.length).toBeGreaterThan(0);
      await gotoOutcomesView(page, workflow.path);
      await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toBeVisible({
        timeout: 15_000,
      });
    });

    test('FR-WF-EO-004: click workflowOutcomeHeader expands sidebar on workflowRightSidebarEditTab', async ({
      page,
    }) => {
      await expect(workflowRightSidebarContentPanel(page)).toBeHidden();

      await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();

      await expect(workflowRightSidebarContentPanel(page)).toBeVisible();
      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(workflowEditOutcomeForm(page)).toBeVisible();
      await expect(workflowEditOutcomeFormTitleField(page)).toBeVisible();
    });
  });

  test.describe('Fields and auto-save (FR-WF-EO-005, FR-WF-EO-006)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      expect(workflow.outcomes.length).toBeGreaterThan(0);
      await gotoOutcomesView(page, workflow.path);
      await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();
      await expect(workflowEditOutcomeForm(page)).toBeVisible();
    });

    test('FR-WF-EO-005: root workflowEditOutcomeForm renders level-1 fields and actions', async ({
      page,
    }) => {
      await expect(workflowEditOutcomeFormTitleField(page)).toBeVisible();
      await expect(workflowEditOutcomeFormDescriptionField(page)).toBeVisible();
      await expect(workflowEditOutcomeFormCodeField(page)).toBeVisible();
      await expect(workflowEditOutcomeFormTagsField(page)).toBeVisible();
      await expect(workflowEditOutcomeFormDuplicateButton(page)).toBeVisible();
      await expect(workflowEditOutcomeFormDeleteButton(page)).toBeVisible();
    });

    test('FR-WF-EO-005: description field hosts workflowRichTextDescriptionEditor per FR-WF-EN-012', async ({
      page,
    }) => {
      test.fail(
        true,
        'workflowEditOutcomeFormDescriptionField uses plain multiline TextField instead of workflowRichTextDescriptionEditor',
      );

      await expectEditableWorkflowEditOutcomeFormRichTextDescription(page);
    });

    test('FR-WF-EO-005: workflowEditOutcomeFormTitleField is optional (not required)', async ({
      page,
    }) => {
      test.fail(true, 'workflowEditOutcomeFormTitleField is marked required in product vs FR-WF-EO-005');

      await expect(workflowEditOutcomeFormTitleField(page)).not.toHaveAttribute('required');
      await expect(page.getByLabel('Title *')).toHaveCount(0);
    });

    test('FR-WF-EO-006: clearing title shows Untitled outcome header fallback', async ({ page }) => {
      test.fail(
        true,
        'Empty workflowEditOutcomeFormTitleField does not show Untitled outcome header fallback per FR-WF-EO-006',
      );

      await clearOutcomeTitleField(page);
      await expect(workflowOutcomeHeaderTitleText(page, '1', 'Untitled outcome')).toBeVisible({
        timeout: 15_000,
      });

      await workflowEditOutcomeFormTitleField(page).fill(E2E_OUTCOME_TITLE);
      await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toBeVisible({ timeout: 15_000 });
    });

    test('FR-WF-EO-006: workflowEditOutcomeFormTagsAutocomplete accepts tag selection', async ({
      page,
    }) => {
      const tagLabel = 'Tag 1';

      await expectEditOutcomeTagsIncludeOption(page, tagLabel);
      await selectEditOutcomeTag(page, tagLabel);
    });

    test('FR-WF-EO-006: tag selection updates workflowOutcomeHeaderTagChips', async ({ page }) => {
      test.fail(
        true,
        'workflowEditOutcomeFormTagsAutocomplete selection does not propagate to workflowOutcomeHeaderTagChips',
      );

      const tagLabel = 'Tag 1';
      await selectEditOutcomeTag(page, tagLabel);
      await expectOutcomeHeaderTagChipVisible(page, E2E_OUTCOME_TITLE, tagLabel);
    });

    test('FR-WF-EO-006: title change updates workflowOutcomeHeaderTitle', async ({ page }) => {
      const uniqueTitle = `E2E Out ${Date.now()}`;

      await workflowEditOutcomeFormTitleField(page).fill(uniqueTitle);
      await expect(workflowOutcomeHeader(page, uniqueTitle)).toBeVisible({ timeout: 15_000 });

      await workflowEditOutcomeFormTitleField(page).fill(E2E_OUTCOME_TITLE);
      await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('Level-specific field sets (FR-WF-EO-005)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      expect(workflow.outcomes.length).toBeGreaterThan(0);
      await gotoOutcomesView(page, workflow.path);
      await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toBeVisible({
        timeout: 15_000,
      });
    });

    test('FR-WF-EO-005: level-2 workflowEditOutcomeForm omits code and tags fields', async ({
      page,
    }) => {
      await createChildOutcomeUnderParent(page, E2E_OUTCOME_TITLE, '1.1', E2E_CHILD_OUTCOME_TITLE);
      await openEditOutcomeFormForTitle(page, E2E_CHILD_OUTCOME_TITLE);

      await expect(workflowEditOutcomeFormTitleField(page)).toBeVisible();
      await expect(workflowEditOutcomeFormDescriptionField(page)).toBeVisible();
      await expect(workflowEditOutcomeFormCodeField(page)).toHaveCount(0);
      await expect(workflowEditOutcomeFormTagsField(page)).toHaveCount(0);
      await expect(workflowEditOutcomeFormDuplicateButton(page)).toBeVisible();
      await expect(workflowEditOutcomeFormDeleteButton(page)).toBeVisible();
    });

    test('FR-WF-EO-005: level-3 workflowEditOutcomeForm omits code and tags fields', async ({
      page,
    }) => {
      await createChildOutcomeUnderParent(page, E2E_OUTCOME_TITLE, '1.1', E2E_CHILD_OUTCOME_TITLE);
      await createChildOutcomeUnderParent(
        page,
        E2E_CHILD_OUTCOME_TITLE,
        '1.1.1',
        E2E_GRANDCHILD_OUTCOME_TITLE,
      );
      await openEditOutcomeFormForTitle(page, E2E_GRANDCHILD_OUTCOME_TITLE);

      await expect(workflowEditOutcomeFormTitleField(page)).toBeVisible();
      await expect(workflowEditOutcomeFormDescriptionField(page)).toBeVisible();
      await expect(workflowEditOutcomeFormCodeField(page)).toHaveCount(0);
      await expect(workflowEditOutcomeFormTagsField(page)).toHaveCount(0);
    });
  });

  test.describe('Role behavior — read-only workflowEditOutcomeForm (FR-WF-EO-004, FR-WF-EO-005, FR-WF-EO-006)', () => {
    test.describe('commenter', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('FR-WF-EO-004/005/006: commenter opens read-only workflowEditOutcomeForm', async ({
        page,
        workflow,
      }) => {
        test.fail(
          true,
          'Commenter/viewer cannot open workflowEditOutcomeForm — outcome header click is gated by OUTCOME_MANAGEMENT',
        );

        await loginAsWorkflowContributor(page, workflow, 'commenter');
        await gotoOutcomesView(page, workflow.path);
        await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();

        await expectReadOnlyWorkflowEditOutcomeForm(page);
      });
    });

    test.describe('viewer', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('FR-WF-EO-004/005/006: viewer opens read-only workflowEditOutcomeForm', async ({
        page,
        workflow,
      }) => {
        test.fail(
          true,
          'Commenter/viewer cannot open workflowEditOutcomeForm — outcome header click is gated by OUTCOME_MANAGEMENT',
        );

        await loginAsWorkflowContributor(page, workflow, 'viewer');
        await gotoOutcomesView(page, workflow.path);
        await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();

        await expectReadOnlyWorkflowEditOutcomeForm(page);
      });
    });
  });
});
