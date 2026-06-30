import { test, expect } from '../../fixtures';
import {
  commentsButtonInSectionHeader,
  commentsTabInSidebar,
  editSectionForm,
  sectionHeader,
  sectionHoverMenu,
} from './edit-section.locators';
import {
  workflowCommentsComposerField,
  workflowCommentsTabContent,
} from '../../shared/locators/workflow';

/**
 * Section comments entry paths — FR-WF-COMMENTS-002.
 * Requirements: workflow_comments_tab_requirements_v1.yaml
 */

async function hoverSectionHeader(page: import('@playwright/test').Page, sectionUuid: string) {
  await sectionHeader(page, sectionUuid).hover();
  await expect(sectionHoverMenu(page, sectionUuid)).toBeVisible();
}

test.describe('Comments tab — section host (FR-WF-COMMENTS-002)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await expect(sectionHeader(page, workflow.firstSection().uuid)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-WF-COMMENTS-002: hover comments opens workflowRightSidebarCommentsTab for section', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;

    await hoverSectionHeader(page, sectionUuid);
    await commentsButtonInSectionHeader(page, sectionUuid).click();

    await expect(commentsTabInSidebar(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowCommentsTabContent(page)).toBeVisible();
    await expect(
      page.getByText('Select an item to view or add comments.', { exact: true }),
    ).toHaveCount(0);
  });

  test('FR-WF-COMMENTS-002: comments tab after section selection binds workflowRightSidebarCommentsTabContent', async ({
    page,
    workflow,
  }) => {
    const sectionUuid = workflow.firstSection().uuid;

    await sectionHeader(page, sectionUuid).click();
    await expect(editSectionForm(page)).toBeVisible();
    await commentsTabInSidebar(page).click();

    await expect(commentsTabInSidebar(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowCommentsTabContent(page)).toBeVisible();
    await expect(
      page.getByText('Select an item to view or add comments.', { exact: true }),
    ).toHaveCount(0);

    const hasComposer = (await workflowCommentsComposerField(page).count()) > 0;
    const unavailable = page.getByText('Comments are not available for this item yet.', {
      exact: true,
    });
    if (hasComposer) {
      await expect(workflowCommentsComposerField(page)).toBeVisible();
      return;
    }
    await expect(unavailable).toBeVisible();
  });
});
