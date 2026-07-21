import { expect, type APIResponse, type Page } from '@playwright/test';

import { authenticatedApiRequest } from './api';

export type LibraryLifecycleFixture = {
  projectUuid: string;
  projectTitle: string;
  workflowUuid?: string;
  workflowTitle?: string;
};

type ResourceCreateResponse = {
  uuid: string;
  title: string;
};

function uniqueTitle(label: string): string {
  return `E2E FR-LIB-006 ${label} ${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function expectSuccessfulResponse(
  response: APIResponse,
  operation: string,
): Promise<void> {
  expect(
    response.ok(),
    `${operation} failed with HTTP ${response.status()}: ${await response.text()}`,
  ).toBeTruthy();
}

async function createProject(page: Page, label: string): Promise<ResourceCreateResponse> {
  const response = await authenticatedApiRequest(page, 'POST', '/api/project', {
    data: {
      title: uniqueTitle(label),
      description: 'Isolated Playwright fixture for FR-LIB-006.',
      isPublished: false,
      isTemplate: false,
      disciplines: [],
    },
  });
  await expectSuccessfulResponse(response, 'Create project fixture');
  return (await response.json()) as ResourceCreateResponse;
}

async function createWorkflow(
  page: Page,
  projectUuid: string,
  label: string,
): Promise<ResourceCreateResponse> {
  const response = await authenticatedApiRequest(page, 'POST', '/api/workflow', {
    data: {
      projectUuid,
      title: uniqueTitle(label),
      workflowType: 'activity',
      description: 'Isolated Playwright fixture for FR-LIB-006.',
    },
  });
  await expectSuccessfulResponse(response, 'Create workflow fixture');
  return (await response.json()) as ResourceCreateResponse;
}

async function archiveProject(page: Page, projectUuid: string): Promise<void> {
  const response = await authenticatedApiRequest(
    page,
    'POST',
    `/api/project/${projectUuid}/archive`,
  );
  await expectSuccessfulResponse(response, 'Archive project fixture');
}

async function archiveWorkflow(page: Page, workflowUuid: string): Promise<void> {
  const response = await authenticatedApiRequest(
    page,
    'POST',
    `/api/workflow/${workflowUuid}/archive`,
  );
  await expectSuccessfulResponse(response, 'Archive workflow fixture');
}

export async function createArchivedProjectFixture(
  page: Page,
  label: string,
  options: { withWorkflow?: boolean } = {},
): Promise<LibraryLifecycleFixture> {
  const project = await createProject(page, `${label} project`);
  const workflow = options.withWorkflow
    ? await createWorkflow(page, project.uuid, `${label} workflow`)
    : undefined;

  await archiveProject(page, project.uuid);
  return {
    projectUuid: project.uuid,
    projectTitle: project.title,
    workflowUuid: workflow?.uuid,
    workflowTitle: workflow?.title,
  };
}

export async function createArchivedWorkflowFixture(
  page: Page,
  label: string,
): Promise<LibraryLifecycleFixture> {
  const project = await createProject(page, `${label} project`);
  const workflow = await createWorkflow(page, project.uuid, `${label} workflow`);
  await archiveWorkflow(page, workflow.uuid);

  return {
    projectUuid: project.uuid,
    projectTitle: project.title,
    workflowUuid: workflow.uuid,
    workflowTitle: workflow.title,
  };
}

/**
 * Remove an isolated project regardless of whether its lifecycle test restored,
 * retained, or already permanently deleted it.
 */
export async function cleanupLibraryLifecycleFixture(
  page: Page,
  fixture: LibraryLifecycleFixture,
): Promise<void> {
  const archiveResponse = await authenticatedApiRequest(
    page,
    'POST',
    `/api/project/${fixture.projectUuid}/archive`,
  );
  expect(
    [200, 403, 404],
    `Unexpected cleanup archive status ${archiveResponse.status()}: ${await archiveResponse.text()}`,
  ).toContain(archiveResponse.status());

  const deleteResponse = await authenticatedApiRequest(
    page,
    'DELETE',
    `/api/project/${fixture.projectUuid}`,
  );
  expect(
    [200, 404],
    `Unexpected cleanup delete status ${deleteResponse.status()}: ${await deleteResponse.text()}`,
  ).toContain(deleteResponse.status());
}
