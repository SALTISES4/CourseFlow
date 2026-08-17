import { test, expect } from '../../fixtures';
import {
  gotoOutcomesView,
  hoverWorkflowOutcomeHeader,
} from './comments-tab.helpers';
import { loginAsWorkflowContributor } from './role.helpers';
import { workflowOutcomeHeaderCount } from './add-tab.helpers';
import { ensureExpandedShowingChild, fetchGraphOutcomes } from './outcome-drag.helpers';
import {
  createSidebarDuplicate,
  E2E_OUTCOME_CHILD_A_TITLE,
  E2E_OUTCOME_CHILD_B_TITLE,
  E2E_OUTCOME_CHILD_DUPLICATE_TITLE,
  E2E_OUTCOME_CHILD_TITLE,
  E2E_OUTCOME_DUPLICATE,
  E2E_OUTCOME_GRANDCHILD_DUPLICATE_TITLE,
  E2E_OUTCOME_GRANDCHILD_TITLE,
  E2E_OUTCOME_TITLE,
  seedThreeLevelSubtreeViaApi,
  seedTwoChildOutcomesViaApi,
} from './outcome-duplicate-delete.helpers';
import {
  workflowEditOutcomeForm,
  workflowEditOutcomeFormDeleteButton,
  workflowEditOutcomeFormDuplicateButton,
  workflowEditOutcomeFormTitleField,
  workflowOutcomeExpandToggle,
  workflowOutcomeHeader,
  workflowOutcomeHeaderTitleText,
  workflowOutcomeHoverDeleteItem,
  workflowOutcomeHoverDuplicateItem,
  workflowOutcomeViewEmptyStateAlert,
  revealOutcomeByOrdinalPath,
  workflowOutcomeExpandToggleByOrdinal,
} from './workflow-outcome.locators';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Outcome duplicate and delete — FR-WF-EO-009 through FR-WF-EO-014.
 * Requirements: workflow_duplicate_outcome_requirements_v1.yaml, workflow_delete_outcome_requirements_v1.yaml
 *
 * Node assignment side effects on delete/duplicate: workflow-assign-outcome-fr-001-010.spec.ts
 * (FR-WF-EO-011 assignments, FR-WF-EO-014 / FR-WF-AO-006 cleanup).
 */

test.describe('Outcome — duplicate and delete (FR-WF-EO-009-014)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, workflow.firstOutcome().title)).toBeVisible();
  });

  test('FR-WF-EO-009: workflowEditOutcomeFormDuplicateButton creates sibling copy', async ({
    page,
    workflow,
  }) => {
    const beforeCount = await workflowOutcomeHeaderCount(page);

    await createSidebarDuplicate(page);

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
    await expect(workflowEditOutcomeFormTitleField(page)).toHaveValue(workflow.firstOutcome().title);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_DUPLICATE)).toBeVisible();
  });

  test('FR-WF-EO-011: duplicate root title appends duplicate suffix', async ({ page }) => {
    await createSidebarDuplicate(page);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_DUPLICATE)).toBeVisible();
  });

  test('FR-WF-EO-010: hover Duplicate on duplicate adds another workflowOutcome sibling', async ({
    page,
  }) => {
    await createSidebarDuplicate(page);
    const beforeCount = await workflowOutcomeHeaderCount(page);

    await hoverWorkflowOutcomeHeader(page, E2E_OUTCOME_DUPLICATE);
    await workflowOutcomeHoverDuplicateItem(page, E2E_OUTCOME_DUPLICATE).click();

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
  });

  test('FR-WF-EO-013: hover Delete removes last disposable duplicate workflowOutcome immediately', async ({
    page,
  }) => {
    await createSidebarDuplicate(page);
    const beforeCount = await workflowOutcomeHeaderCount(page);
    const duplicateHeaders = page.getByText(
      new RegExp(`^\\d+\\.\\s*${E2E_OUTCOME_DUPLICATE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
    );
    const lastDuplicateTitle = await duplicateHeaders.last().textContent();
    const lastTitle = lastDuplicateTitle?.replace(/^\d+\.\s*/, '') ?? E2E_OUTCOME_DUPLICATE;

    await hoverWorkflowOutcomeHeader(page, lastTitle);
    await workflowOutcomeHoverDeleteItem(page, lastTitle).click();

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount - 1);
  });

  test('FR-WF-EO-012: workflowEditOutcomeFormDeleteButton removes remaining disposable duplicate', async ({
    page,
  }) => {
    await createSidebarDuplicate(page);
    const duplicatePattern = new RegExp(
      `${E2E_OUTCOME_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(duplicate\\)`,
    );
    const duplicateHeader = page.getByText(duplicatePattern);
    await expect(duplicateHeader.first()).toBeVisible();

    const beforeCount = await workflowOutcomeHeaderCount(page);
    const duplicateTitle =
      (await duplicateHeader.first().textContent())?.replace(/^\d+\.\s*/, '') ??
      E2E_OUTCOME_DUPLICATE;

    await duplicateHeader.first().click();
    await expect(workflowEditOutcomeForm(page)).toBeVisible();
    await workflowEditOutcomeFormDeleteButton(page).click();

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount - 1);
    await expect(workflowOutcomeHeader(page, duplicateTitle)).toHaveCount(0);
    await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
  });

  test.describe('Duplicate subtree (FR-WF-EO-011)', () => {
    test('FR-WF-EO-011: duplicate clones subtree under sibling with matching descendant clone titles', async ({
      page,
      workflow,
    }) => {
      await seedThreeLevelSubtreeViaApi(page, workflow);
      await ensureExpandedShowingChild(page, E2E_OUTCOME_TITLE, E2E_OUTCOME_CHILD_TITLE);
      await ensureExpandedShowingChild(page, E2E_OUTCOME_CHILD_TITLE, E2E_OUTCOME_GRANDCHILD_TITLE);
      const beforeCount = (await fetchGraphOutcomes(page, workflow.workflowUuid)).length;

      await createSidebarDuplicate(page);

      await expect
        .poll(async () => (await fetchGraphOutcomes(page, workflow.workflowUuid)).length, {
          timeout: 10_000,
        })
        .toBe(beforeCount + 3);
      await expect(workflowOutcomeHeaderTitleText(page, '1.1', E2E_OUTCOME_CHILD_TITLE)).toBeVisible();
      await expect(
        workflowOutcomeHeaderTitleText(page, '1.1.1', E2E_OUTCOME_GRANDCHILD_TITLE),
      ).toBeVisible();
      await expect(
        workflowOutcomeHeaderTitleText(page, '2.1', E2E_OUTCOME_CHILD_DUPLICATE_TITLE),
      ).toHaveCount(0);
      await expect(
        workflowOutcomeHeaderTitleText(page, '2.1.1', E2E_OUTCOME_GRANDCHILD_DUPLICATE_TITLE),
      ).toHaveCount(0);

      await ensureExpandedShowingChild(page, E2E_OUTCOME_DUPLICATE, E2E_OUTCOME_CHILD_DUPLICATE_TITLE);
      await workflowOutcomeExpandToggleByOrdinal(page, '2.1').click();
      await revealOutcomeByOrdinalPath(page, '2.1.1');
      await expect(
        workflowOutcomeHeaderTitleText(page, '2.1', E2E_OUTCOME_CHILD_DUPLICATE_TITLE),
      ).toBeVisible();
      await expect(
        workflowOutcomeHeaderTitleText(page, '2.1.1', E2E_OUTCOME_GRANDCHILD_DUPLICATE_TITLE),
      ).toBeVisible();
    });

    test('FR-WF-EO-011: duplicate root renders collapsed until workflowOutcomeHeaderToggle expands it', async ({
      page,
      workflow,
    }) => {
      await seedThreeLevelSubtreeViaApi(page, workflow);
      await ensureExpandedShowingChild(page, E2E_OUTCOME_TITLE, E2E_OUTCOME_CHILD_TITLE);

      await createSidebarDuplicate(page);

      await expect(workflowOutcomeExpandToggle(page, E2E_OUTCOME_DUPLICATE)).toBeVisible();
      await expect(workflowOutcomeHeaderTitleText(page, '2.1', E2E_OUTCOME_CHILD_DUPLICATE_TITLE)).toHaveCount(0);

      await workflowOutcomeExpandToggle(page, E2E_OUTCOME_DUPLICATE).click();
      await expect(workflowOutcomeHeaderTitleText(page, '2.1', E2E_OUTCOME_CHILD_DUPLICATE_TITLE)).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe('Delete tree effects (FR-WF-EO-014)', () => {
    test('FR-WF-EO-014: deleting level-1 workflowOutcome with children removes entire subtree', async ({
      page,
      workflow,
    }) => {
      await seedTwoChildOutcomesViaApi(page, workflow);
      await ensureExpandedShowingChild(page, E2E_OUTCOME_TITLE, E2E_OUTCOME_CHILD_A_TITLE);

      await hoverWorkflowOutcomeHeader(page, E2E_OUTCOME_TITLE);
      await workflowOutcomeHoverDeleteItem(page, E2E_OUTCOME_TITLE).click();

      await expect(workflowOutcomeViewEmptyStateAlert(page)).toBeVisible({ timeout: 15_000 });
      await expect
        .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
        .toBe(0);
      await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
    });

    test('FR-WF-EO-014: deleting level-3 workflowOutcome leaves parent and grandparent', async ({
      page,
      workflow,
    }) => {
      await seedThreeLevelSubtreeViaApi(page, workflow);
      const beforeCount = (await fetchGraphOutcomes(page, workflow.workflowUuid)).length;
      await revealOutcomeByOrdinalPath(page, '1.1.1');

      await hoverWorkflowOutcomeHeader(page, E2E_OUTCOME_GRANDCHILD_TITLE);
      await workflowOutcomeHoverDeleteItem(page, E2E_OUTCOME_GRANDCHILD_TITLE).click();

      await expect
        .poll(async () => (await fetchGraphOutcomes(page, workflow.workflowUuid)).length, {
          timeout: 10_000,
        })
        .toBe(beforeCount - 1);
      await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toBeVisible();
      await expect(workflowOutcomeHeaderTitleText(page, '1.1', E2E_OUTCOME_CHILD_TITLE)).toBeVisible();
      await expect(
        workflowOutcomeHeaderTitleText(page, '1.1.1', E2E_OUTCOME_GRANDCHILD_TITLE),
      ).toHaveCount(0);
    });

    test('FR-WF-EO-014/007: deleting level-2 sibling renumbers remaining child ordinals', async ({
      page,
      workflow,
    }) => {
      await seedTwoChildOutcomesViaApi(page, workflow);
      await ensureExpandedShowingChild(page, E2E_OUTCOME_TITLE, E2E_OUTCOME_CHILD_A_TITLE);
      await ensureExpandedShowingChild(page, E2E_OUTCOME_TITLE, E2E_OUTCOME_CHILD_B_TITLE);
      await expect(workflowOutcomeHeaderTitleText(page, '1.1', E2E_OUTCOME_CHILD_A_TITLE)).toBeVisible();
      await expect(workflowOutcomeHeaderTitleText(page, '1.2', E2E_OUTCOME_CHILD_B_TITLE)).toBeVisible();

      await hoverWorkflowOutcomeHeader(page, E2E_OUTCOME_CHILD_A_TITLE);
      await workflowOutcomeHoverDeleteItem(page, E2E_OUTCOME_CHILD_A_TITLE).click();

      await expect(
        workflowOutcomeHeaderTitleText(page, '1.1', E2E_OUTCOME_CHILD_B_TITLE),
      ).toBeVisible({ timeout: 15_000 });
      await expect(workflowOutcomeHeaderTitleText(page, '1.2', E2E_OUTCOME_CHILD_B_TITLE)).toHaveCount(
        0,
      );
      await expect(workflowOutcomeHeaderTitleText(page, '1.1', E2E_OUTCOME_CHILD_A_TITLE)).toHaveCount(
        0,
      );
    });
  });

  test.describe('Commenter duplicate/delete (FR-WF-EO-009/010/013)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-EO-010/013: commenter sees disabled duplicate and delete hover items', async ({
      page,
      workflow,
    }) => {
      await loginAsWorkflowContributor(page, workflow, 'commenter');
      await gotoOutcomesView(page, workflow.path);

      await hoverWorkflowOutcomeHeader(page, E2E_OUTCOME_TITLE);
      await expect(workflowOutcomeHoverDuplicateItem(page, E2E_OUTCOME_TITLE)).toBeDisabled();
      await expect(workflowOutcomeHoverDeleteItem(page, E2E_OUTCOME_TITLE)).toBeDisabled();
    });
  });

  test.describe('Viewer duplicate/delete (FR-WF-EO-009/010/013)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-EO-010/013: viewer does not see workflowOutcomeHoverActionsMenu on hover', async ({
      page,
      workflow,
    }) => {
      await loginAsWorkflowContributor(page, workflow, 'viewer');
      await gotoOutcomesView(page, workflow.path);

      await hoverWorkflowOutcomeHeader(page, E2E_OUTCOME_TITLE);
      await expect(workflowOutcomeHoverDuplicateItem(page, E2E_OUTCOME_TITLE)).toHaveCount(0);
      await expect(workflowOutcomeHoverDeleteItem(page, E2E_OUTCOME_TITLE)).toHaveCount(0);
    });
  });
});
