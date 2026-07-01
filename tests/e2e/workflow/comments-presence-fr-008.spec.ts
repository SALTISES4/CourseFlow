import { test } from '../../fixtures';

/**
 * Comments presence indicator — FR-WF-COMMENTS-008.
 * Requirements: workflow_comments_tab_requirements_v1.yaml
 */

test.describe('Comments presence indicator (FR-WF-COMMENTS-008)', () => {
  test('FR-WF-COMMENTS-008: workflowCommentsPresenceIndicator on hover menus deferred', async () => {
    test.skip(
      true,
      'Green comment-count badge on node/section/channel hover Comments item is not implemented; threadCommentCounts unused in UI.',
    );
  });
});
