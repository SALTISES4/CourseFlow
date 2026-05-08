import path from 'node:path';

/**
 * Path to the saved storage state file, relative to the repo root.
 * Keep in sync with the `storageState` entry in `playwright.config.ts`.
 */
export const AUTH_STORAGE_STATE_RELATIVE = 'playwright/.auth/user.json';

export function resolveAuthStorageStatePath(): string {
  return path.join(process.cwd(), 'playwright', '.auth', 'user.json');
}
