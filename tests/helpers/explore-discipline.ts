import { expect, type Page } from '@playwright/test';

import { DISCIPLINE_CATALOGUE_AZ } from './discipline-catalogue';
import {
  closeDisciplineFilterPopover,
  disciplineFilter,
  disciplineFilterAllOption,
  disciplineFilterCheckboxOption,
  disciplineFilterCheckboxOptions,
  disciplineFilterNoneOption,
  disciplineFilterOptionLabels,
  disciplineFilterSearchField,
  disciplineFilterSelectionIndicator,
  expectLibraryCardTitles,
  libraryCards,
  libraryCardTitles,
  openDisciplineFilterPopover,
  triggerLibrarySearchAndWait,
} from '../shared/locators/library';

/** FR-EXP-003 — checklist matches fixed discipline catalogue A–Z. */
export async function expectDisciplineFilterCatalogue(page: Page): Promise<void> {
  await openDisciplineFilterPopover(page);

  const labels = await disciplineFilterOptionLabels(page);
  expect(labels).toEqual([...DISCIPLINE_CATALOGUE_AZ]);

  await closeDisciplineFilterPopover(page);
}

/** FR-EXP-003 — popover exposes search, All, and None controls. */
export async function expectDisciplineFilterPopoverShell(page: Page): Promise<void> {
  await openDisciplineFilterPopover(page);

  await expect(disciplineFilterSearchField(page)).toBeVisible();
  await expect(disciplineFilterAllOption(page)).toBeVisible();
  await expect(disciplineFilterNoneOption(page)).toBeVisible();

  await closeDisciplineFilterPopover(page);
}

/** FR-EXP-003 — All selects only disciplines visible after search; hidden rows stay unselected. */
export async function expectDisciplineFilterAllSelectsOnlyVisibleRows(page: Page): Promise<void> {
  await openDisciplineFilterPopover(page);

  const searchTerm = 'Science';
  await disciplineFilterSearchField(page).fill(searchTerm);
  await expect
    .poll(async () => (await disciplineFilterOptionLabels(page)).length, { timeout: 5_000 })
    .toBeGreaterThan(0);

  const visibleLabels = await disciplineFilterOptionLabels(page);
  await disciplineFilterAllOption(page).click();
  await closeDisciplineFilterPopover(page);

  await expect(disciplineFilterSelectionIndicator(page)).toHaveText(String(visibleLabels.length));

  await openDisciplineFilterPopover(page);
  for (const label of DISCIPLINE_CATALOGUE_AZ) {
    const option = disciplineFilterCheckboxOption(page, label);
    const checkbox = option.getByRole('checkbox');
    if (visibleLabels.includes(label)) {
      await expect(checkbox).toBeChecked();
    } else {
      await expect(checkbox).not.toBeChecked();
    }
  }

  await closeDisciplineFilterPopover(page);
}

/** FR-EXP-003 — read-only row with zero matching results cannot change selection. */
export async function expectDisciplineFilterReadOnlyZeroResultRow(page: Page): Promise<void> {
  await openDisciplineFilterPopover(page);

  const options = disciplineFilterCheckboxOptions(page);
  const count = await options.count();
  let readOnlyLabel: string | null = null;

  for (let i = 0; i < count; i++) {
    const option = options.nth(i);
    if (await option.isDisabled()) {
      readOnlyLabel = (await option.innerText()).trim();
      break;
    }
  }

  if (!readOnlyLabel) {
    throw new Error('No read-only discipline row found — seed explore with a zero-match discipline.');
  }

  const option = disciplineFilterCheckboxOption(page, readOnlyLabel);
  await option.click();
  await expect(option.getByRole('checkbox')).not.toBeChecked();

  await closeDisciplineFilterPopover(page);
}

/** FR-EXP-003 — selecting two disciplines OR-matches results in resultsRegion. */
export async function expectDisciplineFilterOrResultsInRegion(
  page: Page,
  disciplineA: string,
  disciplineB: string,
): Promise<void> {
  const baselineTitles = await libraryCardTitles(page).allInnerTexts();
  const baselineCount = baselineTitles.length;

  await triggerLibrarySearchAndWait(
    page,
    async () => {
      await openDisciplineFilterPopover(page);
      await disciplineFilterCheckboxOption(page, disciplineA).click();
      await disciplineFilterCheckboxOption(page, disciplineB).click();
      await closeDisciplineFilterPopover(page);
    },
    (request) =>
      Array.isArray(request.filters?.disciplineIds) &&
      request.filters.disciplineIds.length === 2,
  );

  await expect(disciplineFilterSelectionIndicator(page)).toHaveText('2');

  const filteredCount = await libraryCards(page).count();
  expect(filteredCount).toBeLessThanOrEqual(baselineCount);
  expect(filteredCount).toBeGreaterThan(0);
}

/** FR-EXP-003 — search narrows visible checklist rows by label match. */
export async function expectDisciplineFilterSearchNarrowsChecklist(page: Page): Promise<void> {
  await openDisciplineFilterPopover(page);

  const labels = await disciplineFilterOptionLabels(page);
  if (labels.length < 2) {
    await closeDisciplineFilterPopover(page);
    return;
  }

  const targetLabel = labels[0]!;
  await disciplineFilterSearchField(page).fill(targetLabel);
  await expect
    .poll(async () => (await disciplineFilterOptionLabels(page)).length, { timeout: 5_000 })
    .toBeLessThanOrEqual(labels.length);

  const filteredLabels = await disciplineFilterOptionLabels(page);
  expect(filteredLabels.length).toBeGreaterThanOrEqual(1);
  for (const label of filteredLabels) {
    expect(label.toLowerCase()).toContain(targetLabel.toLowerCase());
  }

  await closeDisciplineFilterPopover(page);
}

/** FR-EXP-003 — All/None and disciplineFilterSelectionIndicator on closed trigger. */
export async function expectDisciplineFilterSelectionIndicatorBehaviour(page: Page): Promise<void> {
  await expect(disciplineFilterSelectionIndicator(page)).toHaveCount(0);
  const baselineTitles = await libraryCardTitles(page).allInnerTexts();

  await openDisciplineFilterPopover(page);
  const selectableCount = await disciplineFilterCheckboxOptions(page).count();
  if (selectableCount === 0) {
    await closeDisciplineFilterPopover(page);
    return;
  }

  await triggerLibrarySearchAndWait(
    page,
    async () => {
      await disciplineFilterAllOption(page).click();
      await closeDisciplineFilterPopover(page);
    },
    (request) =>
      Array.isArray(request.filters?.disciplineIds) &&
      request.filters.disciplineIds.length === selectableCount,
  );

  await expect(disciplineFilterSelectionIndicator(page)).toBeVisible();
  await expect(disciplineFilterSelectionIndicator(page)).toHaveText(String(selectableCount));

  await openDisciplineFilterPopover(page);
  await disciplineFilterNoneOption(page).click();
  await closeDisciplineFilterPopover(page);

  await expect(disciplineFilterSelectionIndicator(page)).toHaveCount(0);
  await expectLibraryCardTitles(page, baselineTitles);
}
