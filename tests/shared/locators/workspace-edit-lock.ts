import type { Locator, Page } from '@playwright/test';

export function workspaceEditLockBanner(page: Page): Locator {
  return page.getByTestId('workspace-edit-lock-banner');
}

export function workspaceEditLockMessage(page: Page): Locator {
  return page.getByTestId('workspace-edit-lock-message');
}

export function workspaceEditLockTakeoverButton(page: Page): Locator {
  return page.getByTestId('workspace-edit-lock-takeover');
}
