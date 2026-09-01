import { test, expect, type Page } from '../../fixtures';
import {
  gotoOutcomesView,
  hoverWorkflowOutcomeHeader,
  hoverWorkflowOutcomeHeaderLocator,
} from './comments-tab.helpers';
import { loginAsWorkflowContributor } from './role.helpers';
import { workflowOutcomeHeaderCount } from './add-tab.helpers';
import {
  ensureOutcomeTitleByOrdinalPrefix,
  revealOutcomeByOrdinalPath,
  workflowEditOutcomeForm,
  workflowEditOutcomeFormCodeField,
  workflowEditOutcomeFormDeleteButton,
  workflowEditOutcomeFormTitleField,
  workflowOutcomeHeader,
  workflowOutcomeHeaderTitleText,
  workflowOutcomeHeaderWithOrdinalPrefix,
  workflowOutcomeHeadersAtFrDepth,
  workflowOutcomeExpandToggle,
  workflowOutcomeHoverInsertChildForHeader,
  workflowOutcomeHoverInsertSiblingForHeader,
  workflowOutcomeHoverInsertSiblingItem,
  waitForOutcomeCreateResponse,
} from './workflow-outcome.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Outcome hover insert, header ordinals, and depth cap — FR-WF-EO-003, EO-007, EO-008.
 * (Drag reorder: outcome-drag-reorder-fr-015-017.spec.ts; duplicate/delete: outcome-duplicate-delete-fr-009-014.spec.ts.)
 * Requirements: workflow_edit_outcome_requirements_v1.yaml
 */

const E2E_CHILD_TITLE = 'E2E Outcome Child';
const E2E_GRANDCHILD_TITLE = 'E2E Outcome Grandchild';
const E2E_SEED_OUTCOME_TITLE = 'E2E Outcome 1';

async function createChildOutcome(
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
}

test.describe('Outcome — insert, ordinals, depth cap (FR-WF-EO-003/007/008)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, workflow.firstOutcome().title)).toBeVisible();
  });

  test('FR-WF-EO-003: Insert sibling adds untitled workflowOutcome after source', async ({
    page,
  }) => {
    const beforeCount = await workflowOutcomeHeaderCount(page);
    const siblingHeader = workflowOutcomeHeaderTitleText(page, '2', 'Untitled outcome');

    await hoverWorkflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE);
    await workflowOutcomeHoverInsertSiblingForHeader(
      page,
      workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE),
    ).click();

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
    await expect(siblingHeader).toBeVisible();

    await siblingHeader.click();
    await expect(workflowEditOutcomeForm(page)).toBeVisible();
    await workflowEditOutcomeFormTitleField(page).fill('E2E Temp Sibling');
    await workflowEditOutcomeFormTitleField(page).press('Tab');
    await expect(workflowOutcomeHeader(page, 'E2E Temp Sibling')).toBeVisible();

    await workflowEditOutcomeFormDeleteButton(page).click();
    await expect(workflowOutcomeHeader(page, 'E2E Temp Sibling')).toHaveCount(0, {
      timeout: 10_000,
    });
    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount);
    await expect(workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE)).toBeVisible();
  });

  test('FR-WF-EO-003: Insert child under level-1 outcome creates FR depth-2 node', async ({
    page,
  }) => {
    const beforeCount = await workflowOutcomeHeaderCount(page);

    await hoverWorkflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE);
    await Promise.all([
      waitForOutcomeCreateResponse(page),
      workflowOutcomeHoverInsertChildForHeader(
        page,
        workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE),
      ).click(),
    ]);

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
    await expect
      .poll(async () => workflowOutcomeExpandToggle(page, E2E_SEED_OUTCOME_TITLE).count(), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);
    await revealOutcomeByOrdinalPath(page, '1.1');
    await expect(workflowOutcomeHeaderWithOrdinalPrefix(page, '1.1')).toBeVisible();

    await ensureOutcomeTitleByOrdinalPrefix(page, '1.1', E2E_CHILD_TITLE);
    await expect(workflowOutcomeHeader(page, E2E_CHILD_TITLE)).toBeVisible();
  });

  test('FR-WF-EO-007: level-1 code appears between ordinal and title', async ({ page }) => {
    await workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE).click();
    await expect(workflowEditOutcomeForm(page)).toBeVisible();

    await workflowEditOutcomeFormCodeField(page).fill('E2ETST');
    await expect(page.getByText(/1 - E2ETST - E2E Outcome 1/)).toBeVisible({ timeout: 15_000 });

    await workflowEditOutcomeFormCodeField(page).fill('');
    await expect(workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-WF-EO-007: level-2 header uses dotted ordinal prefix', async ({ page }) => {
    await createChildOutcome(page, E2E_SEED_OUTCOME_TITLE, '1.1', E2E_CHILD_TITLE);
    await expect(page.getByText(/^1\.1\.\s+E2E Outcome Child$/)).toBeVisible();
  });

  test('FR-WF-EO-007: level-3 header uses dotted ordinal prefix', async ({ page }) => {
    await createChildOutcome(page, E2E_SEED_OUTCOME_TITLE, '1.1', E2E_CHILD_TITLE);
    await createChildOutcome(page, E2E_CHILD_TITLE, '1.1.1', E2E_GRANDCHILD_TITLE);
    await revealOutcomeByOrdinalPath(page, '1.1.1');
    await expect(page.getByText(/^1\.1\.1\.\s+E2E Outcome Grandchild$/)).toBeVisible();
  });

  test('FR-WF-EO-003: Insert child under level-2 outcome creates FR depth-3 node', async ({
    page,
  }) => {
    await createChildOutcome(page, E2E_SEED_OUTCOME_TITLE, '1.1', E2E_CHILD_TITLE);
    const beforeCount = await workflowOutcomeHeaderCount(page);
    await revealOutcomeByOrdinalPath(page, '1.1');
    const childHeader = workflowOutcomeHeader(page, E2E_CHILD_TITLE);

    await hoverWorkflowOutcomeHeader(page, E2E_CHILD_TITLE);
    await Promise.all([
      waitForOutcomeCreateResponse(page),
      workflowOutcomeHoverInsertChildForHeader(page, childHeader).click(),
    ]);

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
    await revealOutcomeByOrdinalPath(page, '1.1.1');
    await expect(workflowOutcomeHeaderWithOrdinalPrefix(page, '1.1.1')).toBeVisible();
  });

  test('FR-WF-EO-008: FR depth 3 does not gain depth-4 workflowOutcome from insert child', async ({
    page,
  }) => {
    await createChildOutcome(page, E2E_SEED_OUTCOME_TITLE, '1.1', E2E_CHILD_TITLE);
    await createChildOutcome(page, E2E_CHILD_TITLE, '1.1.1', E2E_GRANDCHILD_TITLE);
    const beforeCount = await workflowOutcomeHeaderCount(page);
    await revealOutcomeByOrdinalPath(page, '1.1.1');
    const depth3Header = workflowOutcomeHeaderWithOrdinalPrefix(page, '1.1.1');
    const insertChild = workflowOutcomeHoverInsertChildForHeader(page, depth3Header);

    await hoverWorkflowOutcomeHeaderLocator(page, depth3Header);
    await expect(insertChild).toHaveCount(0);

    expect(await workflowOutcomeHeadersAtFrDepth(page, 4).count()).toBe(0);
    expect(await workflowOutcomeHeaderCount(page)).toBe(beforeCount);
  });
});

test.describe('Outcome insert — role behavior (FR-WF-EO-003)', () => {
  test.describe('commenter', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-EO-003: commenter sees disabled insert sibling hover item', async ({
      page,
      workflow,
    }) => {
      await loginAsWorkflowContributor(page, workflow, 'commenter');
      await gotoOutcomesView(page, workflow.path);
      await expect(workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE)).toBeVisible();
      const beforeCount = await workflowOutcomeHeaderCount(page);

      await hoverWorkflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE);
      await expect(workflowOutcomeHoverInsertSiblingItem(page, E2E_SEED_OUTCOME_TITLE)).toBeDisabled();
      await workflowOutcomeHoverInsertSiblingItem(page, E2E_SEED_OUTCOME_TITLE).click({ force: true });

      expect(await workflowOutcomeHeaderCount(page)).toBe(beforeCount);
    });
  });

  test.describe('viewer', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-EO-003: viewer does not see workflowOutcomeHoverActionsMenu on hover', async ({
      page,
      workflow,
    }) => {
      await loginAsWorkflowContributor(page, workflow, 'viewer');
      await gotoOutcomesView(page, workflow.path);

      await workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE).hover();
      await expect(workflowOutcomeHoverInsertSiblingItem(page, E2E_SEED_OUTCOME_TITLE)).toHaveCount(0);
    });
  });
});
