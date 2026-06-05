import { test, expect, type Page } from '@playwright/test';
import { getWorkflowPathFromEnv } from '../../helpers/env';
import {
  DELETE_SECTION_HOVER_NAME,
  DUPLICATE_SECTION_HOVER_NAME,
  INSERT_BELOW_SECTION_NAME,
  deleteButtonInSidebar,
  deleteSectionCancelButton,
  deleteSectionConfirmButton,
  duplicateButtonInSidebar,
  rightSidebar,
  sectionHeader,
  titleFieldInEditSectionForm,
  EDIT_SECTION_HEADING,
} from './edit-section.locators';

/**
 * Playwright e2e — FR-SEC-001 … FR-SEC-006
 * Normalized requirements:
 *   tests/docs/requirements/original/workflow_edit_section_requirements_v1.yaml (FR-SEC-001–004, FR-SEC-007–009)
 *   tests/docs/requirements/original/workflow_duplicate_section_requirements_v1.yaml (FR-SEC-005)
 *   tests/docs/requirements/original/workflow_delete_section_requirements_v1.yaml (FR-SEC-006)
 * Canonical section uiObjects and locators: tests/docs/requirements/original/workflow_edit_section_requirements_v1.yaml
 * This spec file name reflects FR-SEC-001–006 coverage; FR-SEC-007–009 are in the same edit YAML.
 *
 * Tooling note (protocol): Figma MCP and Playwright MCP were not available in the
 * generation environment — disabled/hidden assertions follow FR text only; re-check
 * against Figma frames FIGMA-SEC-* when those tools are connected.
 *
 * Missing Requirement (prerequisites): FR "Prerequisites Section FRs" describe
 * authentication and navigation to a Workflow but do not specify URL, workflow id,
 * or how to obtain ≥1 Section. Set PLAYWRIGHT_WORKFLOW_PATH to a workflow view URL
 * that already contains at least one Section (and two Sections for FR-SEC-001
 * branch "sidebar already open" switching).
 */
const WORKFLOW_PATH = getWorkflowPathFromEnv();

async function gotoWorkflow(page: Page) {
  await page.goto(WORKFLOW_PATH);
}

/** First `[data-week-id]` on the board, or null if none. */
async function firstWeekId(page: Page): Promise<string> {
  const locator = await page.locator("[data-week-id]").first();
  await expect(locator).toBeVisible();
  const id = await locator.getAttribute("data-week-id");
  expect(id).not.toBeNull();
  return id!;
}

async function secondWeekId(page: Page): Promise<string | null> {
  return await page
    .locator("[data-week-id]")
    .nth(1)
    .getAttribute("data-week-id");
}

async function sectionCount(page: Page): Promise<number> {
  return page.locator('[data-week-id]').count();
}

test.describe('Edit Section — FR-SEC-001 to FR-SEC-006', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!WORKFLOW_PATH, 'Set PLAYWRIGHT_WORKFLOW_PATH (workflow with ≥1 Section).');
    await gotoWorkflow(page);
  });

  /**
   * FR-SEC-001 Open Edit Section Form — Original Requirements § FR-SEC-001
   * (Preconditions, Trigger 1, Main Flow, Acceptance: sidebar not open).
   */
  test('FR-SEC-001: click [Section header] opens [Right sidebar] with [Edit section] form', async ({
    page,
  }) => {
    const weekId = await firstWeekId(page);
    test.skip(!weekId, 'Workflow must expose at least one Section ([data-week-id]).');

    await test.step('Trigger: User clicks an existing Section ([Section header])', async () => {
      await sectionHeader(page, weekId).click();
    });

    await test.step('Main flow: [Right sidebar] shows [Edit section] (SIDEBAR_LOCATOR + heading)', async () => {
      await expect(rightSidebar(page)).toBeVisible();
      await expect(
        rightSidebar(page).getByRole('heading', { name: EDIT_SECTION_HEADING, exact: true }),
      ).toBeVisible();
    });
  });

  /**
   * FR-SEC-001 — Acceptance: [Right sidebar] already open, then click [Section header]
   * switches [Edit section] to the clicked Section.
   * Missing Requirement: FR does not state which sidebar tab/content must be open first;
   * this test assumes Edit section is already shown for another Section.
   */
  test('FR-SEC-001: with sidebar open, clicking another [Section header] updates [Edit section] target', async ({
    page,
  }) => {
    const a = await firstWeekId(page);
    const b = await secondWeekId(page);
    test.skip(!a || !b, 'Requires two Sections ([data-week-id]) on the workflow.');

    await sectionHeader(page, a).click();
    await expect(
      rightSidebar(page).getByRole('heading', { name: EDIT_SECTION_HEADING, exact: true }),
    ).toBeVisible();

    await test.step('Trigger: User clicks [Section header] of a different Section', async () => {
      await sectionHeader(page, b).click();
    });

    await test.step('Acceptance: [Right sidebar] still shows [Edit section] form', async () => {
      await expect(
        rightSidebar(page).getByRole('heading', { name: EDIT_SECTION_HEADING, exact: true }),
      ).toBeVisible();
    });
  });

  /**
   * FR-SEC-002 Section Numbering And Display — § FR-SEC-002
   * (numbering after insert; empty title shows number only on [Section header] via form).
   */
  test('FR-SEC-002: insert between sections yields contiguous indices; empty [Title] shows number only', async ({
    page,
  }) => {
    test.skip(
      !process.env.PLAYWRIGHT_E2E_EDITOR,
      'FR-SEC-002 insert/renumber requires Owner/Editor; set PLAYWRIGHT_E2E_EDITOR=1 with editor storageState or equivalent.',
    );

    const before = await sectionCount(page);
    test.skip(before < 1, 'At least one Section required.');
    const weekId = (await firstWeekId(page))!;

    await test.step('Trigger: Section insert completes (FR: hover [Insert below] on [Section header])', async () => {
      await sectionHeader(page, weekId).hover();
      await page.getByRole('button', { name: INSERT_BELOW_SECTION_NAME }).click();
    });

    await test.step('Acceptance: numbering stays contiguous top-to-bottom', async () => {
      const after = await sectionCount(page);
      expect(after).toBe(before + 1);
    });

    await test.step('Acceptance: given empty [Title] in [Edit section] form, only number displays (FR wording)', async () => {
      const target = (await firstWeekId(page))!;
      await sectionHeader(page, target).click();
      await titleFieldInEditSectionForm(page).fill('');
      await titleFieldInEditSectionForm(page).blur();
      // Missing Requirement: FR ties canvas display to form field emptiness; debounce/back-end timing not specified.
      await page.waitForTimeout(500);
      await expect(titleFieldInEditSectionForm(page)).toHaveValue('');
    });
  });

  /**
   * FR-SEC-003 Edit Section Title — § FR-SEC-003
   * (auto-save, no Save button, header reflects title).
   * Viewer/Commenter AC references FR-SEC-003 roleBehavior — exercised only when PLAYWRIGHT_TEST_ROLE is set.
   */
  test('FR-SEC-003: Owner/Editor — valid title persists without Save; [Section header] updates', async ({
    page,
  }) => {
    test.skip(!process.env.PLAYWRIGHT_E2E_EDITOR, 'Set PLAYWRIGHT_E2E_EDITOR=1 for edit-rights path.');

    const weekId = (await firstWeekId(page))!;
    await sectionHeader(page, weekId).click();
    await expect(
      rightSidebar(page).getByRole('heading', { name: EDIT_SECTION_HEADING, exact: true }),
    ).toBeVisible();

    await test.step('Main flow: no Save button on [Edit section] form', async () => {
      await expect(rightSidebar(page).getByRole('button', { name: /^save$/i })).toHaveCount(0);
    });

    await test.step('Trigger: User types in [Title] field', async () => {
      const unique = `E2E ${Date.now()}`;
      await titleFieldInEditSectionForm(page).fill(unique);
      await titleFieldInEditSectionForm(page).blur();
    });

    await test.step('Acceptance: title persists and [Section header] reflects it (after auto-save)', async () => {
      await expect(titleFieldInEditSectionForm(page)).not.toHaveValue('', { timeout: 15_000 });
      // Missing Requirement: FR does not specify delay for auto-save; implementation uses debounce.
      await expect(sectionHeader(page, weekId)).toContainText(await titleFieldInEditSectionForm(page).inputValue(), {
        timeout: 15_000,
      });
    });
  });

  test('FR-SEC-003: Given Viewer or Commenter — [Title] not editable', async ({ page }) => {
    test.skip(
      process.env.PLAYWRIGHT_TEST_ROLE !== 'viewer' &&
        process.env.PLAYWRIGHT_TEST_ROLE !== 'commenter',
      'Set PLAYWRIGHT_TEST_ROLE=viewer|commenter and storageState for that role. Missing Requirement: FR omits test account setup.',
    );
    const weekId = (await firstWeekId(page))!;
    await sectionHeader(page, weekId).click();
    await expect(titleFieldInEditSectionForm(page)).toBeDisabled();
  });

  /**
   * FR-SEC-004 Insert Section Below — § FR-SEC-004
   */
  test('FR-SEC-004: Owner/Editor — new Section at K+1 after [Insert below] on [Section header]', async ({
    page,
  }) => {
    test.skip(!process.env.PLAYWRIGHT_E2E_EDITOR, 'Set PLAYWRIGHT_E2E_EDITOR=1.');

    test.skip((await sectionCount(page)) < 1, 'At least one Section required.');
    const k = (await firstWeekId(page))!;
    const before = await sectionCount(page);

    await test.step('Trigger: [Insert below] on hover of [Section header]', async () => {
      await sectionHeader(page, k!).hover();
      await page.getByRole('button', { name: INSERT_BELOW_SECTION_NAME }).click();
    });

    await test.step('Acceptance: new Section inserted; indices shift (count +1)', async () => {
      expect(await sectionCount(page)).toBe(before + 1);
    });
  });

  test('FR-SEC-004: Commenter — [Insert below] visible but inactive on [Section header]', async ({ page }) => {
    test.skip(process.env.PLAYWRIGHT_TEST_ROLE !== 'commenter', 'Set PLAYWRIGHT_TEST_ROLE=commenter + commenter auth.');
    const weekId = (await firstWeekId(page))!;
    await sectionHeader(page, weekId).hover();
    const insert = page.getByRole('button', { name: INSERT_BELOW_SECTION_NAME });
    await expect(insert).toBeVisible();
    await expect(insert).toBeDisabled();
  });

  test('FR-SEC-004: Viewer — no insert icon on hover of [Section header]', async ({ page }) => {
    test.skip(process.env.PLAYWRIGHT_TEST_ROLE !== 'viewer', 'Set PLAYWRIGHT_TEST_ROLE=viewer + viewer auth.');
    const weekId = (await firstWeekId(page))!;
    await sectionHeader(page, weekId).hover();
    await expect(page.getByRole('button', { name: INSERT_BELOW_SECTION_NAME })).toHaveCount(0);
  });

  /**
   * FR-SEC-005 Duplicate Section Below — § FR-SEC-005
   * Missing Requirement: FR requires parity of Nodes/metas/Outcomes/Workflows/Edges and exclusion of comments
   * but does not define observable selectors or seed data; only placement + title suffix asserted here.
   */
  test('FR-SEC-005: duplicate below mirrors placement; copied title uses "(copy)" suffix', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_E2E_EDITOR, 'Set PLAYWRIGHT_E2E_EDITOR=1.');

    const weekId = (await firstWeekId(page))!;
    await sectionHeader(page, weekId).click();
    await titleFieldInEditSectionForm(page).fill('');
    await titleFieldInEditSectionForm(page).blur();
    await page.waitForTimeout(400);

    await test.step('Trigger: [Duplicate] from [Right sidebar] [Edit section] form', async () => {
      await duplicateButtonInSidebar(page).click();
    });

    await test.step('Acceptance: copy placed below; title is (copy) when source empty', async () => {
      expect(await sectionCount(page)).toBeGreaterThanOrEqual(2);
      await expect(titleFieldInEditSectionForm(page)).toHaveValue(/\(copy\)/, { timeout: 15_000 });
    });
  });

  test('FR-SEC-005: Commenter — [Duplicate] inactive on hover; read-only in sidebar', async ({ page }) => {
    test.skip(process.env.PLAYWRIGHT_TEST_ROLE !== 'commenter', 'Set PLAYWRIGHT_TEST_ROLE=commenter + commenter auth.');
    const weekId = (await firstWeekId(page))!;
    await sectionHeader(page, weekId).hover();
    await expect(page.getByRole('button', { name: DUPLICATE_SECTION_HOVER_NAME })).toBeDisabled();
    await sectionHeader(page, weekId).click();
    await expect(duplicateButtonInSidebar(page)).toBeDisabled();
  });

  test('FR-SEC-005: Viewer — no duplicate icon on hover; [Duplicate] read-only in sidebar', async ({ page }) => {
    test.skip(process.env.PLAYWRIGHT_TEST_ROLE !== 'viewer', 'Set PLAYWRIGHT_TEST_ROLE=viewer + viewer auth.');
    const weekId = (await firstWeekId(page))!;
    await sectionHeader(page, weekId).hover();
    await expect(page.getByRole('button', { name: DUPLICATE_SECTION_HOVER_NAME })).toHaveCount(0);
    await sectionHeader(page, weekId).click();
    await expect(duplicateButtonInSidebar(page)).toBeDisabled();
  });

  /**
   * FR-SEC-006 Delete Section — § FR-SEC-006
   * Missing Requirement: FR states modal copy is identical across locales — not asserted (needs i18n matrix).
   */
  test('FR-SEC-006: delete from [Right sidebar] — modal opens; Cancel leaves workflow unchanged', async ({
    page,
  }) => {
    test.skip(!process.env.PLAYWRIGHT_E2E_EDITOR, 'Set PLAYWRIGHT_E2E_EDITOR=1.');

    const before = await sectionCount(page);
    const weekId = (await firstWeekId(page))!;
    await sectionHeader(page, weekId).click();

    await test.step('Trigger: [Delete] in [Edit section] form', async () => {
      await deleteButtonInSidebar(page).click();
    });

    await test.step('Acceptance: Section not removed until [Delete section] confirmed', async () => {
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await sectionCount(page)).toBe(before);
    });

    await test.step('Branch: [Cancel]', async () => {
      await deleteSectionCancelButton(page).click();
    });

    await test.step('Acceptance: modal closes; no change to Section count', async () => {
      await expect(page.getByRole('dialog')).toBeHidden();
      expect(await sectionCount(page)).toBe(before);
    });
  });

  test('FR-SEC-006: delete from hover — same modal; confirm removes Section', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_E2E_EDITOR, 'Set PLAYWRIGHT_E2E_EDITOR=1.');
    test.skip(
      (await sectionCount(page)) < 2,
      'Keep ≥2 Sections or use disposable workflow; destructive test removes one Section.',
    );

    const before = await sectionCount(page);
    const weekId = (await firstWeekId(page))!;

    await test.step('Trigger: [Delete] icon on hover of [Section header]', async () => {
      await sectionHeader(page, weekId).hover();
      await page.getByRole('button', { name: DELETE_SECTION_HOVER_NAME }).click();
    });

    await expect(page.getByRole('dialog')).toBeVisible();

    await test.step('Branch: confirm [Delete section]', async () => {
      await deleteSectionConfirmButton(page).click();
    });

    await test.step('Acceptance: Section removed; remaining numbering updated', async () => {
      await expect(page.getByRole('dialog')).toBeHidden();
      expect(await sectionCount(page)).toBe(before - 1);
    });
  });
});
