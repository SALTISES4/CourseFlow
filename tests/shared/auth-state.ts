import path from 'node:path';
import fs from 'node:fs';

/**
 * Path to the saved storage state file, relative to `tests/` (Playwright config directory).
 * Keep in sync with the `storageState` entry in `playwright.config.ts`.
 */
export const AUTH_STORAGE_STATE_RELATIVE = 'playwright/.auth/user.json';

export function resolveAuthStorageStatePath(): string {
  return path.join(process.cwd(), 'playwright', '.auth', 'user.json');
}

/** Ensures `playwright/.auth/` exists before writing storage state. */
export function ensureAuthStorageDir(): void {
  fs.mkdirSync(path.dirname(resolveAuthStorageStatePath()), { recursive: true });
}
