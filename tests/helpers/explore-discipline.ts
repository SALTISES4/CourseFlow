import { expect, type Page } from '@playwright/test';

import {
  DISCIPLINE_CATALOGUE_AZ,
  DISCIPLINE_CATALOGUE_OPTIONS,
} from './discipline-catalogue';
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
  type LibrarySearchRequestBody,
} from '../shared/locators/library';

type MockExploreItem = {
  uuid: string;
  contentType: 'project' | 'workflow';
  label: 'project' | 'activity' | 'course' | 'program';
  title: string;
  description: string;
  ownerName: string;
  workflowCount: number | null;
  dateCreated: string;
  modifiedOn: string;
  isArchived: false;
  isTemplate: boolean;
  isFavorite: boolean;
  permissions: {
    accountRole: null;
    resourceRole: null;
    state: 'active';
    actions: string[];
    adminOverride: false;
  };
  disciplineCodes: string[];
};

const mockItem = (
  sequence: number,
  disciplineCode: string,
  contentType: MockExploreItem['contentType'],
  label: MockExploreItem['label'],
): MockExploreItem => ({
  uuid: `20000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
  contentType,
  label,
  title: `E2E Discipline Result ${sequence}`,
  description: `Deterministic ${label} result`,
  ownerName: 'E2E Discipline Owner',
  workflowCount: contentType === 'project' ? 1 : null,
  dateCreated: `2024-01-${String((sequence % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
  modifiedOn: `2024-02-${String((sequence % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
  isArchived: false,
  isTemplate: sequence % 3 === 0,
  isFavorite: sequence % 2 === 0,
  permissions: {
    accountRole: null,
    resourceRole: null,
    state: 'active',
    actions: [],
    adminOverride: false,
  },
  disciplineCodes: [disciplineCode],
});

const ANTHROPOLOGY_CODE = 'anthropology';
const BIOLOGY_CODE = 'biology';
const SCIENCE_DISCIPLINE_CODES = [
  'environmental_science',
  'science_general',
  'social_sciences_general',
] as const;

const MOCK_EXPLORE_ITEMS: MockExploreItem[] = [
  ...Array.from({ length: 11 }, (_, index) =>
    mockItem(
      index + 1,
      ANTHROPOLOGY_CODE,
      index < 6 ? 'project' : 'workflow',
      index < 6 ? 'project' : 'activity',
    ),
  ),
  mockItem(12, BIOLOGY_CODE, 'project', 'project'),
  mockItem(13, BIOLOGY_CODE, 'workflow', 'course'),
  mockItem(14, SCIENCE_DISCIPLINE_CODES[0], 'project', 'project'),
  mockItem(15, SCIENCE_DISCIPLINE_CODES[1], 'workflow', 'program'),
  mockItem(16, SCIENCE_DISCIPLINE_CODES[2], 'workflow', 'activity'),
];

function withoutMockOnlyFields(item: MockExploreItem): Omit<MockExploreItem, 'disciplineCodes'> {
  const { disciplineCodes: _disciplineCodes, ...responseItem } = item;
  return responseItem;
}

/** Deterministic FR-EXP-003 search fixture with pagination, OR filters, and disabled disciplines. */
export async function installExploreDisciplineSearchMock(page: Page): Promise<void> {
  await page.route('**/api/library/search', async (route) => {
    const request = route.request().postDataJSON() as LibrarySearchRequestBody;
    const filters = request.filters ?? {};
    const contentType = filters.contentType;
    const workflowTypes = Array.isArray(filters.workflowTypes) ? filters.workflowTypes : [];
    const keyword = typeof filters.keyword === 'string' ? filters.keyword.toLowerCase() : null;
    const selectedDisciplineCodes = Array.isArray(filters.disciplineCodes)
      ? filters.disciplineCodes.filter((value): value is string => typeof value === 'string')
      : [];

    let contextItems = MOCK_EXPLORE_ITEMS.filter((item) => {
      if (contentType && item.contentType !== contentType) return false;
      if (workflowTypes.length && !workflowTypes.includes(item.label)) return false;
      if (filters.isFavorite === true && !item.isFavorite) return false;
      if (filters.isTemplate === true && !item.isTemplate) return false;
      if (
        keyword &&
        !item.title.toLowerCase().includes(keyword) &&
        !item.description.toLowerCase().includes(keyword)
      ) {
        return false;
      }
      return true;
    });

    const allowedDisciplineCodes = new Set(
      contextItems.flatMap((item) => item.disciplineCodes),
    );

    if (selectedDisciplineCodes.length) {
      contextItems = contextItems.filter((item) =>
        item.disciplineCodes.some((code) =>
          selectedDisciplineCodes.includes(code),
        ),
      );
    }

    const pageIndex = Number(request.pagination?.page ?? 0);
    const resultsPerPage = Number(request.pagination?.resultsPerPage ?? 10);
    const totalResults = contextItems.length;
    const pageCount = totalResults ? Math.ceil(totalResults / resultsPerPage) : 0;
    const start = pageIndex * resultsPerPage;
    const items = contextItems
      .slice(start, start + resultsPerPage)
      .map(withoutMockOnlyFields);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items,
        meta: {
          totalResults,
          pageCount,
          currentPage: pageIndex,
          resultsPerPage,
          appliedFilters: filters,
          allowed: {
            disciplines: DISCIPLINE_CATALOGUE_OPTIONS.filter((option) =>
              allowedDisciplineCodes.has(option.code),
            ).map((option) => ({
              code: option.code,
            })),
          },
        },
      }),
    });
  });
}

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

  const visibleOptions = disciplineFilterCheckboxOptions(page);
  const selectableVisibleLabels: string[] = [];
  for (let i = 0; i < (await visibleOptions.count()); i++) {
    const option = visibleOptions.nth(i);
    if (!(await option.isDisabled())) {
      selectableVisibleLabels.push((await option.innerText()).trim());
    }
  }
  await triggerLibrarySearchAndWait(
    page,
    async () => {
      await disciplineFilterAllOption(page).click();
      await closeDisciplineFilterPopover(page);
    },
    (request) =>
      Array.isArray(request.filters?.disciplineCodes) &&
      request.filters.disciplineCodes.length === selectableVisibleLabels.length,
  );

  await expect(disciplineFilterSelectionIndicator(page)).toHaveText(
    String(selectableVisibleLabels.length),
  );

  await openDisciplineFilterPopover(page);
  for (const label of DISCIPLINE_CATALOGUE_AZ) {
    const option = disciplineFilterCheckboxOption(page, label);
    const checkbox = option.getByRole('checkbox');
    if (selectableVisibleLabels.includes(label)) {
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
  await expect(option).toBeDisabled();
  await option.click({ force: true });
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
      Array.isArray(request.filters?.disciplineCodes) &&
      request.filters.disciplineCodes.length === 2,
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
  const options = disciplineFilterCheckboxOptions(page);
  let selectableCount = 0;
  for (let i = 0; i < (await options.count()); i++) {
    if (!(await options.nth(i).isDisabled())) {
      selectableCount += 1;
    }
  }
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
      Array.isArray(request.filters?.disciplineCodes) &&
      request.filters.disciplineCodes.length === selectableCount,
  );

  await expect(disciplineFilterSelectionIndicator(page)).toBeVisible();
  await expect(disciplineFilterSelectionIndicator(page)).toHaveText(String(selectableCount));

  await openDisciplineFilterPopover(page);
  await disciplineFilterNoneOption(page).click();
  await closeDisciplineFilterPopover(page);

  await expect(disciplineFilterSelectionIndicator(page)).toHaveCount(0);
  await expectLibraryCardTitles(page, baselineTitles);
}
