import type { APIRequestContext, APIResponse, Page } from '@playwright/test';

import { apiRequestWithAccessToken, authenticatedApiRequest } from './api';

type Workspace = 'project' | 'workflow';

type WorkspaceEditLockResponse = {
  state: 'held' | 'locked' | 'available';
  version: string | null;
};

type WorkspaceEditLockRequest = (path: string, data?: unknown) => Promise<APIResponse>;

async function ensureWorkspaceEditLockWith(
  requestLock: WorkspaceEditLockRequest,
  workspace: Workspace,
  resourceUuid: string,
): Promise<boolean> {
  const acquire = await requestLock(
    `/api/workspace-lock/${workspace}/${resourceUuid}/acquire`,
  );
  if ([403, 404].includes(acquire.status())) {
    return false;
  }
  if (!acquire.ok()) {
    throw new Error(
      `Acquire ${workspace} edit lock failed with HTTP ${acquire.status()}: ${await acquire.text()}`,
    );
  }

  const lock = (await acquire.json()) as WorkspaceEditLockResponse;
  if (lock.state === 'held') {
    return true;
  }
  if (lock.state !== 'locked' || !lock.version) {
    throw new Error(`Acquire ${workspace} edit lock returned unexpected state ${lock.state}.`);
  }

  const takeover = await requestLock(
    `/api/workspace-lock/${workspace}/${resourceUuid}/takeover`,
    { expectedVersion: lock.version },
  );
  if (!takeover.ok()) {
    throw new Error(
      `Take over ${workspace} edit lock failed with HTTP ${takeover.status()}: ${await takeover.text()}`,
    );
  }
  const replacement = (await takeover.json()) as WorkspaceEditLockResponse;
  if (replacement.state !== 'held') {
    throw new Error(`Take over ${workspace} edit lock returned state ${replacement.state}.`);
  }
  return true;
}

/** Acquire or take over a workspace lease for API-driven E2E setup/cleanup. */
export async function ensureWorkspaceEditLock(
  request: APIRequestContext,
  accessToken: string,
  workspace: Workspace,
  resourceUuid: string,
): Promise<boolean> {
  return ensureWorkspaceEditLockWith(
    (path, data) =>
      apiRequestWithAccessToken(request, accessToken, 'POST', path, {
        data,
      }),
    workspace,
    resourceUuid,
  );
}

/** Acquire or take over a workspace lease as the actor authenticated in the page. */
export async function ensurePageWorkspaceEditLock(
  page: Page,
  workspace: Workspace,
  resourceUuid: string,
): Promise<boolean> {
  return ensureWorkspaceEditLockWith(
    (path, data) => authenticatedApiRequest(page, 'POST', path, { data }),
    workspace,
    resourceUuid,
  );
}
