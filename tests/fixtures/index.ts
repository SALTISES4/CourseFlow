import { test as baseTest, expect } from '@playwright/test';

/**
 * Default test export. Replace with `baseTest.extend({ ... })` when you add
 * custom fixtures (typed `page`, role-specific storage, API clients, etc.).
 */
export const test = baseTest;
export { expect };
