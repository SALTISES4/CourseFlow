import { test, expect } from '../../fixtures';
import {
  channelUuidByTitle,
  composeComment,
  deleteOwnComment,
  firstWorkflowNodeUuid,
  gotoOutcomesView,
  openChannelCommentsViaHover,
  openNodeCommentsViaHover,
  openOutcomeCommentsViaHover,
  requireCommentsComposer,
} from './comments-tab.helpers';
import {
  workflowCommentsComposerField,
  workflowCommentsTabComposerSubmitButton,
  workflowRightSidebarCommentsTabContent,
} from '../../shared/locators/workflow';

/**
 * Comments compose and delete — FR-WF-COMMENTS-006, FR-WF-COMMENTS-007 (node, channel, outcome).
 * Requirements: workflow_comments_tab_requirements_v1.yaml
 */

const E2E_CHANNEL_A = 'E2E Channel A';
const E2E_OUTCOME_TITLE = 'E2E Outcome 1';

test.describe('Comments tab — node host compose/delete (FR-WF-COMMENTS-006, FR-WF-COMMENTS-007)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    await openNodeCommentsViaHover(page, nodeUuid);
    await requireCommentsComposer(page);
  });

  test('FR-WF-COMMENTS-006: node host composer empty submit disabled', async ({ page }) => {
    await expect(workflowRightSidebarCommentsTabContent(page)).toBeVisible();
    await expect(workflowCommentsComposerField(page)).toHaveValue('');
    await expect(workflowCommentsTabComposerSubmitButton(page)).toBeDisabled();
  });

  test('FR-WF-COMMENTS-006: node host compose adds list item', async ({ page }) => {
    const body = `E2E node comment ${Date.now()}`;
    await composeComment(page, body);
    await expect(workflowCommentsComposerField(page)).toHaveValue('');
  });

  test('FR-WF-COMMENTS-007: node host delete own comment', async ({ page }) => {
    const body = `E2E node delete ${Date.now()}`;
    await composeComment(page, body);
    await deleteOwnComment(page, body);
  });
});

test.describe('Comments tab — channel host compose/delete (FR-WF-COMMENTS-006, FR-WF-COMMENTS-007)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
    await openChannelCommentsViaHover(page, channelUuid);
    await requireCommentsComposer(page);
  });

  test('FR-WF-COMMENTS-006: channel host compose adds list item', async ({ page }) => {
    const body = `E2E channel comment ${Date.now()}`;
    await composeComment(page, body);
  });

  test('FR-WF-COMMENTS-007: channel host delete own comment', async ({ page }) => {
    const body = `E2E channel delete ${Date.now()}`;
    await composeComment(page, body);
    await deleteOwnComment(page, body);
  });
});

test.describe('Comments tab — outcome host compose/delete (FR-WF-COMMENTS-006, FR-WF-COMMENTS-007)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, workflow }) => {
    if (workflow.outcomes.length === 0) {
      test.skip(true, 'E2E fixture has no outcomes; run just django-seed-e2e-tests.');
    }
    await gotoOutcomesView(page, workflow.path);
    await openOutcomeCommentsViaHover(page, E2E_OUTCOME_TITLE);
    await requireCommentsComposer(page);
  });

  test('FR-WF-COMMENTS-006: outcome host compose adds list item', async ({ page }) => {
    const body = `E2E outcome comment ${Date.now()}`;
    await composeComment(page, body);
  });

  test('FR-WF-COMMENTS-007: outcome host delete own comment', async ({ page }) => {
    const body = `E2E outcome delete ${Date.now()}`;
    await composeComment(page, body);
    await deleteOwnComment(page, body);
  });
});
