import { expect, type Page } from '@playwright/test';

import { cardChipWithLabel } from '../shared/locators/cards';
import {
  TYPE_FILTER_PLACEHOLDER,
  WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003,
  closeWorkflowTypeFilterPopover,
  libraryResultsWorkflowCards,
  openWorkflowTypeFilterPopover,
  selectFilterOption,
  typeFilter,
  typeFilterResetButton,
  triggerLibrarySearchAndWait,
  workflowTypeFilter,
  workflowTypeFilterAllOption,
  workflowTypeFilterCheckboxOption,
  workflowTypeFilterCheckboxOptions,
  workflowTypeFilterNoneOption,
  workflowTypeFilterOptionLabels,
  workflowTypeFilterSelectionIndicator,
} from '../shared/locators/library';

/** FR-EXP-004 / FR-LIB-003 — typeFilterResetButton when type scope is committed; reset restores Unset. */
export async function expectTypeFilterResetPerFrLib003(page: Page): Promise<void> {
  await expect(typeFilter(page)).toHaveText(TYPE_FILTER_PLACEHOLDER, { exact: true });
  await expect(typeFilterResetButton(page)).toBeHidden();

  await selectFilterOption(page, typeFilter(page), 'Projects');
  await expect(typeFilter(page)).toHaveText('Projects', { exact: true });
  await expect(typeFilterResetButton(page)).toBeVisible();

  await typeFilterResetButton(page).click();
  await expect(typeFilter(page)).toHaveText(TYPE_FILTER_PLACEHOLDER, { exact: true });
  await expect(typeFilterResetButton(page)).toBeHidden();
}

/** FR-EXP-004 / FR-LIB-003 — workflowTypeFilter is multiselect with Activity, Course, Program plus All/None. */
export async function expectWorkflowTypeFilterPopoverShell(page: Page): Promise<void> {
  await openWorkflowTypeFilterPopover(page);

  const labels = await workflowTypeFilterOptionLabels(page);
  expect(labels).toEqual([...WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003]);

  await expect(workflowTypeFilterAllOption(page)).toBeVisible();
  await expect(workflowTypeFilterNoneOption(page)).toBeVisible();

  const options = workflowTypeFilterCheckboxOptions(page);
  await expect(options).toHaveCount(WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003.length);
  for (let i = 0; i < WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003.length; i++) {
    await expect(options.nth(i).getByRole('checkbox')).toBeVisible();
  }

  await closeWorkflowTypeFilterPopover(page);
}

/** FR-EXP-004 / FR-LIB-003 — selection indicator hidden when unset; shows count when options selected. */
export async function expectWorkflowTypeFilterSelectionIndicatorBehaviour(page: Page): Promise<void> {
  await expect(workflowTypeFilterSelectionIndicator(page)).toHaveCount(0);

  await openWorkflowTypeFilterPopover(page);
  await workflowTypeFilterCheckboxOption(page, WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003[0]!).click();
  await closeWorkflowTypeFilterPopover(page);

  await expect(workflowTypeFilterSelectionIndicator(page)).toHaveText('1');

  await openWorkflowTypeFilterPopover(page);
  await workflowTypeFilterNoneOption(page).click();
  await closeWorkflowTypeFilterPopover(page);

  await expect(workflowTypeFilterSelectionIndicator(page)).toHaveCount(0);
}

/** FR-EXP-004 / FR-LIB-003 — each workflowCard in resultsRegion matches at least one selected workflow type. */
export async function expectExploreWorkflowCardsMatchSelectedWorkflowTypes(
  page: Page,
  selectedTypeLabels: readonly string[],
): Promise<void> {
  const cards = libraryResultsWorkflowCards(page);
  const count = await cards.count();

  if (count === 0) {
    return;
  }

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const matches = await Promise.all(
      selectedTypeLabels.map((label) => cardChipWithLabel(card, label).count()),
    );
    expect(
      matches.some((chipCount) => chipCount > 0),
      `workflow card ${i + 1} should match one of: ${selectedTypeLabels.join(', ')}`,
    ).toBe(true);
  }
}

/** FR-EXP-004 / FR-LIB-003 — committing one workflow type narrows workflow results to that type chip. */
export async function expectWorkflowTypeFilterSingleSelectionNarrowsWorkflowOnlyResults(
  page: Page,
  workflowTypeLabel: (typeof WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003)[number],
): Promise<void> {
  await expect(workflowTypeFilter(page)).toBeVisible();

  await triggerLibrarySearchAndWait(
    page,
    async () => {
      await openWorkflowTypeFilterPopover(page);
      await workflowTypeFilterCheckboxOption(page, workflowTypeLabel).click();
      await closeWorkflowTypeFilterPopover(page);
    },
    { filters: { workflowTypes: [workflowTypeLabel.toLowerCase()] } },
  );

  await expect(workflowTypeFilterSelectionIndicator(page)).toHaveText('1');
  await expectExploreWorkflowCardsMatchSelectedWorkflowTypes(page, [workflowTypeLabel]);
}

/** FR-EXP-004 / FR-LIB-003 — committing one workflow type narrows workflow results to that type chip. */
export async function expectWorkflowTypeFilterSingleSelectionNarrowsResults(
  page: Page,
  workflowTypeLabel: (typeof WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003)[number],
): Promise<void> {
  await selectFilterOption(page, typeFilter(page), 'Workflows');
  await expectWorkflowTypeFilterSingleSelectionNarrowsWorkflowOnlyResults(
    page,
    workflowTypeLabel,
  );
}

/** FR-EXP-004 / FR-LIB-003 — multiselect OR semantics: results match any selected workflow type. */
export async function expectWorkflowTypeFilterOrResultsInRegion(
  page: Page,
  workflowTypeA: (typeof WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003)[number],
  workflowTypeB: (typeof WORKFLOW_TYPE_FILTER_OPTIONS_FR_LIB_003)[number],
): Promise<void> {
  await selectFilterOption(page, typeFilter(page), 'Workflows');

  await triggerLibrarySearchAndWait(
    page,
    async () => {
      await openWorkflowTypeFilterPopover(page);
      await workflowTypeFilterCheckboxOption(page, workflowTypeA).click();
      await workflowTypeFilterCheckboxOption(page, workflowTypeB).click();
      await closeWorkflowTypeFilterPopover(page);
    },
    {
      filters: {
        workflowTypes: [workflowTypeA.toLowerCase(), workflowTypeB.toLowerCase()],
      },
    },
  );

  await expect(workflowTypeFilterSelectionIndicator(page)).toHaveText('2');
  await expectExploreWorkflowCardsMatchSelectedWorkflowTypes(page, [workflowTypeA, workflowTypeB]);
}
