import { test, expect, type Page } from '../../../fixtures';
import { loginAsTestUser } from '../../../helpers/auth';
import {
  composeComment,
  expectCommentDeleteLinkHidden,
  expectCommentDeleteLinkVisible,
  openSectionCommentsViaHover,
  requireCommentsComposer,
} from '../comments-tab.helpers';
import { loginAsWorkflowContributor } from '../role.helpers';
import { workflowCommentsTabListItemBody } from '../../../shared/locators/workflow';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.editor'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Comments delete permissions — FR-WF-COMMENTS-007 (own-comment only).
 * Requirements: workflow_comments_tab_requirements_v1.yaml
 */

async function openBlankSectionComments(
  page: Page,
  workflow: { blankSection: () => { uuid: string }; path: string },
): Promise<string> {
  await page.goto(workflow.path);
  const sectionUuid = workflow.blankSection().uuid;
  await openSectionCommentsViaHover(page, sectionUuid);
  await requireCommentsComposer(page);
  return sectionUuid;
}

test.describe('Comments tab — delete permissions (FR-WF-COMMENTS-007)', () => {
  test('FR-WF-COMMENTS-007: owner sees no delete link on another user comment', async ({
    page,
    workflow,
  }) => {
    const commenterBody = `E2E commenter comment ${Date.now()}`;

    await loginAsWorkflowContributor(page, workflow, 'commenter');
    await openBlankSectionComments(page, workflow);
    await composeComment(page, commenterBody);

    await loginAsTestUser(page);
    await openBlankSectionComments(page, workflow);
    await expectCommentDeleteLinkHidden(page, commenterBody);
  });

  test('FR-WF-COMMENTS-007: editor sees no delete link on another user comment', async ({
    page,
    workflow,
  }) => {
    const commenterBody = `E2E commenter comment ${Date.now()}`;

    await loginAsWorkflowContributor(page, workflow, 'commenter');
    await openBlankSectionComments(page, workflow);
    await composeComment(page, commenterBody);

    await loginAsWorkflowContributor(page, workflow, 'editor');
    await openBlankSectionComments(page, workflow);
    await expectCommentDeleteLinkHidden(page, commenterBody);
  });

  test('FR-WF-COMMENTS-007: commenter sees delete on own comment but not on another user comment', async ({
    page,
    workflow,
  }) => {
    const ownerBody = `E2E owner comment ${Date.now()}`;
    const commenterBody = `E2E commenter comment ${Date.now()}`;

    await openBlankSectionComments(page, workflow);
    await composeComment(page, ownerBody);

    await loginAsWorkflowContributor(page, workflow, 'commenter');
    await openBlankSectionComments(page, workflow);
    await composeComment(page, commenterBody);

    await expect(workflowCommentsTabListItemBody(page, ownerBody)).toBeVisible();
    await expectCommentDeleteLinkVisible(page, commenterBody);
    await expectCommentDeleteLinkHidden(page, ownerBody);
  });

  test('FR-WF-COMMENTS-007: owner sees delete on own comment but not on another user comment', async ({
    page,
    workflow,
  }) => {
    const ownerBody = `E2E owner comment ${Date.now()}`;
    const commenterBody = `E2E commenter comment ${Date.now()}`;

    await loginAsWorkflowContributor(page, workflow, 'commenter');
    await openBlankSectionComments(page, workflow);
    await composeComment(page, commenterBody);

    await loginAsTestUser(page);
    await openBlankSectionComments(page, workflow);
    await composeComment(page, ownerBody);

    await expectCommentDeleteLinkVisible(page, ownerBody);
    await expectCommentDeleteLinkHidden(page, commenterBody);
  });
});
