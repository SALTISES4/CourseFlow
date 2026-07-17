export function requireTestCredentials(): { username: string; password: string } {
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  if (!username?.trim() || !password) {
    throw new Error('Missing TEST_USERNAME or TEST_PASSWORD (required for auth setup).');
  }
  return { username, password };
}

/** Django API origin used by direct Playwright request-context calls. */
export function getTestApiBaseUrl(): string {
  return (process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/+$/, '');
}

import { getWorkflowPath } from './manifest';

export function getWorkflowPathFromEnv(): string {
  return getWorkflowPath();
}
