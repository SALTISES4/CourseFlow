import fs from 'node:fs';
import type { APIRequestContext, APIResponse, Page } from '@playwright/test';

import { getTestApiBaseUrl } from './env';
import { resolveAuthStorageStatePath } from '../shared/auth-state';

const ACCESS_TOKEN_STORAGE_KEY = 'cf2_access_token';

type AuthenticatedApiRequestOptions = {
  data?: unknown;
};

type StorageState = {
  origins?: Array<{
    localStorage?: Array<{ name: string; value: string }>;
  }>;
};

/** Read the primary actor token written by Playwright's setup project. */
export function readPrimaryActorAccessToken(): string {
  const storagePath = resolveAuthStorageStatePath();
  if (!fs.existsSync(storagePath)) {
    throw new Error(`Playwright auth storage state not found at ${storagePath}. Run the setup project.`);
  }
  const storage = JSON.parse(fs.readFileSync(storagePath, 'utf-8')) as StorageState;
  for (const origin of storage.origins ?? []) {
    const token = origin.localStorage?.find(({ name }) => name === ACCESS_TOKEN_STORAGE_KEY)?.value;
    if (token) {
      return token;
    }
  }
  throw new Error(`Playwright auth storage state at ${storagePath} has no CourseFlow access token.`);
}

/** Call the API with an explicit token whose identity is stable across browser re-logins. */
export async function apiRequestWithAccessToken(
  request: APIRequestContext,
  accessToken: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options: AuthenticatedApiRequestOptions = {},
): Promise<APIResponse> {
  return request.fetch(`${getTestApiBaseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    data: options.data,
  });
}

/**
 * Call a CourseFlow API endpoint as the user authenticated in the current page.
 *
 * Playwright's APIRequestContext shares cookies with the browser context, but it
 * cannot read localStorage. CourseFlow stores its Bearer token in localStorage,
 * so direct `page.request` calls must copy that token explicitly.
 */
export async function authenticatedApiRequest(
  page: Page,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options: AuthenticatedApiRequestOptions = {},
): Promise<APIResponse> {
  const accessToken = await page.evaluate(
    (storageKey) => window.localStorage.getItem(storageKey),
    ACCESS_TOKEN_STORAGE_KEY,
  );

  if (!accessToken) {
    throw new Error(
      `Cannot call ${method} ${path}: the page has no CourseFlow access token`,
    );
  }

  return page.request.fetch(`${getTestApiBaseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    data: options.data,
  });
}
