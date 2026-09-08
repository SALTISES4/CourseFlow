import type { APIRequestContext } from '@playwright/test';

import { apiRequestWithAccessToken } from './api';

type Workspace = 'project' | 'workflow';

type WorkspaceEditLockResponse = {
  state: 'held' | 'locked' | 'available';
  version: string | null;
};

/** Acquire or take over a workspace lease for API-driven E2E setup/cleanup. */
export async function ensureWorkspaceEditLock(
  request: APIRequestContext,
  accessToken: string,
  workspace: Workspace,
  resourceUuid: string,
): Promise<boolean> {
  const acquire = await apiRequestWithAccessToken(
    request,
    accessToken,
    'POST',
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

  const takeover = await apiRequestWithAccessToken(
    request,
    accessToken,
    'POST',
    `/api/workspace-lock/${workspace}/${resourceUuid}/takeover`,
    { data: { expectedVersion: lock.version } },
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
