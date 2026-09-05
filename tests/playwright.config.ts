import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({
  path: path.resolve(__dirname, '.env'),
  quiet: true,
});

import {defineConfig, devices} from '@playwright/test';
import {AUTH_STORAGE_STATE_RELATIVE} from './shared/auth-state';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright config for CourseFlow E2E — run from `tests/` (paths are relative to this file).
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: ".",
  globalSetup: require.resolve('./setup/global-setup'),
  /* Chromium project: e2e specs only. Setup project overrides testDir/testMatch below. */
  testMatch: ["e2e/**/*.spec.ts"],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Bound broken CI runs while preserving the complete local failure signal. */
  globalTimeout: process.env.CI ? 60 * 60 * 1_000 : undefined,
  maxFailures: process.env.CI ? 10 : 0,
  /* One retry is enough to classify a CI failure as flaky. */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['line'],
        ['html', {
          outputFolder: 'playwright-report',
          open: 'never',
        }],
        ['junit', {
          outputFile: process.env.PLAYWRIGHT_JUNIT_OUTPUT_FILE ?? 'test-results/junit.xml',
        }],
      ]
    : [
        ['list'],
        ['html', {
          outputFolder: 'playwright-report',
          open: 'never',
        }],
        ['allure-playwright', {
          resultsDir: 'allure-results',
        }],
      ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Vite dev server (react/vite.config.js port 3000). Override via PLAYWRIGHT_BASE_URL. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
   // trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup",
      testDir: "./setup",
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_STORAGE_STATE_RELATIVE,
      },
      dependencies: ["setup"],
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
