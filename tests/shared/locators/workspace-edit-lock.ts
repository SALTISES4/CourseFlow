import type { Locator, Page } from '@playwright/test';

export function workspaceEditLockTakeoverButton(page: Page): Locator {
  return page.getByTestId('workspace-edit-lock-takeover');
}

export function workspaceEditLockTakeoverDialog(page: Page): Locator {
  return page.getByTestId('workspace-edit-lock-takeover-dialog');
}

export function workspaceEditLockTakeoverDialogMessage(page: Page): Locator {
  return page.getByTestId('workspace-edit-lock-takeover-dialog-message');
}

export function workspaceEditLockTakeoverCancelButton(page: Page): Locator {
  return page.getByTestId('workspace-edit-lock-takeover-cancel');
}

export function workspaceEditLockTakeoverConfirmButton(page: Page): Locator {
  return page.getByTestId('workspace-edit-lock-takeover-confirm');
}

export function workspaceEditLockLostAlert(page: Page): Locator {
  return page.getByTestId('workspace-edit-lock-lost-alert');
}

export function cardEditLockTag(card: Locator): Locator {
  return card.getByTestId('card-edit-lock');
}

export function networkActivityLoader(page: Page): Locator {
  return page.getByTestId('network-activity-loader');
}
