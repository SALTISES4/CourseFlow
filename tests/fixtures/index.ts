/**
 * Extended Playwright test entry point.
 * Import `test` and `expect` from here in workflow E2E specs that need the manifest fixture.
 */
export { test, type SeedAccess, type WorkflowHandle } from './workflow';
export { expect, type Locator, type Page } from '@playwright/test';
