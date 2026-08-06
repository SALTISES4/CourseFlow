import { test, expect, type Page } from '../../fixtures';
import { workflowOutcomeHeaderCount } from './add-tab.helpers';
import {
  gotoOutcomesView,
  hoverWorkflowOutcomeHeader,
  hoverWorkflowOutcomeHeaderLocator,
} from './comments-tab.helpers';
import {
  E2E_SEED_OUTCOME_TITLE,
  ensureSeedOutcomeTitle,
  skipUnlessPristineOutcome,
} from '../../helpers/workflow-pristine';
import { workflowRightSidebarContentPanel } from '../../shared/locators/workflow';
import {
  ensureOutcomeTitleByOrdinalPrefix,
  expandWorkflowOutcomeByOrdinalPrefix,
  expandWorkflowOutcomeChildren,
  revealOutcomeByOrdinalPath,
  waitForOutcomeCreateResponse,
  workflowEditOutcomeForm,
  workflowEditOutcomeFormCodeField,
  workflowEditOutcomeFormDeleteButton,
  workflowEditOutcomeFormDuplicateButton,
  workflowEditOutcomeFormTitleField,
  workflowOutcomeExpandToggle,
  workflowOutcomeHeader,
  workflowOutcomeHeaderOrdinalOnly,
  workflowOutcomeHeadersAtFrDepth,
  workflowOutcomeHeaderWithOrdinalPrefix,
  workflowOutcomeHoverDeleteItem,
  workflowOutcomeHoverDuplicateItem,
  workflowOutcomeHoverInsertChildForHeader,
  workflowOutcomeHoverInsertSiblingForHeader,
  workflowOutcomeViewAddOutcomeButton,
  workflowOutcomeViewEmptyStateAlert,
} from './workflow-outcome.locators';

/**
 * Outcome create / insert / duplicate / delete — FR-WF-EO-001 through FR-WF-EO-014.
 * Requirements:
 * - workflow_edit_outcome_requirements_v1.yaml
 * - workflow_duplicate_outcome_requirements_v1.yaml
 * - workflow_delete_outcome_requirements_v1.yaml
 *
 * Serial suite: empty-state create restores the seeded title before insert/duplicate flows.
 *
 * Product gaps (locators use current product labels so actions remain testable):
 * - FR-WF-EO-003/010/013: hover tooltips still use short product copy
 *   ('Insert sibling' / 'Insert child' / 'Duplicate' / 'Delete') vs FR
 *   ('Insert outcome below' / 'Insert child outcome' / 'Duplicate outcome below' / 'Delete outcome').
 * - FR-WF-EO-008: Insert child is still rendered at FR depth 3 (not hidden per FR).
 * - FR-WF-EO-011: product still appends ' (duplicate)'; FR requires ' (copy)' — tests assert FR.
 */

const E2E_CHILD_TITLE = 'E2E Outcome Child';
const E2E_GRANDCHILD_TITLE = 'E2E Outcome Grandchild';
const E2E_OUTCOME_TITLE = E2E_SEED_OUTCOME_TITLE;
const E2E_OUTCOME_DUPLICATE = `${E2E_OUTCOME_TITLE} (copy)`;

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

test.describe.configure({ mode: 'serial' });

test.describe('empty state and first create (FR-WF-EO-001-002)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
  });

  test('FR-WF-EO-001: empty state alert and Add outcome button after removing seeded outcome', async ({
    page,
  }) => {
    const seededHeader = workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE);
    if ((await seededHeader.count()) > 0) {
      await hoverWorkflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE);
      await workflowOutcomeHoverDeleteItem(page, E2E_SEED_OUTCOME_TITLE).click();
    } else if ((await workflowOutcomeViewEmptyStateAlert(page).count()) === 0) {
      test.skip(true, 'Neither seeded outcome nor empty state; reseed E2E workflow.');
    }

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
  }) => {
    await expect(workflowOutcomeViewAddOutcomeButton(page)).toBeVisible();

    await workflowOutcomeViewAddOutcomeButton(page).click();

    await expect(workflowOutcomeViewEmptyStateAlert(page)).toHaveCount(0);
    // FR-WF-EO-002 / FR-WF-EO-006 — empty persisted title; header shows 'Untitled outcome' fallback.
    await expect(workflowOutcomeHeader(page, 'Untitled outcome')).toBeVisible();
    expect(await workflowOutcomeHeaderCount(page)).toBe(1);
    await expect(workflowEditOutcomeForm(page)).toHaveCount(0);
    await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
  });

  test('FR-WF-EO-002: restore seeded outcome title for downstream specs', async ({ page }) => {
    await workflowOutcomeHeader(page, 'Untitled outcome').click();
    await expect(workflowEditOutcomeForm(page)).toBeVisible();

    await workflowEditOutcomeFormTitleField(page).fill(E2E_SEED_OUTCOME_TITLE);
    await page.waitForTimeout(500);

    await expect(workflowOutcomeHeader(page, E2E_SEED_OUTCOME_TITLE)).toBeVisible();
  });
});

test.describe('insert, ordinals, depth, subtree delete (FR-WF-EO-003/007/008/014)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
    await ensureSeedOutcomeTitle(page, E2E_SEED_OUTCOME_TITLE);
    await ensureInsertSpecTreeState(page);
  });

  test('FR-WF-EO-003: Insert outcome below adds untitled workflowOutcome after source', async ({
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
    await expandWorkflowOutcomeChildren(page, E2E_SEED_OUTCOME_TITLE);
    // Level-2 headers under root 1 only (`1.N. …`); does not match `1.1.1. …`.
    const childrenBefore = await page.getByText(/^1\.\d+\.\s/).count();
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

    const lastChildOrdinal = `1.${childrenBefore + 1}`;
    await revealOutcomeByOrdinalPath(page, lastChildOrdinal);
    await expect(workflowOutcomeHeaderWithOrdinalPrefix(page, lastChildOrdinal)).toBeVisible();

    // Keep a stable titled 1.1 for downstream EO-007 / EO-003 depth-3 cases.
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

  test('FR-WF-EO-007: level-3 header uses dotted ordinal prefix', async ({ page }) => {
    await revealOutcomeByOrdinalPath(page, '1.1.1');
    await ensureOutcomeTitleByOrdinalPrefix(page, '1.1.1', E2E_GRANDCHILD_TITLE);
    await expect(page.getByText(/^1\.1\.1\.\s+E2E Outcome Grandchild$/)).toBeVisible();
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

test.describe('duplicate and delete (FR-WF-EO-009-014)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
    await ensureSeedOutcomeTitle(page, E2E_SEED_OUTCOME_TITLE);
    await skipUnlessPristineOutcome(page, workflow, E2E_OUTCOME_TITLE);
  });

  test('FR-WF-EO-009: workflowEditOutcomeFormDuplicateButton creates sibling copy', async ({
    page,
    workflow,
  }) => {
    const beforeCount = await workflowOutcomeHeaderCount(page);

    await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();
    await expect(workflowEditOutcomeForm(page)).toBeVisible();
    await workflowEditOutcomeFormDuplicateButton(page).click();

    await expect
      .poll(async () => workflowOutcomeHeaderCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
    await expect(workflowEditOutcomeFormTitleField(page)).toHaveValue(workflow.firstOutcome().title);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_DUPLICATE)).toBeVisible();
  });

  test('FR-WF-EO-011: duplicate root title appends (copy) suffix', async ({ page }) => {
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_DUPLICATE)).toBeVisible();
  });

  test('FR-WF-EO-010: hover Duplicate on duplicate adds another workflowOutcome sibling', async ({
    page,
  }) => {
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
    const duplicatePattern = new RegExp(
      `${E2E_OUTCOME_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(copy\\)`,
    );
    const duplicateHeader = page.getByText(duplicatePattern);
    if ((await duplicateHeader.count()) === 0) {
      test.skip(true, 'No disposable outcome duplicate left to delete via sidebar.');
    }

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

  test('cleanup: restore seeded root outcome title after duplicate/delete flow', async ({
    page,
  }) => {
    await ensureSeedOutcomeTitle(page, E2E_OUTCOME_TITLE);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toBeVisible();
  });
});
