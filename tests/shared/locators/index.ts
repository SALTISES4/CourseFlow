/**
 * Shared Playwright locators — TypeScript implementation of
 * tests/docs/requirements/features/shared/canonical_locators.yaml.
 *
 * Domain modules under tests/e2e/<domain>/*.locators.ts re-export from here
 * and add domain-only uiObjects.
 */

export * from './global';
export * from './navigation';
export * from './workspace-access';
export * from './library';
export * from './workflow';

/** @deprecated Use myLibraryNavItem — canonical alias retained for smoke tests. */
export { myLibraryNavItem as panelLibrary } from './navigation';
