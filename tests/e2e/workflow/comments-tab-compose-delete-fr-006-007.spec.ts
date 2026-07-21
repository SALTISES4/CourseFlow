import { test, expect } from '../../fixtures';
import {
  workflowCommentsComposerField,
  workflowCommentsTabComposerSubmitButton,
  workflowCommentsTabListItemBody,
  workflowCommentsTabListItemHeaderForBody,
  workflowCommentsTabListItemDeleteLink,
  workflowRightSidebarCommentsTabContent,
} from '../../shared/locators/workflow';
import { openSectionCommentsViaHover, requireSectionCommentsComposer } from './comments-tab.helpers';

/**
 * Comments compose and delete — FR-WF-COMMENTS-006, FR-WF-COMMENTS-007 (section host, partial).
 * Requirements: workflow_comments_tab_requirements_v1.yaml
 */

test.describe('Comments tab — compose and delete (FR-WF-COMMENTS-006, FR-WF-COMMENTS-007)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await openSectionCommentsViaHover(page, workflow.blankSection().uuid);
    await requireSectionCommentsComposer(page);
  });

  test('FR-WF-COMMENTS-006: bound thread shows Comments title and disabled submit when composer empty', async ({
    page,
  }) => {
    await expect(workflowRightSidebarCommentsTabContent(page)).toBeVisible();
    await expect(workflowCommentsComposerField(page)).toHaveValue('');
    await expect(workflowCommentsTabComposerSubmitButton(page)).toBeDisabled();
  });

  test('FR-WF-COMMENTS-006: compose adds workflowCommentsTabListItem and clears composer', async ({
    page,
  }) => {
    const body = `E2E comment ${Date.now()}`;

    await workflowCommentsComposerField(page).fill(body);
    await expect(workflowCommentsTabComposerSubmitButton(page)).toBeEnabled();
    await workflowCommentsTabComposerSubmitButton(page).click();

    await expect(workflowCommentsTabListItemBody(page, body)).toBeVisible({ timeout: 15_000 });
    await expect(workflowCommentsComposerField(page)).toHaveValue('');
    await expect(workflowCommentsTabComposerSubmitButton(page)).toBeDisabled();

    await workflowCommentsTabListItemDeleteLink(page, body).click();
    await expect(workflowCommentsTabListItemBody(page, body)).toHaveCount(0);
  });

  test('FR-WF-COMMENTS-007: delete own comment removes list item and shows snackbar', async ({
    page,
  }) => {
    const body = `E2E delete ${Date.now()}`;

    await workflowCommentsComposerField(page).fill(body);
    await workflowCommentsTabComposerSubmitButton(page).click();
    await expect(workflowCommentsTabListItemBody(page, body)).toBeVisible({ timeout: 15_000 });

    await workflowCommentsTabListItemDeleteLink(page, body).click();

    await expect(workflowCommentsTabListItemBody(page, body)).toHaveCount(0, { timeout: 15_000 });
    await expect(
      page.getByText('Your comment has been successfully deleted').last(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('FR-WF-COMMENTS-006: composer labels match FR copy', async ({ page }) => {
    await expect(workflowCommentsComposerField(page)).toHaveAccessibleName(
      'Add a comment',
    );
    await expect(workflowCommentsTabComposerSubmitButton(page)).toHaveText(
      'Add comment',
    );
  });

  test('FR-WF-COMMENTS-006: author header uses profile name and relative time', async ({
    page,
  }) => {
    const body = `E2E author header ${Date.now()}`;
    await workflowCommentsComposerField(page).fill(body);
    await workflowCommentsTabComposerSubmitButton(page).click();

    await expect(workflowCommentsTabListItemHeaderForBody(page, body)).toHaveText(
      'testteacher Teacher • just now',
    );
    await workflowCommentsTabListItemDeleteLink(page, body).click();
    await expect(workflowCommentsTabListItemBody(page, body)).toHaveCount(0);
  });

  test('FR-WF-COMMENTS-007: delete snackbar uses FR copy', async ({ page }) => {
    const body = `E2E delete copy ${Date.now()}`;
    await workflowCommentsComposerField(page).fill(body);
    await workflowCommentsTabComposerSubmitButton(page).click();
    await expect(workflowCommentsTabListItemBody(page, body)).toBeVisible();

    await workflowCommentsTabListItemDeleteLink(page, body).click();
    await expect(
      page.getByText('Your comment has been successfully deleted').last(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
