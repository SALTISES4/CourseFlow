import { expect, test, type Page } from '../../fixtures';

import { authenticatedApiRequest } from '../../helpers/api';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import {
  archivedCardChip,
  libraryCardByTitle,
  triggerLibrarySearchAndWait,
} from '../../shared/locators/library';
import {
  projectWorkflowsArchiveToggle,
  waitForProjectWorkflowsLoaded,
} from '../project/project.locators';
import { workflowOverflowButton } from './workflow-copy.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: [
    'actor.teacher',
    'project.primary',
    'workflow.standard_activity',
  ],
  seedAccess: 'disposable-project-copy',
});

function archiveWorkflowMenuItem(page: Page, workflowType: string) {
  return page.getByRole('menuitem', {
    name: `Archive ${workflowType}`,
    exact: true,
  });
}

function archiveWorkflowConfirmButton(page: Page) {
  return page.getByRole('dialog').getByRole('button', {
    name: 'Archive workflow',
    exact: true,
  });
}

test('FR-WF-ARCH-003 / FR-PROJ-WF-003: archiving refreshes both active and archived project listings', async ({
  page,
  workflow,
}) => {
  const projectUuid = workflow.manifest.project_uuid;
  const projectWorkflowsPath = `/project/${projectUuid}/workflows`;
  const workflowCard = libraryCardByTitle(
    page,
    workflow.workflowByType('activity').workflow_title,
  );
  let archived = false;

  try {
    await gotoAuthenticatedShell(page, projectWorkflowsPath);
    await waitForProjectWorkflowsLoaded(page);
    await expect(workflowCard).toBeVisible();

    await workflowCard.click();
    await expect(workflowOverflowButton(page)).toBeVisible({ timeout: 15_000 });
    await workflowOverflowButton(page).click();
    await archiveWorkflowMenuItem(page, workflow.workflowType).click();

    const archiveResponsePromise = page.waitForResponse(
      (response) =>
        response
          .url()
          .endsWith(`/api/workflow/${workflow.workflowUuid}/archive`) &&
        response.request().method() === 'POST',
    );
    const refreshedListingPromise = triggerLibrarySearchAndWait(
      page,
      () => archiveWorkflowConfirmButton(page).click(),
      {
        filters: {
          projectUuid,
          contentType: 'workflow',
          isArchived: null,
        },
      },
    );

    const archiveResponse = await archiveResponsePromise;
    archived = archiveResponse.ok();
    expect(archiveResponse.ok()).toBeTruthy();
    await refreshedListingPromise;

    await expect(page).toHaveURL(
      new RegExp(`/project/${projectUuid}/workflows/?$`),
    );
    await expect(workflowCard).toHaveCount(0);

    await triggerLibrarySearchAndWait(
      page,
      () => projectWorkflowsArchiveToggle(page).click(),
      {
        filters: {
          projectUuid,
          contentType: 'workflow',
          isArchived: true,
        },
      },
    );
    await expect(workflowCard).toBeVisible();
    await expect(archivedCardChip(workflowCard)).toBeVisible();
  } finally {
    if (archived) {
      const restoreResponse = await authenticatedApiRequest(
        page,
        'POST',
        `/api/workflow/${workflow.workflowUuid}/restore`,
      );
      expect(
        restoreResponse.ok(),
        'Restore archived workflow after cache regression test',
      ).toBeTruthy();
    }
  }
});
