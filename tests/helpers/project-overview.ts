import { expect, type Page, type Route } from '@playwright/test';

import { authenticatedApiRequest } from './api';

import {
  PROJECT_OVERVIEW_EMPTY_METADATA_VALUE,
  PROJECT_OVERVIEW_FORBIDDEN_METADATA_LABELS,
  PROJECT_OVERVIEW_METADATA_LABELS,
  PROJECT_PUBLISH_CONFIRMATION_MODAL_COPY,
  PROJECT_PUBLISH_SNACKBAR_MESSAGES,
  PROJECT_UNPUBLISH_SNACKBAR_MESSAGES,
  PROJECT_VISIBILITY_STATE_MESSAGES,
  globalMessageSnackbar,
  projectMetadataBlock,
  projectMetadataFieldDescription,
  projectMetadataFieldDisciplines,
  projectMetadataPermissionsPanel,
  projectOverviewView,
  projectTagsSection,
  projectTitle,
  publishProjectButton,
  publishProjectConfirmationModal,
  publishProjectConfirmationModalCancelButton,
  publishProjectConfirmationModalConfirmButton,
  projectVisibilityStateMessage,
  unpublishProjectButton,
} from '../e2e/project/project.locators';

export type ProjectDetailApiItem = {
  uuid: string;
  title: string;
  description: string;
  isPublished: boolean;
};

export async function fetchProjectDetail(
  page: Page,
  projectUuid: string,
): Promise<ProjectDetailApiItem> {
  const path = `/api/project/${projectUuid}`;
  const response = await authenticatedApiRequest(page, 'GET', path);
  expect(response.ok(), `${path} returned HTTP ${response.status()}`).toBeTruthy();
  const body = (await response.json()) as { item: ProjectDetailApiItem };
  return body.item;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Strip the block label line and return the displayed metadata value text. */
export async function projectMetadataBlockDisplayedValue(
  page: Page,
  label: string,
): Promise<string> {
  const block = projectMetadataBlock(page, label);
  await expect(block).toBeVisible();
  const text = (await block.innerText()).trim();
  return text.replace(new RegExp(`^${escapeRegExp(label)}\\s*`), '').trim();
}

export function formatExpectedDisciplinesDisplay(disciplineLabels: string[]): string {
  if (disciplineLabels.length === 0) {
    return PROJECT_OVERVIEW_EMPTY_METADATA_VALUE;
  }

  return [...disciplineLabels].sort((a, b) => a.localeCompare(b)).join(', ');
}

/**
 * FR-PROJ-FORM-005 / FR-PROJ-FORM-006 — after successful create/edit submit,
 * projectHeader title and overview description/disciplines match submitted values.
 */
export async function expectProjectOverviewShowsSubmittedFormValues(
  page: Page,
  values: {
    title: string;
    description: string;
    disciplineLabels: string[];
  },
): Promise<void> {
  await expect(projectTitle(page)).toHaveText(values.title, { exact: true });

  const expectedDescription = values.description.trim()
    ? values.description.trim()
    : PROJECT_OVERVIEW_EMPTY_METADATA_VALUE;
  const displayedDescription = await projectMetadataBlockDisplayedValue(
    page,
    PROJECT_OVERVIEW_METADATA_LABELS.description,
  );
  if (values.description.trim()) {
    expect(displayedDescription).toContain(expectedDescription);
  } else {
    expect(displayedDescription).toBe(PROJECT_OVERVIEW_EMPTY_METADATA_VALUE);
  }

  const displayedDisciplines = await projectMetadataBlockDisplayedValue(
    page,
    PROJECT_OVERVIEW_METADATA_LABELS.disciplines,
  );
  expect(displayedDisciplines).toBe(formatExpectedDisciplinesDisplay(values.disciplineLabels));
}

function parseCommaSeparatedDisciplines(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** FR-PROJ-OV-001 — project overview route and metadata block labels. */
export async function expectProjectOverviewMetadataLabelsPerFrProjOv001(
  page: Page,
): Promise<void> {
  await expect(page).toHaveURL(/\/project\/[0-9a-f-]+\/?$/);
  await expect(projectOverviewView(page)).toBeVisible();
  await expect(projectMetadataFieldDescription(page)).toBeVisible();
  await expect(projectMetadataFieldDisciplines(page)).toBeVisible();
  await expect(projectMetadataPermissionsPanel(page)).toBeVisible();
  await expect(projectTagsSection(page)).toBeVisible();

  for (const forbiddenLabel of PROJECT_OVERVIEW_FORBIDDEN_METADATA_LABELS) {
    await expect(projectOverviewView(page).getByText(forbiddenLabel, { exact: true })).toHaveCount(
      0,
    );
  }
}

/** FR-PROJ-OV-001 — description block shows API value or '-'. */
export async function expectProjectOverviewDescriptionPerFrProjOv001(
  page: Page,
  project: ProjectDetailApiItem,
): Promise<void> {
  await expect(projectMetadataFieldDescription(page)).toBeVisible();

  const displayed = await projectMetadataBlockDisplayedValue(
    page,
    PROJECT_OVERVIEW_METADATA_LABELS.description,
  );
  const expected = project.description?.trim()
    ? project.description.trim()
    : PROJECT_OVERVIEW_EMPTY_METADATA_VALUE;

  if (project.description?.trim()) {
    expect(displayed).toContain(expected);
  } else {
    expect(displayed).toBe(PROJECT_OVERVIEW_EMPTY_METADATA_VALUE);
  }
}

/** FR-PROJ-OV-001 — disciplines block shows '-' when empty or A–Z comma-separated values. */
export async function expectProjectOverviewDisciplinesPerFrProjOv001(page: Page): Promise<void> {
  await expect(projectMetadataFieldDisciplines(page)).toBeVisible();

  const displayed = await projectMetadataBlockDisplayedValue(
    page,
    PROJECT_OVERVIEW_METADATA_LABELS.disciplines,
  );

  if (displayed === PROJECT_OVERVIEW_EMPTY_METADATA_VALUE) {
    return;
  }

  const labels = parseCommaSeparatedDisciplines(displayed);
  expect(labels.length).toBeGreaterThan(0);
  expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
}

export async function expectProjectPublishSnackbarMessage(
  page: Page,
  message: string,
): Promise<void> {
  await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
  await expect(globalMessageSnackbar(page)).toHaveText(message, { exact: true });
}

export async function expectProjectUnpublishSnackbarMessage(
  page: Page,
  message: string,
): Promise<void> {
  await expectProjectPublishSnackbarMessage(page, message);
}

/** FR-PROJ-OV-003 — unpublished project visibility message and publish control for owner/editor. */
export async function expectUnpublishedPublishControlsPerFrProjOv003(page: Page): Promise<void> {
  await expect(projectVisibilityStateMessage(page)).toHaveText(
    PROJECT_VISIBILITY_STATE_MESSAGES.private,
    { exact: true },
  );
  await expect(publishProjectButton(page)).toBeVisible();
  await expect(unpublishProjectButton(page)).toHaveCount(0);
}

/** FR-PROJ-OV-003 — published project visibility message and unpublish control for owner/editor. */
export async function expectPublishedUnpublishControlsPerFrProjOv003(page: Page): Promise<void> {
  await expect(projectVisibilityStateMessage(page)).toHaveText(
    PROJECT_VISIBILITY_STATE_MESSAGES.public,
    { exact: true },
  );
  await expect(unpublishProjectButton(page)).toBeVisible();
  await expect(publishProjectButton(page)).toHaveCount(0);
}

/** FR-PROJ-OV-003 — FIGMA-PROJ-OV-PUBLISH-PROJECT-MODAL copy and actions. */
export async function expectPublishProjectConfirmationModalPerFrProjOv003(
  page: Page,
): Promise<void> {
  await expect(publishProjectConfirmationModal(page)).toBeVisible();
  await expect(
    publishProjectConfirmationModal(page).getByRole('heading', {
      name: PROJECT_PUBLISH_CONFIRMATION_MODAL_COPY.title,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    publishProjectConfirmationModal(page).getByText(
      PROJECT_PUBLISH_CONFIRMATION_MODAL_COPY.body,
      { exact: true },
    ),
  ).toBeVisible();
  await expect(publishProjectConfirmationModalCancelButton(page)).toBeVisible();
  await expect(publishProjectConfirmationModalConfirmButton(page)).toBeVisible();
}

export async function openPublishProjectConfirmationModal(page: Page): Promise<void> {
  await expect(publishProjectButton(page)).toBeVisible();
  await publishProjectButton(page).click();
  await expectPublishProjectConfirmationModalPerFrProjOv003(page);
}

export function buildProjectDetailApiResponse(
  item: ProjectDetailApiItem,
): { item: ProjectDetailApiItem & Record<string, unknown> } {
  return {
    item: {
      isTemplate: false,
      isFavorite: false,
      ownerId: 1,
      dateCreated: '2026-01-01T00:00:00Z',
      modifiedOn: '2026-01-01T00:00:00Z',
      workflows: [],
      ...item,
    },
  };
}

export async function installProjectUpdateRouteMock(
  page: Page,
  projectUuid: string,
  handler: (route: Route) => Promise<void> | void,
): Promise<void> {
  await page.route(`**/api/project/${projectUuid}`, handler);
}

/** FR-PROJ-OV-003 — mock GET /api/project/{uuid} for initial-load published/unpublished state. */
export async function installProjectDetailRouteMock(
  page: Page,
  projectUuid: string,
  project: ProjectDetailApiItem,
): Promise<void> {
  await installProjectUpdateRouteMock(page, projectUuid, (route) => {
    if (route.request().method() !== 'GET') {
      void route.continue();
      return;
    }

    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildProjectDetailApiResponse(project)),
    });
  });
}

export {
  PROJECT_PUBLISH_SNACKBAR_MESSAGES,
  PROJECT_UNPUBLISH_SNACKBAR_MESSAGES,
  PROJECT_VISIBILITY_STATE_MESSAGES,
};
