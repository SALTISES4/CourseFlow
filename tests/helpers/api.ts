import type { APIResponse, Page } from '@playwright/test';

import { getTestApiBaseUrl } from './env';

const ACCESS_TOKEN_STORAGE_KEY = 'cf2_access_token';

type AuthenticatedApiRequestOptions = {
  data?: unknown;
};

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
