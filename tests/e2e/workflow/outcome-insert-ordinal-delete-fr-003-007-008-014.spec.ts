import { test, expect, type Page } from '../../fixtures';
import {
  gotoOutcomesView,
  hoverWorkflowOutcomeHeader,
} from './comments-tab.helpers';
import { workflowOutcomeHeaderCount } from './add-tab.helpers';
import { E2E_SEED_OUTCOME_TITLE, ensureSeedOutcomeTitle, skipUnlessPristineOutcome } from '../../helpers/workflow-pristine';
import {
  ensureOutcomeTitleByOrdinalPrefix,
  expandWorkflowOutcomeByOrdinalPrefix,
  revealOutcomeByOrdinalPath,
  workflowEditOutcomeForm,
  workflowEditOutcomeFormCodeField,
  workflowEditOutcomeFormDeleteButton,
  workflowEditOutcomeFormTitleField,
  workflowOutcomeHeader,
  workflowOutcomeHeaderOrdinalOnly,
  workflowOutcomeHeaderWithOrdinalPrefix,
  workflowOutcomeHeadersAtFrDepth,
  workflowOutcomeExpandToggle,
  workflowOutcomeHoverDeleteItem,
  workflowOutcomeHoverInsertChildForHeader,
  workflowOutcomeHoverInsertSiblingForHeader,
  waitForOutcomeCreateResponse,
} from './workflow-outcome.locators';

/**
 * Outcome insert, ordinals, depth cap, and subtree delete — FR-WF-EO-003, EO-007, EO-008, EO-014.
 * Requirements: workflow_edit_outcome_requirements_v1.yaml, workflow_delete_outcome_requirements_v1.yaml
 *
 * Serial spec: run before outcome-duplicate-delete-fr-009-014 in full batches.
 *
 * Product gaps:
 * - FR-WF-EO-008: Insert child is still rendered at FR depth 3 (not hidden per FR).
 */

const E2E_CHILD_TITLE = 'E2E Outcome Child';

async function ensureInsertSpecTreeState(page: Page) {
  await ensureSeedOutcomeTitle(page, E2E_SEED_OUTCOME_TITLE);

  const rootToggle = workflowOutcomeExpandToggle(page, E2E_SEED_OUTCOME_TITLE);
  if ((await rootToggle.count()) > 0) {
    await expandWorkflowOutcomeByOrdinalPrefix(page, '1', '1.1');
  }

  if ((await workflowOutcomeHeaderWithOrdinalPrefix(page, '1.1').count()) === 0) {
    return;
  }

  await revealOutcomeByOrdinalPath(page, '1.1');
  await ensureOutcomeTitleByOrdinalPrefix(page, '1.1', E2E_CHILD_TITLE);

  if ((await workflowOutcomeHeaderWithOrdinalPrefix(page, '1.1.1').count()) > 0) {
    await revealOutcomeByOrdinalPath(page, '1.1.1');
  }
}

test.describe('Outcome — insert, ordinals, depth, subtree delete (FR-WF-EO-003/007/008/014)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
    await ensureSeedOutcomeTitle(page, E2E_SEED_OUTCOME_TITLE);
    await ensureInsertSpecTreeState(page);
  });

  test('FR-WF-EO-003: Insert sibling adds untitled workflowOutcome after source', async ({
    page,
    workflow,
  }) => {
    await skipUnlessPristineOutcome(page, workflow, E2E_SEED_OUTCOME_TITLE);

    const beforeCount = await workflowOutcomeHeaderCount(page);
    const siblingHeader = workflowOutcomeHeaderOrdinalOnly(page, '2');

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

  test('FR-WF-EO-003: Insert child appends last child under hovered workflowOutcome', async ({
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
      .toBe(2);
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

  test('FR-WF-EO-007: root workflowOutcomeHeaderTitle uses ordinal prefix and title', async ({
    page,
  }) => {
    await expect(workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE)).toBeVisible();
    await expect(page.getByText(/^1\.\s+E2E Outcome 1$/)).toBeVisible();
  });

  test('FR-WF-EO-007: level-1 code appears between ordinal and title', async ({ page }) => {
    await workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE).click();
    await expect(workflowEditOutcomeForm(page)).toBeVisible();

    await workflowEditOutcomeFormCodeField(page).fill('E2ETST');
    await page.waitForTimeout(500);
    await expect(page.getByText(/1 - E2ETST - E2E Outcome 1/)).toBeVisible();

    await workflowEditOutcomeFormCodeField(page).fill('');
    await page.waitForTimeout(500);
    await expect(workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE)).toBeVisible();
  });

  test('FR-WF-EO-007: level-2 header uses dotted ordinal prefix', async ({ page }) => {
    await ensureOutcomeTitleByOrdinalPrefix(page, '1.1', E2E_CHILD_TITLE);
    await expect(page.getByText(/^1\.1\.\s+E2E Outcome Child$/)).toBeVisible();
  });

  test('FR-WF-EO-003: Insert child under level-2 outcome creates FR depth-3 node', async ({
    page,
  }) => {
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
    const beforeCount = await workflowOutcomeHeaderCount(page);
    await revealOutcomeByOrdinalPath(page, '1.1.1');
    const depth3Header = workflowOutcomeHeaderWithOrdinalPrefix(page, '1.1.1');
    const insertChild = workflowOutcomeHoverInsertChildForHeader(page, depth3Header);

    await hoverWorkflowOutcomeHeaderLocator(page, depth3Header);
    if (await insertChild.isVisible()) {
      await insertChild.click();
      await page.waitForTimeout(500);
    }

    expect(await workflowOutcomeHeadersAtFrDepth(page, 4).count()).toBe(0);
    expect(await workflowOutcomeHeaderCount(page)).toBe(beforeCount);
  });

  test('FR-WF-EO-014: deleting level-2 workflowOutcome removes its subtree', async ({ page }) => {
    const beforeCount = await workflowOutcomeHeaderCount(page);

    await revealOutcomeByOrdinalPath(page, '1.1');
    await hoverWorkflowOutcomeHeader(page, E2E_CHILD_TITLE);
    await workflowOutcomeHoverDeleteItem(page, E2E_CHILD_TITLE).click();

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount - 2);
    await expect(workflowOutcomeHeaderWithOrdinalPrefix(page, '1.1')).toHaveCount(0);
    await expect(workflowOutcomeHeaderWithOrdinalPrefix(page, '1.1.1')).toHaveCount(0);
    await expect(workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE)).toBeVisible();
  });
});
