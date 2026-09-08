import { expect, test } from '../../fixtures';
import { authenticatedApiRequest } from '../../helpers/api';
import { loginAsWorkflowContributor } from './role.helpers';
import { workflowOverviewPath } from '../../helpers/workflow-navigation';
import {
  workspaceEditLockBanner,
  workspaceEditLockMessage,
  workspaceEditLockTakeoverButton,
} from '../../shared/locators/workspace-edit-lock';
import {
  workflowMetadataFieldTime,
  workflowOverviewView,
} from './workflow-overview.locators';

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

async function readWorkflowLock(page: Parameters<typeof authenticatedApiRequest>[0], workflowUuid: string) {
  const response = await authenticatedApiRequest(
    page,
    'GET',
    `/api/workspace-lock/workflow/${workflowUuid}`,
  );
  expect(response.ok(), await response.text()).toBe(true);
  return (await response.json()) as LockResponse;
}

test('FR-WS-LOCK-001/003/004/005: workflow takeover transfers editability and the prior editor detects loss', async ({
  browser,
  page,
  workflow,
}, testInfo) => {
  const overviewPath = workflowOverviewPath(workflow.path);
  await page.goto(overviewPath);
  await expect(workflowOverviewView(page)).toBeVisible();
  await expect(workflowMetadataFieldTime(page)).toBeEditable();
  await expect(workspaceEditLockBanner(page)).toHaveCount(0);

  const ownerLock = await readWorkflowLock(page, workflow.workflowUuid);
  expect(ownerLock.state).toBe('held');
  expect(ownerLock.holder).not.toBeNull();

  const editorContext = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    storageState: { cookies: [], origins: [] },
  });
  try {
    const editorPage = await editorContext.newPage();
    await loginAsWorkflowContributor(editorPage, workflow, 'editor');
    await editorPage.goto(overviewPath);

    await expect(workspaceEditLockBanner(editorPage)).toBeVisible();
    await expect(workspaceEditLockMessage(editorPage)).toHaveText(
      `${ownerLock.holder!.displayName} is currently editing this page. Do you wish to take over?`,
    );
    await expect(workspaceEditLockTakeoverButton(editorPage)).toHaveText('Yes');
    await expect(workspaceEditLockTakeoverButton(editorPage)).toBeEnabled();
    await expect(workflowMetadataFieldTime(editorPage)).not.toBeEditable();

    await workspaceEditLockTakeoverButton(editorPage).click();
    await expect(workspaceEditLockBanner(editorPage)).toHaveCount(0);
    await expect(workflowMetadataFieldTime(editorPage)).toBeEditable();

    const editorLock = await readWorkflowLock(editorPage, workflow.workflowUuid);
    expect(editorLock.state).toBe('held');
    expect(editorLock.holder).not.toBeNull();

    await expect(workspaceEditLockMessage(page)).toHaveText(
      `${editorLock.holder!.displayName} is currently editing this page. Do you wish to take over?`,
      { timeout: 10_000 },
    );
    await expect(workflowMetadataFieldTime(page)).not.toBeEditable();
  } finally {
    await editorContext.close();
  }
});
