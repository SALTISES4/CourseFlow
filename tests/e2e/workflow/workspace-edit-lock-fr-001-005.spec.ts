import { expect, test } from '../../fixtures';
import { authenticatedApiRequest } from '../../helpers/api';
import type { WorkflowFixtureType } from '../../helpers/manifest';
import {
  fetchMyProfileSettings,
  patchMyProfileSettings,
} from '../../helpers/profile-settings-page';
import { loginAsWorkflowContributor } from './role.helpers';
import { workflowOverviewPath } from '../../helpers/workflow-navigation';
import {
  cardEditLockTag,
  networkActivityLoader,
  workspaceEditLockLostAlert,
  workspaceEditLockTakeoverCancelButton,
  workspaceEditLockTakeoverButton,
  workspaceEditLockTakeoverConfirmButton,
  workspaceEditLockTakeoverDialog,
  workspaceEditLockTakeoverDialogMessage,
} from '../../shared/locators/workspace-edit-lock';
import { libraryWorkflowCardByUuid } from '../../shared/locators/library';
import {
  editWorkflowDialog,
  editWorkflowFormCancelButton,
  openEditWorkflowDialog,
  workflowEditTitleField,
} from './workflow-edit-form.locators';
import { workflowMetadataFieldTime, workflowOverviewView } from './workflow-overview.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  actorAsset: 'actor.teacher',
  seedDependencies: ['actor.editor'],
  seedAccess: 'disposable-copy',
});

type LockResponse = {
  state: 'held' | 'locked' | 'available';
  holder: { displayName: string } | null;
};

async function readWorkflowLock(
  page: Parameters<typeof authenticatedApiRequest>[0],
  workflowUuid: string,
) {
  const response = await authenticatedApiRequest(
    page,
    'GET',
    `/api/workspace-lock/workflow/${workflowUuid}`,
  );
  expect(response.ok(), await response.text()).toBe(true);
  return (await response.json()) as LockResponse;
}

async function refreshWorkflowLock(
  page: Parameters<typeof authenticatedApiRequest>[0],
  workflowUuid: string,
) {
  const response = await authenticatedApiRequest(
    page,
    'POST',
    `/api/workspace-lock/workflow/${workflowUuid}/refresh`,
  );
  expect(response.ok(), await response.text()).toBe(true);
  const lock = (await response.json()) as LockResponse;
  expect(lock.state).toBe('held');
}

test('FR-WS-LOCK-001/003/004/005: card tag, confirmed takeover, and prior-editor warning match the design', async ({
  browser,
  page,
  workflow,
}, testInfo) => {
  test.setTimeout(60_000);
  const overviewPath = workflowOverviewPath(workflow.path);
  await page.goto(overviewPath);
  await expect(workflowOverviewView(page)).toBeVisible();
  await expect(workflowMetadataFieldTime(page)).toBeEditable();
  await expect(workspaceEditLockTakeoverButton(page)).toHaveCount(0);
  await expect(workspaceEditLockLostAlert(page)).toHaveCount(0);

  const ownerLock = await readWorkflowLock(page, workflow.workflowUuid);
  expect(ownerLock.state).toBe('held');
  expect(ownerLock.holder).not.toBeNull();

  const editorContext = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    storageState: { cookies: [], origins: [] },
  });
  let editorProfile: Awaited<ReturnType<typeof fetchMyProfileSettings>> | null = null;
  try {
    const editorPage = await editorContext.newPage();
    await loginAsWorkflowContributor(editorPage, workflow, 'editor');
    editorProfile = await fetchMyProfileSettings(editorPage);
    await patchMyProfileSettings(editorPage, {
      ...editorProfile,
      languagePreference: 'en',
    });
    await editorPage.reload();
    await expect(editorPage.locator('html')).toHaveAttribute('lang', 'en-CA', {
      timeout: 15_000,
    });

    await editorPage.goto(`/project/${workflow.manifest.project_uuid}/workflows`);
    const card = libraryWorkflowCardByUuid(editorPage, workflow.workflowUuid);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(cardEditLockTag(card)).toHaveText(
      `${ownerLock.holder!.displayName} is currently editing`,
    );

    // A backgrounded Chromium tab may throttle the owner's 5-second timer past
    // the 15-second lease. Keep this explicit-takeover scenario deterministic.
    await refreshWorkflowLock(page, workflow.workflowUuid);
    await editorPage.goto(overviewPath);

    await expect(workspaceEditLockTakeoverButton(editorPage)).toHaveText('Take over editing');
    await expect(workspaceEditLockTakeoverButton(editorPage)).toBeEnabled();
    await expect(workflowMetadataFieldTime(editorPage)).not.toBeEditable();
    await expect(workspaceEditLockLostAlert(editorPage)).toHaveCount(0);

    await workspaceEditLockTakeoverButton(editorPage).click();
    await expect(workspaceEditLockTakeoverDialog(editorPage)).toBeVisible();
    await expect(workspaceEditLockTakeoverDialog(editorPage).getByRole('heading')).toHaveText(
      'Take over editing?',
    );
    await expect(workspaceEditLockTakeoverDialogMessage(editorPage)).toHaveText(
      `${ownerLock.holder!.displayName} is currently editing this document. Taking over will unlock the file for you and switch ${ownerLock.holder!.displayName} to read-only mode.`,
    );
    await workspaceEditLockTakeoverCancelButton(editorPage).click();
    await expect(workspaceEditLockTakeoverDialog(editorPage)).toHaveCount(0);
    await expect(workflowMetadataFieldTime(editorPage)).not.toBeEditable();

    await workspaceEditLockTakeoverButton(editorPage).click();
    await workspaceEditLockTakeoverConfirmButton(editorPage).click();
    await expect(workspaceEditLockTakeoverDialog(editorPage)).toHaveCount(0);
    await expect(workspaceEditLockTakeoverButton(editorPage)).toHaveCount(0);
    await expect(workflowMetadataFieldTime(editorPage)).toBeEditable();

    const editorLock = await readWorkflowLock(editorPage, workflow.workflowUuid);
    expect(editorLock.state).toBe('held');
    expect(editorLock.holder).not.toBeNull();

    await expect(workspaceEditLockLostAlert(page)).toHaveText(
      `${editorLock.holder!.displayName} took over editing and you are now in read-only mode.`,
      { timeout: 10_000 },
    );
    await expect(workspaceEditLockTakeoverButton(page)).toHaveText('Take over editing');
    await expect(workflowMetadataFieldTime(page)).not.toBeEditable();
  } finally {
    if (editorProfile) {
      const editorPage = editorContext.pages()[0];
      if (editorPage) {
        await patchMyProfileSettings(editorPage, editorProfile);
      }
    }
    await editorContext.close();
  }
});

test('FR-WS-LOCK-004: takeover confirmation copy is localized in French', async ({
  browser,
  page,
  workflow,
}, testInfo) => {
  const overviewPath = workflowOverviewPath(workflow.path);
  await page.goto(overviewPath);
  await expect(workflowOverviewView(page)).toBeVisible();
  const ownerLock = await readWorkflowLock(page, workflow.workflowUuid);

  const editorContext = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    storageState: { cookies: [], origins: [] },
  });
  const editorPage = await editorContext.newPage();
  await loginAsWorkflowContributor(editorPage, workflow, 'editor');
  const profile = await fetchMyProfileSettings(editorPage);
  try {
    await patchMyProfileSettings(editorPage, {
      ...profile,
      languagePreference: 'fr',
    });
    await editorPage.reload();
    await expect(editorPage.locator('html')).toHaveAttribute('lang', 'fr-CA', {
      timeout: 15_000,
    });
    await editorPage.goto(overviewPath);

    await expect(workspaceEditLockTakeoverButton(editorPage)).toHaveText(
      'Prendre le contrôle de la modification',
    );
    await workspaceEditLockTakeoverButton(editorPage).click();
    await expect(workspaceEditLockTakeoverDialog(editorPage).getByRole('heading')).toHaveText(
      'Prendre le contrôle de la modification?',
    );
    await expect(workspaceEditLockTakeoverDialogMessage(editorPage)).toHaveText(
      `${ownerLock.holder!.displayName} modifie actuellement ce document. Prendre le contrôle déverrouillera le fichier pour vous et fera passer ${ownerLock.holder!.displayName} en mode lecture seule.`,
    );
    await expect(workspaceEditLockTakeoverCancelButton(editorPage)).toHaveText('Annuler');
    await expect(workspaceEditLockTakeoverConfirmButton(editorPage)).toHaveText(
      'Prendre le contrôle de la modification',
    );
  } finally {
    await patchMyProfileSettings(editorPage, profile);
    await editorContext.close();
  }
});

test('FR-WS-LOCK-002: heartbeat preserves a dirty form and does not show the global loader', async ({
  page,
  workflow,
}) => {
  await page.goto(workflowOverviewPath(workflow.path));
  await expect(workflowOverviewView(page)).toBeVisible();
  await openEditWorkflowDialog(page, workflow.workflowType as WorkflowFixtureType);
  await expect(networkActivityLoader(page)).toHaveCount(0);

  let workflowReloads = 0;
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (request.method() === 'GET' && pathname === `/api/workflow/${workflow.workflowUuid}`) {
      workflowReloads += 1;
    }
  });
  await page.evaluate(() => {
    const observedWindow = window as typeof window & {
      workspaceLockLoaderSeen?: boolean;
      workspaceLockLoaderObserver?: MutationObserver;
    };
    observedWindow.workspaceLockLoaderSeen = false;
    const recordLoader = () => {
      if (document.querySelector('[data-testid="network-activity-loader"]')) {
        observedWindow.workspaceLockLoaderSeen = true;
      }
    };
    observedWindow.workspaceLockLoaderObserver = new MutationObserver(recordLoader);
    observedWindow.workspaceLockLoaderObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    recordLoader();
  });

  const dirtyTitle = `Unsaved heartbeat draft ${Date.now()}`;
  const heartbeat = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname ===
        `/api/workspace-lock/workflow/${workflow.workflowUuid}/refresh` && response.ok(),
    { timeout: 10_000 },
  );
  await workflowEditTitleField(page).fill(dirtyTitle);
  await heartbeat;

  await expect(editWorkflowDialog(page)).toBeVisible();
  await expect(workflowEditTitleField(page)).toHaveValue(dirtyTitle);
  expect(workflowReloads).toBe(0);
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { workspaceLockLoaderSeen?: boolean }).workspaceLockLoaderSeen,
    ),
  ).toBe(false);
  await expect(networkActivityLoader(page)).toHaveCount(0);
  await editWorkflowFormCancelButton(page).click();
});
