import type { APIRequestContext } from '@playwright/test';

import { getActorAsset, loadWorkflowManifest, type ActorAssetId } from '../helpers/manifest';
import { apiRequestWithAccessToken, readPrimaryActorAccessToken } from '../helpers/api';
import { test as workflowTest } from './workflow';

type ProjectContributorRole = 'editor' | 'commenter' | 'viewer';

export type ProjectContributorSeed = Partial<Record<ActorAssetId, ProjectContributorRole>>;

export type ProjectHandle = {
  uuid: string;
  title: string;
  path: string;
  isPublished: boolean;
};

type ProjectCreateResponse = {
  uuid: string;
  title: string;
  isPublished: boolean;
};

type UserListItem = {
  uuid: string;
  email: string;
};

type ProjectOptions = {
  projectAccess: 'disposable' | undefined;
  projectInitialPublished: boolean;
  projectContributors: ProjectContributorSeed;
};

type ProjectFixtures = {
  project: ProjectHandle;
  projectCleanup: (projectUuid: string) => void;
};

async function expectApiStatus(
  response: Awaited<ReturnType<typeof apiRequestWithAccessToken>>,
  allowedStatuses: number[],
  operation: string,
): Promise<void> {
  if (!allowedStatuses.includes(response.status())) {
    throw new Error(`${operation} failed with HTTP ${response.status()}: ${await response.text()}`);
  }
}

async function cleanupProject(
  request: APIRequestContext,
  accessToken: string,
  projectUuid: string,
): Promise<void> {
  const archive = await apiRequestWithAccessToken(
    request,
    accessToken,
    'POST',
    `/api/project/${projectUuid}/archive`,
  );
  await expectApiStatus(archive, [200, 404], `Archive disposable project ${projectUuid}`);

  const remove = await apiRequestWithAccessToken(
    request,
    accessToken,
    'DELETE',
    `/api/project/${projectUuid}`,
  );
  await expectApiStatus(remove, [200, 404], `Delete disposable project ${projectUuid}`);
}

async function findUserUuid(
  request: APIRequestContext,
  accessToken: string,
  email: string,
): Promise<string> {
  const response = await apiRequestWithAccessToken(
    request,
    accessToken,
    'GET',
    `/api/user?filter=${encodeURIComponent(email)}`,
  );
  await expectApiStatus(response, [200], `Find E2E actor ${email}`);
  const body = (await response.json()) as { items: UserListItem[] };
  const user = body.items.find((item) => item.email === email);
  if (!user) {
    throw new Error(`E2E actor ${email} was not returned by GET /api/user.`);
  }
  return user.uuid;
}

async function addProjectContributor(
  request: APIRequestContext,
  accessToken: string,
  projectUuid: string,
  actorAsset: ActorAssetId,
  role: ProjectContributorRole,
): Promise<void> {
  const actor = getActorAsset(loadWorkflowManifest(), actorAsset);
  const userUuid = await findUserUuid(request, accessToken, actor.email);
  const response = await apiRequestWithAccessToken(
    request,
    accessToken,
    'POST',
    `/api/project/${projectUuid}/team`,
    {
      data: {
        userUuids: [userUuid],
        role,
      },
    },
  );
  await expectApiStatus(response, [200], `Add ${actor.email} to disposable project ${projectUuid}`);
}

export const test = workflowTest.extend<ProjectOptions & ProjectFixtures>({
  projectAccess: [undefined, { option: true }],
  projectInitialPublished: [false, { option: true }],
  projectContributors: [{}, { option: true }],

  projectCleanup: async ({ request }, use) => {
    const accessToken = readPrimaryActorAccessToken();
    const projectUuids: string[] = [];
    await use((projectUuid) => {
      if (!projectUuids.includes(projectUuid)) {
        projectUuids.push(projectUuid);
      }
    });

    for (const projectUuid of [...projectUuids].reverse()) {
      await cleanupProject(request, accessToken, projectUuid);
    }
  },

  project: async (
    { request, projectAccess, projectInitialPublished, projectContributors, projectCleanup },
    use,
    testInfo,
  ) => {
    if (projectAccess !== 'disposable') {
      throw new Error(
        `${testInfo.file} uses the project fixture without declaring ` +
          `test.use({ projectAccess: 'disposable' }).`,
      );
    }

    const accessToken = readPrimaryActorAccessToken();
    const response = await apiRequestWithAccessToken(request, accessToken, 'POST', '/api/project', {
      data: {
        title: `E2E disposable project ${Date.now()}-${Math.random().toString(16).slice(2)}`,
        description: 'Isolated Playwright project fixture.',
        isPublished: projectInitialPublished,
        isTemplate: false,
        disciplines: [],
      },
    });
    await expectApiStatus(response, [200], 'Create disposable project');
    const created = (await response.json()) as ProjectCreateResponse;
    projectCleanup(created.uuid);

    for (const [actorAsset, role] of Object.entries(projectContributors) as Array<
      [ActorAssetId, ProjectContributorRole]
    >) {
      await addProjectContributor(request, accessToken, created.uuid, actorAsset, role);
    }

    await use({
      uuid: created.uuid,
      title: created.title,
      path: `/project/${created.uuid}`,
      isPublished: created.isPublished,
    });
  },
});
